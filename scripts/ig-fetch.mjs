#!/usr/bin/env node
/* ===========================================================
   ig-fetch.mjs — pull Instagram posts into assets/data/manual.json.

   Run:  node scripts/ig-fetch.mjs <ig-url> [<ig-url> ...]
         node scripts/ig-fetch.mjs --file urls.txt

   For each post it reads the caption, the image and the date, then
   writes an entry into assets/data/manual.json. Run manual-post.mjs
   afterwards to regenerate the feed the site reads.

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
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { deriveExcerpt, deriveTitle } from './lib/feed.mjs';
import { cleanCaption, dateFromShortcode, parseArgs, postUrl, shortcodeOf } from './lib/ig.mjs';
import { loadSite, usernameOf } from './lib/site.mjs';

const HERE        = path.dirname(fileURLToPath(import.meta.url));
const ROOT        = path.resolve(HERE, '..');
const DATA_DIR    = path.join(ROOT, 'assets', 'data');
const IMG_DIR     = path.join(ROOT, 'assets', 'images', 'news');
const MANUAL_FILE = path.join(DATA_DIR, 'manual.json');

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
 * Returns { caption, images: [url], account }.
 */
async function readPost(chrome, port, url) {
  const target = await (await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
  const cdp = await connect(target.webSocketDebuggerUrl);
  try {
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url });
    // The embed renders client-side; give it time to fill in.
    await sleep(8000);

    const r = await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const text = (sel) => { const e = document.querySelector(sel); return e ? e.innerText : ''; };
        let caption = '';
        for (const sel of ['[class*=Caption]', 'header + div', 'blockquote div']) {
          const t = text(sel);
          if (t && t.length > caption.length) caption = t;
        }
        const images = [...new Set([...document.querySelectorAll('img')]
          .filter((i) => i.naturalWidth > 300)
          .map((i) => i.currentSrc || i.src))];
        /* The account name lives on a link to the profile. The first
           instagram.com link on the page is often the logo, so look for
           one whose text is a bare handle. */
        const account = [...document.querySelectorAll('a')]
          .map((a) => ({ href: a.getAttribute('href') || '', text: (a.textContent || '').trim() }))
          .find((a) => /^[A-Za-z0-9._]{2,30}$/.test(a.text)
                    && /instagram\\.com\\/[^/?#]+\\/?$/.test(a.href));
        return { caption, images, account: account ? account.text : '' };
      })()`,
    });
    return r.result.value;
  } finally {
    cdp.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {});
  }
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

async function main() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('\n[ig-fetch] Chrome not found. Install Google Chrome, or set CHROME_PATH.\n');
    process.exit(1);
  }

  const { urls, files } = parseArgs(process.argv.slice(2));
  const all = [...urls];
  for (const f of files.filter(Boolean)) {
    const text = await readFile(f, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/https?:\/\/\S+/);
      if (m) all.push(m[0]);
    }
  }
  if (!all.length) {
    console.error('\n[ig-fetch] give me at least one Instagram post URL.\n');
    process.exit(1);
  }

  const site = await loadSite();
  const igUser = usernameOf(site.instagram);

  /* One browser for the whole batch. */
  const port = 9400 + Math.floor(Math.random() * 400);
  const profile = await mkdtemp(path.join(tmpdir(), 'tz-ig-'));
  const chrome = spawn(chromePath, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
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

      const embed = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
      console.log(`[ig-fetch] reading ${shortcode}…`);
      let post;
      try {
        post = await readPost(chrome, port, embed);
      } catch (e) {
        console.warn(`[ig-fetch] could not read ${shortcode}: ${e.message}`);
        continue;
      }

      const caption = String(post.caption || '').trim();
      if (!caption) {
        console.warn(`[ig-fetch] no caption on ${shortcode} — skipping (Instagram may want a login).`);
        continue;
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
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }

  if (!added.length) {
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
