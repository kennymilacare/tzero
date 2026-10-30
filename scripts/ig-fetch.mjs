#!/usr/bin/env node
/* ===========================================================
   ig-fetch.mjs — pull Instagram posts into assets/data/manual.json.

   Run:  node scripts/ig-fetch.mjs <ig-url> [<ig-url> ...]
         node scripts/ig-fetch.mjs --file urls.txt
         node scripts/ig-fetch.mjs --latest          the account's newest posts
         node scripts/ig-fetch.mjs --latest=12      the twelve newest
         node scripts/ig-fetch.mjs --login           sign in to Instagram

   For each post it reads the caption, the image and the date, then
   writes an entry into assets/data/manual.json. Run manual-post.mjs
   afterwards to regenerate the feed the site reads.

   --latest finds the posts by itself: it opens the account's profile
   page in the saved session and reads the post links off it, so no
   links have to be pasted by hand. Posts already stored are skipped
   unless --refresh is given. It needs a signed-in session — run
   --login first if the session has expired.

   Re-running with the same URL updates that post instead of adding a
   second copy. Any wording you wrote by hand — the headline, the
   summary, the translations — is left alone; only the caption and the
   image are refreshed.

   Instagram's public pages need JavaScript to render, so this drives
   a headless Chrome over the DevTools Protocol (Node's built-in
   WebSocket — no npm packages). Chrome has to be installed; the
   script says so plainly if it is not.

   The date comes from the post's shortcode, which encodes a
   timestamped media id — Instagram does not render the date on the
   embed, but the id carries it.
   =========================================================== */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { deriveExcerpt, deriveTitle } from './lib/feed.mjs';
import { cleanCaption, dateFromShortcode, mediaIdOf, parseArgs, postUrl, shortcodeOf, sortShortcodesNewestFirst, shortcodesFromHrefs } from './lib/ig.mjs';
import { loadSite, usernameOf } from './lib/site.mjs';

const HERE        = path.dirname(fileURLToPath(import.meta.url));
const ROOT        = path.resolve(HERE, '..');
const DATA_DIR    = path.join(ROOT, 'assets', 'data');
const IMG_DIR     = path.join(ROOT, 'assets', 'images', 'news');
const MANUAL_FILE = path.join(DATA_DIR, 'manual.json');

/* The browser profile that holds the Instagram session. It is kept
   between runs so a signed-in session survives — Instagram hides
   age-restricted posts from anyone who is not signed in, and posts
   from a condom brand get flagged as sensitive often. It holds
   cookies, so it is gitignored. */
const PROFILE_DIR = path.join(ROOT, '.ig-profile');

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- headless Chrome over CDP ---------- */

function findChrome() {
  for (const p of CHROME_PATHS) if (existsSync(p)) return p;
  return null;
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  let id = 0;
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id);
      pending.delete(m.id);
      m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
    }
  });
  const send = (method, params = {}) => {
    const i = ++id;
    ws.send(JSON.stringify({ id: i, method, params }));
    return new Promise((res, rej) => pending.set(i, { res, rej }));
  };
  return { send, close: () => ws.close() };
}

/**
 * Read one post from its public embed page.
 * Returns { caption, images: [url], account, page }.
 *
 * `page` is a short excerpt of what the embed actually showed. It is
 * only used to explain a failure — Instagram changes its markup from
 * time to time, and a silent "no caption" is impossible to fix without
 * seeing what arrived.
 */
async function readPost(chrome, port, url, waitMs = 8000) {
  const target = await (await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
  const cdp = await connect(target.webSocketDebuggerUrl);
  try {
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url });
    // The embed renders client-side; give it time to fill in.
    await sleep(waitMs);

    const r = await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(async () => {
        const body = () => (document.body ? document.body.innerText : '');
        /* Two kinds of wall: the age gate (Instagram asks a signed-out
           visitor to log in) and the "page not available" notice. Both
           leave a menu and the whole language list on the page, so a
           naive "longest text on the page" would pick that up instead
           of a caption. Note the wall down and ignore the page. */
        const isGated = () => /年龄限制|Age.restricted|age restricted|登录并继续|Log in and continue|Sign up to see|注册 Instagram 以|Register to see|很抱歉，无法访问此页面|页面已被移除|Sorry, this page isn|may have been removed|link you clicked may be broken/i.test(body());

        const read = () => {
          const b = body();
          const gated = isGated();
          const text = (sel) => { const e = document.querySelector(sel); return e ? e.innerText : ''; };
          const SELECTORS = ['[class*=Caption]', 'header + div', 'blockquote div',
                             '[data-testid*=caption]', '[class*="_a7p"]'];
          let caption = '';
          let hits = {};
          for (const sel of SELECTORS) {
            const t = text(sel);
            hits[sel] = t.length;
            if (t && t.length > caption.length) caption = t;
          }
          /* The plain post page keeps the caption in a span inside the
             caption block, not in the block itself. */
          let spans = [];
          if (!gated && caption.length < 40) {
            /* Score a candidate by how much it reads like prose. The
               language menu is one long span of short lines — long in
               total, but with nothing worth reading. A caption has a
               line you could actually read. */
            const score = (t) => {
              const lines = t.split('\\n').map((l) => l.trim()).filter(Boolean);
              return {
                count: lines.length,
                longest: lines.reduce((n, l) => Math.max(n, l.length), 0),
                total: t.length,
              };
            };
            spans = [...document.querySelectorAll('span')]
              .map((s) => s.innerText || '')
              .filter((t) => t.length > 30 && t.length < 4000)
              .filter((t) => {
                const s = score(t);
                return s.count <= 3 || s.longest > 25;
              })
              /* Prefer the caption over the block that wraps it with
                 the account name, so the shorter one wins a tie. */
              .sort((a, b) => {
                const sa = score(a), sb = score(b);
                if (sb.longest !== sa.longest) return sb.longest - sa.longest;
                return sa.total - sb.total;
              });
            const best = spans[0] || '';
            if (best.length > caption.length) { caption = best; hits['span'] = best.length; }
          }

          /* A post page also states its caption in a JSON-LD block. */
          let jsonLd = '';
          for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
            try {
              const j = JSON.parse(s.textContent || '');
              const one = (o) => o && (o.description || o.caption || '');
              const d = one(j)
                || (Array.isArray(j['@graph']) ? j['@graph'].map(one).filter(Boolean).join('\\n') : '');
              if (d) { jsonLd = d.trim(); break; }
            } catch (e) { /* not valid JSON — ignore */ }
          }
          if (jsonLd.length > caption.length) { caption = jsonLd; hits['json-ld'] = jsonLd.length; }

          if (gated) caption = '';

          const images = [...new Set([...document.querySelectorAll('img')]
            .filter((i) => i.naturalWidth > 300)
            .map((i) => i.currentSrc || i.src))];
          /* The account name lives on a link to the profile. The first
             instagram.com link on the page is often the logo, so look
             for one whose text is a bare handle. */
          const account = [...document.querySelectorAll('a')]
            .map((a) => ({ href: a.getAttribute('href') || '', text: (a.textContent || '').trim() }))
            .find((a) => /^[A-Za-z0-9._]{2,30}$/.test(a.text)
                      && /instagram\\.com\\/[^/?#]+\\/?$/.test(a.href));
          return {
            caption, images, hits, spans, gated,
            account: account ? account.text : '',
            page: b.replace(/\\s+/g, ' ').trim().slice(0, 300),
            imgCount: document.querySelectorAll('img').length,
            title: document.title || '',
          };
        };

        let out = read();

        /* A signed-in visitor still gets a "sensitive content" notice
           in front of an age-restricted post. Click through it. */
        if (out.gated) {
          const want = /显示|顯示|show|view|查看|更多|more|继续|continue/i;
          const skip = /登录|log ?in|sign ?up|注册/i;
          for (const b of document.querySelectorAll('button, [role=button]')) {
            const t = (b.innerText || '').trim();
            if (t && want.test(t) && !skip.test(t)) {
              b.click();
              await new Promise((r) => setTimeout(r, 3000));
              const after = read();
              if (after.caption || !after.gated) { after.bypassed = t; out = after; }
              break;
            }
          }
        }
        return out;
      })()`,
    });
    return r.result.value;
  } finally {
    cdp.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {});
  }
}

/**
 * The pages to try, in order, for one post.
 *
 * The captioned embed is the best source — it renders the caption, the
 * images and the account name with no login. But Instagram sometimes
 * answers it with "this link is broken" for a post it has not finished
 * publishing, so there are fallbacks: the same embed under the account
 * name, and finally the post page itself.
 */
function candidateUrls(shortcode, username) {
  return [
    { url: `https://www.instagram.com/p/${shortcode}/embed/captioned/`, wait: 8000 },
    { url: `https://www.instagram.com/${username}/p/${shortcode}/embed/captioned/`, wait: 8000 },
    { url: `https://www.instagram.com/p/${shortcode}/embed/`, wait: 8000 },
    { url: `https://www.instagram.com/${username}/p/${shortcode}/`, wait: 10000 },
  ];
}

/* Instagram's own web app id. It is a constant in Instagram's public
   JavaScript bundle — the id of the web player, not a secret and not
   anyone's account. It tells the endpoint which app is asking; it
   grants no access on its own. */
const IG_APP_ID = '936619743392459';

/**
 * Ask Instagram's own web endpoint for the post.
 *
 * The rendered pages are for people. This is the endpoint the website
 * calls to draw a post, so it is the same public data — and unlike the
 * page it is not blocked by the age gate, which only stops anonymous
 * *viewers* from seeing age-restricted posts.
 *
 * Returns { caption, images, account } or null.
 */
async function readViaApi(chrome, port, shortcode) {
  const id = mediaIdOf(shortcode);
  if (!id) return null;

  const target = await (await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent('https://www.instagram.com/')}`,
    { method: 'PUT' })).json();
  const cdp = await connect(target.webSocketDebuggerUrl);
  try {
    await cdp.send('Runtime.enable');
    await sleep(1500);

    const r = await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression: `(async () => {
        /* The session cookie is sent, because Instagram answers this
           endpoint with the post only for a signed-in visitor — it is
           the endpoint the website itself uses to draw a post. */
        const headers = {
          'X-IG-App-ID': '${IG_APP_ID}',
          'Accept': '*/*',
          'Referer': 'https://www.instagram.com/',
        };
        const grab = async (url) => {
          const res = await fetch(url, { headers, credentials: 'include' });
          const text = await res.text();
          try { return { ok: res.ok, status: res.status, json: JSON.parse(text) }; }
          catch (e) { return { ok: res.ok, status: res.status, text: text.slice(0, 200) }; }
        };
        const a = await grab('https://www.instagram.com/api/v1/media/${id}/info/');
        const b = await grab('https://www.instagram.com/api/v1/media/${id}/info/?__a=1&__d=dis');
        const pick = (o) => {
          if (!o || typeof o !== 'object') return null;
          /* The response wraps the post in different shapes depending
             on the endpoint: an array, a single object, or {items:[...]}. */
          const list = Array.isArray(o.items) ? o.items
                     : (o.items && typeof o.items === 'object') ? [o.items]
                     : Array.isArray(o) ? o : [o];
          for (const it of list) {
            const media = it && (Array.isArray(it.media) ? it.media[0] : (it.media || it));
            if (!media || typeof media !== 'object') continue;
            const cap = (media.caption && (media.caption.text || media.caption))
                     || (media.edge_media_to_caption
                         && media.edge_media_to_caption.edges
                         && media.edge_media_to_caption.edges[0]
                         && media.edge_media_to_caption.edges[0].node.text)
                     || '';
            if (!cap) continue;
            const owner = media.owner || media.user || {};
            const resources = media.display_resources || [];
            const pic = resources[resources.length - 1] || {};
            const candidates = (media.image_versions2 && media.image_versions2.candidates) || [];
            return {
              caption: String(cap),
              account: owner.username || '',
              image: pic.src || (candidates[0] || {}).url || '',
            };
          }
          return null;
        };
        const got = pick(a.json) || pick(b.json);
        return {
          got,
          aStatus: a.status,
          aKeys: a.json && typeof a.json === 'object' ? Object.keys(a.json).slice(0, 12) : [],
          aBody: a.json ? (a.json.message || a.json.status || 'json') : (a.text || ''),
          bStatus: b.status,
          bBody: b.json ? (b.json.message || b.json.status || 'json') : (b.text || ''),
        };
      })()`,
    });
    const v = r.result && r.result.value;
    if (v && v.got && v.got.caption) return v.got;
    if (r.exceptionDetails) {
      console.warn(`[ig-fetch]   api error: ${r.exceptionDetails.text} ${(r.exceptionDetails.exception || {}).description || ''}`);
    }
    console.warn(`[ig-fetch]   api said: ${JSON.stringify(v)}`);
    return null;
  } catch (e) {
    console.warn(`[ig-fetch]   api error: ${e.message}`);
    return null;
  } finally {
    cdp.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {});
  }
}

/**
 * Wait for Chrome's debugging endpoint and connect to its first page.
 * Returns null if it never comes up.
 */
async function waitForBrowser(port) {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page) return await connect(page.webSocketDebuggerUrl);
      }
    } catch { /* not up yet */ }
    await sleep(250);
  }
  return null;
}

/* ---------- signing in ---------- */

/**
 * Open Instagram in a real browser window and wait for the sign-in.
 *
 * Age-restricted posts are hidden from signed-out visitors: the page
 * shows a login wall and the embed says the link is broken. Signing in
 * once is the only way to read them, so this opens a normal Chrome
 * window, waits until the session works, and keeps the session in a
 * local profile folder for the next run.
 */
async function login(chromePath, port) {
  await mkdir(PROFILE_DIR, { recursive: true });
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`, `--user-data-dir=${PROFILE_DIR}`,
    '--no-first-run', '--no-default-browser-check',
    '--window-size=1000,900', 'https://www.instagram.com/accounts/login/',
  ], { stdio: 'ignore' });

  const cdp = await waitForBrowser(port);
  if (!cdp) {
    chrome.kill();
    console.error('\n[ig-fetch] Chrome did not start.\n');
    process.exit(1);
  }

  console.log('\n[ig-fetch] A Chrome window just opened on instagram.com.');
  console.log('[ig-fetch] Sign in there — you can scan the QR code with the');
  console.log('[ig-fetch] Instagram app, or type your password.');
  console.log('[ig-fetch] The window stays open until it works, or you close it.\n');

  const deadline = Date.now() + 15 * 60 * 1000;
  let name = null;
  while (Date.now() < deadline) {
    await sleep(3000);

    /* Did the user close the window? Then stop waiting. */
    if (chrome.exitCode !== null) {
      console.log('\n[ig-fetch] The browser was closed — stopping.\n');
      return false;
    }

    try {
      const r = await cdp.send('Runtime.evaluate', {
        returnByValue: true,
        awaitPromise: true,
        expression: `(async () => {
          const out = { cookie: false, username: null, status: 0 };
          /* The session cookie is the plainest proof. */
          out.cookie = /(^|;\\s*)sessionid=/.test(document.cookie || '');
          /* The account endpoint answers with the signed-in user. It
             404s for a signed-out visitor. */
          try {
            const res = await fetch('/api/v1/accounts/edit/web_form_data/?__a=1&__d=dis',
              { credentials: 'include' });
            out.status = res.status;
            if (res.ok) {
              const j = await res.json();
              const u = j && j.data && (j.data.user || j.data);
              if (u && typeof u.username === 'string') out.username = u.username;
            }
          } catch (e) { /* not signed in */ }
          return out;
        })()`,
      });
      const v = r.result && r.result.value;
      if (v && typeof v.username === 'string' && v.username) { name = v.username; break; }
      if (v && v.cookie && !name) { name = 'your account'; break; }
    } catch (e) {
      /* The page navigated — try again. */
    }
  }

  if (name) {
    console.log(`[ig-fetch] Signed in${name === 'your account' ? '' : ' as ' + name}.`);
    console.log('[ig-fetch] The session is saved in .ig-profile/ — do not delete');
    console.log('[ig-fetch] it, or you will have to sign in again.\n');
  } else {
    console.log('\n[ig-fetch] No sign-in detected. Run it again when you are ready.\n');
  }

  chrome.kill();
  await sleep(800);
  return Boolean(name);
}

/* ---------- images ---------- */

async function downloadImage(url, filename) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      referer: 'https://www.instagram.com/',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) throw new Error(`suspiciously small (${buf.length}B)`);
  const ct = res.headers.get('content-type') || '';
  const ext = ct.includes('png') ? 'png'
            : ct.includes('gif') ? 'gif'
            : ct.includes('webp') ? 'webp'
            : ct.includes('svg') ? 'svg'
            : 'jpg';
  await mkdir(IMG_DIR, { recursive: true });
  const file = path.join(IMG_DIR, `${filename}.${ext}`);
  await writeFile(file, buf);
  return path.relative(ROOT, file).split(path.sep).join('/');
}

/* ---------- main ---------- */

/* ---------- listing the account's own posts ---------- */

/* Instagram's profile page shows the account's posts as a grid of
   links. Reading them out of the rendered page means nobody has to
   paste links by hand — but it needs the signed-in session, because
   that is what lets the grid show the account's own posts at all.

   Returns the shortcodes, newest first. Throws with a readable message
   when the page did not show any, so the caller can say what went
   wrong instead of quietly adding nothing. */
async function listLatestShortcodes(port, username, count) {
  const url = `https://www.instagram.com/${username}/`;
  const target = await (await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`,
    { method: 'PUT' })).json();
  const cdp = await connect(target.webSocketDebuggerUrl);
  try {
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url });
    await sleep(6000);   // the grid is drawn by JavaScript

    const read = async () => {
      const r = await cdp.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => {
          const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') || '');
          const body = document.body ? document.body.innerText : '';
          return {
            hrefs,
            title: document.title,
            text: body.replace(/\\s+/g, ' ').slice(0, 300),
          };
        })()`,
      });
      const v = r.result.value;
      /* Which of those links are this account's posts is decided by the
         shared helper, so the rule can be unit-tested. */
      return { ...v, codes: shortcodesFromHrefs(v.hrefs, username) };
    };

    let found = await read();

    /* Nothing yet? A first visit sometimes lands on a "Log in to see
       this account" wall. Dismiss it and read the grid again. */
    if (!found.codes.length) {
      await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          document.querySelectorAll('button, [role=button], a').forEach((el) => {
            const t = (el.innerText || '').trim();
            if (/^(see photos|view photos|see posts|view posts|查看相片|查看貼文|照片|貼文)$/i.test(t)) {
              try { el.click(); } catch (e) {}
            }
          });
        })()`,
      });
      await sleep(4000);
      found = await read();
    }

    /* The grid loads a page at a time — scroll for more if needed. */
    for (let i = 0; i < 8 && found.codes.length < count; i++) {
      await cdp.send('Runtime.evaluate', { expression: 'window.scrollBy(0, 1400)' });
      await sleep(1800);
      found = await read();
    }

    if (!found.codes.length) {
      const looksLoggedOut = /login|log in|sign up|登入|登录/i.test(found.title + ' ' + found.text);
      throw new Error(
        `the profile page showed no posts` +
        (looksLoggedOut
          ? ' — the Instagram session has expired. Run: node scripts/ig-fetch.mjs --login'
          : ` — the page said "${found.title}" / ${found.text}`)
      );
    }
    /* The grid is not in date order — Instagram puts pinned posts at
       the top, ahead of newer ones. Sort by the date the post's own
       code carries, so "the newest N" really is the newest N. */
    return sortShortcodesNewestFirst(found.codes).slice(0, count);
  } finally {
    cdp.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {});
  }
}

async function main() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('\n[ig-fetch] Chrome not found. Install Google Chrome, or set CHROME_PATH.\n');
    process.exit(1);
  }

  const { urls, files, login: wantLogin, latest: wantLatest, latestCount, refresh } =
    parseArgs(process.argv.slice(2));

  /* Signing in is its own mode: it opens a browser window for you and
     waits. It needs no links. */
  if (wantLogin) {
    const port = 9400 + Math.floor(Math.random() * 400);
    await login(chromePath, port);
    return;
  }

  const all = [...urls];
  for (const f of files.filter(Boolean)) {
    const text = await readFile(f, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/https?:\/\/\S+/);
      if (m) all.push(m[0]);
    }
  }
  if (!all.length && !wantLatest) {
    console.error('\n[ig-fetch] give me at least one Instagram post URL.');
    console.error('[ig-fetch] (or run with --latest to let the script find them, or --login to sign in to Instagram)\n');
    process.exit(1);
  }

  const site = await loadSite();
  const igUser = usernameOf(site.instagram);

  /* One browser for the whole batch. It keeps the saved Instagram
     session, so age-restricted posts can be read. */
  const port = 9400 + Math.floor(Math.random() * 400);
  await mkdir(PROFILE_DIR, { recursive: true });
  const chrome = spawn(chromePath, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${PROFILE_DIR}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--window-size=900,1400', 'about:blank',
  ], { stdio: 'ignore' });

  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break; } catch { /* not up yet */ }
    await sleep(250);
  }

  const manual = existsSync(MANUAL_FILE)
    ? JSON.parse(await readFile(MANUAL_FILE, 'utf8'))
    : { posts: [] };

  const posts = Array.isArray(manual.posts) ? manual.posts : [];
  const added = [];

  /* --latest: find the account's newest posts by itself, so nobody has
     to paste links. The posts already stored are skipped, unless
     --refresh asks for them to be read again. */
  if (wantLatest) {
    console.log(`[ig-fetch] reading the newest posts from @${igUser}…`);
    let codes;
    try {
      codes = await listLatestShortcodes(port, igUser, latestCount);
    } catch (e) {
      console.error(`\n[ig-fetch] could not list the posts: ${e.message}\n`);
      chrome.kill();
      process.exit(1);
    }
    console.log(`[ig-fetch] the profile shows ${codes.length} post(s).`);

    const known = new Set(posts.map((p) => shortcodeOf(p.url || '')).filter(Boolean));
    for (const code of codes) {
      if (known.has(code) && !refresh) {
        console.log(`[ig-fetch] ${code} is already stored — skipping (use --refresh to read it again).`);
        continue;
      }
      all.push(postUrl(igUser, code));
    }
  }

  try {
    for (const raw of all) {
      const shortcode = shortcodeOf(raw);
      if (!shortcode) {
        console.warn(`[ig-fetch] skipped (not a post link): ${raw}`);
        continue;
      }
      const date = dateFromShortcode(shortcode);
      if (!date) {
        console.warn(`[ig-fetch] skipped (could not read the date from "${shortcode}"): ${raw}`);
        continue;
      }

      console.log(`[ig-fetch] reading ${shortcode}…`);
      let post = null;
      let lastReport = null;

      for (const candidate of candidateUrls(shortcode, igUser)) {
        try {
          post = await readPost(chrome, port, candidate.url, candidate.wait);
        } catch (e) {
          console.warn(`[ig-fetch]   ${candidate.url} — ${e.message}`);
          continue;
        }
        if (String(post.caption || '').trim()) break;
        lastReport = { url: candidate.url, post };
        console.warn(post.gated
          ? `[ig-fetch]   ${candidate.url} — age-restricted, Instagram wants a login`
          : `[ig-fetch]   no caption at ${candidate.url}`);
        if (process.env.IG_DEBUG) console.log(`[ig-fetch]     page: ${post.page}`);
      }

      let caption = String(post && post.caption || '').trim();

      /* Age-restricted posts: Instagram hides them from anonymous
         visitors — the page shows a login wall and the embed says the
         link is broken. The web API the site itself calls still
         answers for a public post, so try that. */
      if (!caption) {
        console.warn(`[ig-fetch]   trying Instagram's web API…`);
        const api = await readViaApi(chrome, port, shortcode);
        if (api) {
          caption = cleanCaption(api.caption, api.account);
          post = post || { images: [], account: api.account };
          if (!post.images) post.images = [];
          if (api.image) post.images.unshift(api.image);
          if (api.account && !post.account) post.account = api.account;
          console.log(`[ig-fetch]   the API answered.`);
        }
      }

      if (!caption) {
        console.warn(`[ig-fetch] no caption on ${shortcode} — skipping.`);
        if (lastReport) {
          console.warn(`[ig-fetch]   selectors: ${JSON.stringify(lastReport.post.hits)}`);
          console.warn(`[ig-fetch]   images on page: ${lastReport.post.imgCount}, title: ${JSON.stringify(lastReport.post.title)}`);
          console.warn(`[ig-fetch]   page said: ${lastReport.post.page || '(nothing)'}`);
        }
        continue;
      }

      if (process.env.IG_DEBUG) {
        console.log(`[ig-fetch]   caption: ${JSON.stringify(caption.slice(0, 400))}`);
        console.log(`[ig-fetch]   page: ${post.page}`);
        (post.spans || []).slice(0, 8).forEach((s, i) => {
          console.log(`[ig-fetch]   span[${i}]: ${JSON.stringify(s.slice(0, 200))}`);
        });
      }

      /* The embed prints the account name on its own line above the
         caption. Drop it so the caption starts at the first line. */
      const text = cleanCaption(caption, post.account);

      const title = deriveTitle(text);
      const excerpt = deriveExcerpt(text, title);

      /* The card shows one image; take the first of the carousel. */
      let image = '';
      if (post.images && post.images.length) {
        const name = `ig-${date}-${shortcode}`;
        try {
          image = await downloadImage(post.images[0], name);
          console.log(`[ig-fetch] saved ${image}`);
        } catch (e) {
          console.warn(`[ig-fetch] could not download the image (${e.message}); the card will link to it instead.`);
          image = post.images[0];
        }
      }

      const permalink = postUrl(igUser, shortcode);
      /* The headline and summary are left out on purpose. manual-post
         derives them from the caption, and copy you wrote by hand must
         survive the next fetch — so the script never stores them. */
      const entry = { date, text, url: permalink, source: 'Instagram' };
      if (image) entry.image = image;

      /* Same URL -> update that post. Copy you wrote by hand is kept:
         re-fetching the caption should not wipe your wording. */
      const at = posts.findIndex((p) => shortcodeOf(p.url || '') === shortcode);
      if (at >= 0) {
        const kept = {};
        for (const key of ['title_zh', 'excerpt_zh', 'title_en', 'excerpt_en', 'title_ja', 'excerpt_ja']) {
          if (posts[at][key]) kept[key] = posts[at][key];
        }
        posts[at] = { ...posts[at], ...entry, ...kept };
      } else {
        posts.push(entry);
      }

      added.push({ date, title, permalink });
      console.log(`[ig-fetch] ${date}  ${title}`);
    }
  } finally {
    chrome.kill();
    await sleep(600);
  }

  if (!added.length) {
    /* Listing the profile when every post is already stored is not a
       failure — there was just nothing new. Say so, and stop. */
    if (wantLatest) {
      console.log('\n[ig-fetch] nothing new — every post on the profile is already stored.');
      console.log('[ig-fetch] (use --refresh to read the stored ones again)\n');
      process.exit(0);
    }
    console.error('\n[ig-fetch] nothing was added.\n');
    process.exit(1);
  }

  manual.posts = posts;
  await writeFile(MANUAL_FILE, JSON.stringify(manual, null, 2) + '\n', 'utf8');
  console.log(`\n[ig-fetch] ${added.length} post(s) -> ${path.relative(ROOT, MANUAL_FILE)}`);
  console.log('[ig-fetch] now run: node scripts/manual-post.mjs');
}

main().catch((e) => {
  console.error(`\n[ig-fetch] ${e.stack || e.message}\n`);
  process.exit(1);
});
