#!/usr/bin/env node
/* ===========================================================
   sync-facebook.mjs — pull the latest posts from a Facebook
   Page and write them to assets/data/news.json.

   Run by .github/workflows/sync-facebook.yml on a schedule.
   Node 18+ (uses the built-in fetch). No dependencies.

   Required env vars:
     FB_PAGE_ID        numeric Page id (from /me/accounts)
   Required (one of):
     FB_PAGE_TOKEN     Page access token — long-lived if possible
     FB_USER_TOKEN     user token; a page token is derived from it
   Optional:
     FB_APP_ID         enables token refresh (long-lived exchange)
     FB_APP_SECRET     enables token refresh (long-lived exchange)
     FB_PAGE_USERNAME  used to build permalinks (default: from site.json)
     FB_GRAPH_VERSION  Graph API version (default: v24.0)
     FB_POST_LIMIT     how many posts to keep (default: 8)
     FB_GRAPH_BASE     Graph API host (default: graph.facebook.com).
                       Point this at a local mock to test without credentials.
     FB_INCLUDE_IG     set to "0" to skip Instagram (default: on)

   Instagram posts are picked up automatically when the Page has an
   Instagram Business account linked to it. Set FB_IG_USERNAME if the
   account is not linked.

   See docs/facebook-sync.md for the full setup guide.
   =========================================================== */

import { mkdir, writeFile, readFile, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyOverride,
  curatedPosts,
  deriveExcerpt,
  deriveTitle,
  mapInstagramMedia,
  mergePinnedPosts,
  pickImage,
  sortByDate,
} from './lib/feed.mjs';
import { loadSite, usernameOf } from './lib/site.mjs';

const HERE      = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(HERE, '..');
const DATA_DIR  = path.join(ROOT, 'assets', 'data');
const IMG_DIR   = path.join(ROOT, 'assets', 'images', 'news');
const OUT_FILE  = path.join(DATA_DIR, 'news.json');
const LOCAL_FILE = path.join(DATA_DIR, 'news.local.json');

const GRAPH_VERSION  = process.env.FB_GRAPH_VERSION || 'v24.0';
const GRAPH_BASE     = process.env.FB_GRAPH_BASE || 'https://graph.facebook.com';
const PAGE_ID        = process.env.FB_PAGE_ID;
const PAGE_TOKEN     = process.env.FB_PAGE_TOKEN;
const USER_TOKEN     = process.env.FB_USER_TOKEN;
const APP_ID         = process.env.FB_APP_ID;
const APP_SECRET     = process.env.FB_APP_SECRET;

/* The accounts the site advertises live in assets/data/site.json —
   one place to change when the handles move. */
const SITE           = await loadSite();
const PAGE_USERNAME  = process.env.FB_PAGE_USERNAME || usernameOf(SITE.facebook);
const IG_USERNAME    = process.env.FB_IG_USERNAME || usernameOf(SITE.instagram);
const INCLUDE_IG     = process.env.FB_INCLUDE_IG !== '0';
const POST_LIMIT     = Number(process.env.FB_POST_LIMIT || 8);
const PAGE_URL       = `https://www.facebook.com/${PAGE_USERNAME}`;

/* Meta retires each Graph API version on a fixed schedule. Once a version
   passes end-of-life, requests do NOT start failing — they are silently
   served by the next oldest live version, so behaviour can change with no
   error anywhere. Warn at the deadline so the bump is a deliberate act.
   Sources: developers.facebook.com/docs/graph-api/changelog/versions */
const GRAPH_VERSION_EOL = {
  'v21.0': '2027-01-21',
  'v22.0': '2027-05-20',
  'v23.0': '2027-10-08',
  'v24.0': '2028-02-18',
  'v25.0': '2028-07-29',
};

function warnIfVersionStale() {
  const eol = GRAPH_VERSION_EOL[GRAPH_VERSION];
  if (!eol) return;
  const days = Math.round((Date.parse(eol) - Date.now()) / 86400000);
  if (days < 0) {
    console.warn(
      `[sync-facebook] ${GRAPH_VERSION} passed end-of-life on ${eol}. Meta is now ` +
      `serving these calls with a different version, silently. Set FB_GRAPH_VERSION.`
    );
  } else if (days <= 60) {
    console.warn(
      `[sync-facebook] ${GRAPH_VERSION} reaches end-of-life on ${eol} (${days} days). ` +
      `Bump FB_GRAPH_VERSION before then.`
    );
  }
}

/* ---------- small helpers ---------- */

function fail(msg) {
  console.error(`\n[sync-facebook] ${msg}\n`);
  process.exit(1);
}

async function graphGet(pathname, params = {}) {
  const url = new URL(`${GRAPH_BASE}/${GRAPH_VERSION}/${pathname}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Graph API returned non-JSON (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }
  if (json.error) {
    throw new Error(`Graph API error ${json.error.code}: ${json.error.message} (type ${json.error.type})`);
  }
  return json;
}

async function graphGetRaw(pathname, params = {}) {
  const url = new URL(`${GRAPH_BASE}/${pathname}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error(`Graph API returned non-JSON (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }
  if (json.error) {
    throw new Error(`Graph API error ${json.error.code}: ${json.error.message} (type ${json.error.type})`);
  }
  return json;
}

/* ---------- auth ---------- */

/* Exchange the current token for a long-lived one. Keeps the token alive
   as long as the app stays in good standing — no manual 60-day renewal. */
async function refreshToken(token) {
  if (!APP_ID || !APP_SECRET) return token;
  try {
    const j = await graphGetRaw('oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: APP_ID,
      client_secret: APP_SECRET,
      fb_exchange_token: token,
    });
    if (j.access_token) {
      console.log(`[sync-facebook] token refreshed, expires_in=${j.expires_in}s`);
      return j.access_token;
    }
  } catch (e) {
    console.warn(`[sync-facebook] token refresh failed, using the existing token: ${e.message}`);
  }
  return token;
}

/* A user token can list the pages it administers and hand back a page
   token — handy when you don't want to look up the numeric Page id. */
async function pageTokenFromUserToken(userToken) {
  const j = await graphGet('me/accounts', { access_token: userToken, limit: 50 });
  const pages = j.data || [];
  const match = pages.find((p) => p.id === PAGE_ID) || pages[0];
  if (!match) {
    throw new Error(
      `The user token administers no pages, or none matched FB_PAGE_ID="${PAGE_ID}". ` +
      `Pages seen: ${pages.map((p) => p.id).join(', ') || '(none)'}`
    );
  }
  if (!PAGE_ID && pages.length > 1) {
    console.warn(`[sync-facebook] FB_PAGE_ID not set — using "${match.name}" (${match.id}). Set FB_PAGE_ID to pin it.`);
  }
  console.log(`[sync-facebook] page: ${match.name} (${match.id})`);
  return { token: match.access_token, id: match.id };
}

/* ---------- Instagram ---------- */

/* An Instagram Business account linked to the Page shows up as a field on
   the Page object. When it is not linked (or the token cannot read it), the
   feed simply skips Instagram rather than failing the whole run. */
async function instagramAccount(pageId, token) {
  try {
    const j = await graphGet(pageId, {
      fields: 'instagram_business_account{id,username}',
      access_token: token,
    });
    const ig = j.instagram_business_account;
    if (ig && ig.id) {
      console.log(`[sync-facebook] instagram: @${ig.username} (${ig.id})`);
      return { id: ig.id, username: ig.username || IG_USERNAME };
    }
  } catch (e) {
    console.warn(`[sync-facebook] could not read the linked Instagram account (${e.message}); skipping Instagram.`);
    return null;
  }
  if (IG_USERNAME) {
    // Not linked, but the account name is known — try the public media id lookup.
    try {
      const j = await graphGet(`ig_${IG_USERNAME.replace(/^@/, '')}`, {
        fields: 'id,username',
        access_token: token,
      });
      if (j.id) {
        console.log(`[sync-facebook] instagram: @${j.username || IG_USERNAME} (${j.id})`);
        return { id: j.id, username: j.username || IG_USERNAME };
      }
    } catch (e) {
      console.warn(`[sync-facebook] could not resolve @${IG_USERNAME} (${e.message}); skipping Instagram.`);
      return null;
    }
  }
  console.warn('[sync-facebook] no Instagram Business account linked to the Page — skipping Instagram.');
  return null;
}

async function instagramMedia(ig, token) {
  const j = await graphGet(`${ig.id}/media`, {
    fields: 'id,caption,timestamp,permalink,media_type,media_url,media{media_type,thumbnail_url}',
    limit: POST_LIMIT,
    access_token: token,
  });
  return j.data || [];
}

/* ---------- images ---------- */

/* Download the image into the repo. Facebook's CDN URLs are signed and
   expire — hotlinking them (which this site used to do) breaks after a
   few weeks. We commit the file so the site always resolves locally. */
async function downloadImage(url, postId) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) throw new Error(`suspiciously small (${buf.length}B)`);

  const ct = res.headers.get('content-type') || '';
  const ext = ct.includes('png') ? 'png'
            : ct.includes('gif') ? 'gif'
            : ct.includes('webp') ? 'webp'
            : ct.includes('svg') ? 'svg'
            : 'jpg';
  const file = path.join(IMG_DIR, `${postId}.${ext}`);
  await writeFile(file, buf);
  return path.relative(ROOT, file).split(path.sep).join('/');
}

/* Remove images that are no longer referenced, so the repo doesn't grow
   without bound as posts scroll past the limit. */
async function pruneImages(keep) {
  if (!existsSync(IMG_DIR)) return;
  const files = await readdir(IMG_DIR);
  for (const f of files) {
    if (!/\.(jpe?g|png|gif|webp|svg)$/i.test(f)) continue;
    if (keep.has(f)) continue;
    await unlink(path.join(IMG_DIR, f)).catch(() => {});
  }
}

/* ---------- overrides ---------- */

/* assets/data/news.local.json holds hand-written per-post overrides:
   English / Japanese copy, a custom title, or hidden:true to drop a post.
   Keyed by Facebook post id. */
async function loadOverrides() {
  if (!existsSync(LOCAL_FILE)) return {};
  try {
    const raw = JSON.parse(await readFile(LOCAL_FILE, 'utf8'));
    return (raw && raw.posts) || {};
  } catch (e) {
    console.warn(`[sync-facebook] could not parse news.local.json, ignoring it: ${e.message}`);
    return {};
  }
}

/* The previous run's feed, so a pinned post that has scrolled past the
   Graph API's limit can be restored instead of vanishing from the site. */
async function loadPrevious() {
  if (!existsSync(OUT_FILE)) return [];
  try {
    const raw = JSON.parse(await readFile(OUT_FILE, 'utf8'));
    return (raw && raw.posts) || [];
  } catch (e) {
    console.warn(`[sync-facebook] could not parse the previous news.json, ignoring it: ${e.message}`);
    return [];
  }
}

/* ---------- main ---------- */

async function main() {
  warnIfVersionStale();

  if (!PAGE_TOKEN && !USER_TOKEN) {
    fail('Set FB_PAGE_TOKEN, or FB_USER_TOKEN so the page can be looked up. See docs/facebook-sync.md.');
  }

  // A page token can't say which page it belongs to — the id is what the
  // feed URL is built from. Fail here with a clear message rather than
  // requesting "undefined/feed" and reporting a confusing 404.
  if (PAGE_TOKEN && !PAGE_ID) {
    fail('FB_PAGE_TOKEN also needs FB_PAGE_ID — the numeric Page id, from /me/accounts. See docs/facebook-sync.md §5.');
  }

  let token = PAGE_TOKEN;
  let pageId = PAGE_ID;

  if (!token) {
    const fromUser = await pageTokenFromUserToken(USER_TOKEN);
    token = fromUser.token;
    pageId = pageId || fromUser.id;
  }

  token = await refreshToken(token);

  // Rich field set first; fall back to the minimal set if the token
  // isn't allowed to read attachments.
  const RICH = 'id,message,permalink_url,created_time,full_picture,attachments{media,subattachments{media,image}},media{media,image}';
  const MINIMAL = 'id,message,permalink_url,created_time,full_picture';

  let feed;
  try {
    feed = await graphGet(`${pageId}/feed`, { fields: RICH, limit: POST_LIMIT, access_token: token });
  } catch (e) {
    console.warn(`[sync-facebook] rich field set failed (${e.message}); retrying with the minimal set.`);
    feed = await graphGet(`${pageId}/feed`, { fields: MINIMAL, limit: POST_LIMIT, access_token: token });
  }

  const raw = feed.data || [];
  if (!raw.length) {
    console.warn('[sync-facebook] the feed returned no posts — the token may not have pages_read_engagement.');
  }

  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(IMG_DIR, { recursive: true });

  const overrides = await loadOverrides();
  const previous = await loadPrevious();
  const posts = [];
  const keepImages = new Set();

  /* One place to turn a raw item into a card: apply the hand-written
     overrides, then download the image and point the card at the local
     copy (Facebook's CDN URLs are signed and expire). */
  const addPost = async (base) => {
    const id = base.id;
    const override = overrides[id] || {};
    if (override.hidden) {
      console.log(`[sync-facebook] post ${id} hidden by news.local.json`);
      return;
    }

    const message = (base.message || '').trim();
    const title = override.title_zh || base.title || deriveTitle(message);
    const excerpt = override.excerpt_zh || base.excerpt || deriveExcerpt(message, title);

    let image = '';
    if (base.imageUrl) {
      try {
        image = await downloadImage(base.imageUrl, id);
        keepImages.add(path.basename(image));
        console.log(`[sync-facebook] post ${id}: image -> ${image}`);
      } catch (e) {
        console.warn(`[sync-facebook] post ${id}: image download failed (${e.message}); the card will fall back to the logo.`);
      }
    }

    const post = {
      id,
      permalink: base.permalink,
      datePublished: base.datePublished,
      title,
      message,
      excerpt,
      image,
      source: base.source,
      // Where the card's "follow" button should point. Facebook posts use
      // the page URL; Instagram posts use the profile.
      followUrl: base.followUrl || '',
    };
    posts.push(applyOverride(post, override));
  };

  for (const p of raw) {
    const id = String(p.id);
    await addPost({
      id,
      permalink: p.permalink_url || `${PAGE_URL}/posts/${id}`,
      datePublished: (p.created_time || '').slice(0, 10),
      message: p.message || '',
      title: '',
      excerpt: '',
      imageUrl: pickImage(p),
      source: 'Facebook',
    });
  }

  // Instagram: the same cards, from the Business account linked to the Page.
  if (INCLUDE_IG && pageId) {
    const ig = await instagramAccount(pageId, token);
    if (ig) {
      let media = [];
      try {
        media = await instagramMedia(ig, token);
      } catch (e) {
        console.warn(`[sync-facebook] could not read Instagram media (${e.message}); skipping Instagram.`);
      }
      for (const m of media) {
        const mapped = mapInstagramMedia(m, { username: ig.username });
        // The card's "follow" button should point at the Instagram profile.
        mapped.followUrl = ig.username ? `https://www.instagram.com/${ig.username}/` : '';
        await addPost(mapped);
      }
    }
  }

  // Curated posts (and pinned Facebook posts) live in news.local.json and
  // must survive every sync, even after they scroll past the feed limit.
  for (const post of curatedPosts(overrides, PAGE_URL)) {
    if (posts.some((p) => p.id === post.id)) continue;
    posts.push(post);
    // Its image was downloaded (or hand-placed) on an earlier run — keep
    // the file, or the pruner below would delete it.
    if (post.image) keepImages.add(path.basename(post.image));
    console.log(`[sync-facebook] curated post ${post.id} kept`);
  }

  // Pinned posts that have scrolled past the feed limit come back from the
  // previous run rather than disappearing from the site.
  for (const post of mergePinnedPosts(posts, previous, overrides)) {
    if (!posts.some((p) => p.id === post.id)) {
      posts.push(post);
      // Its image was downloaded on an earlier run — keep the file.
      if (post.image) keepImages.add(path.basename(post.image));
      console.log(`[sync-facebook] pinned post ${post.id} restored from the previous run`);
    }
  }

  sortByDate(posts);
  await pruneImages(keepImages);

  const out = {
    updatedAt: new Date().toISOString(),
    source: 'facebook',
    page: { id: pageId || '', url: PAGE_URL },
    posts,
  };

  await writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`[sync-facebook] wrote ${posts.length} post(s) -> ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((e) => fail(e.stack || e.message));
