#!/usr/bin/env node
/* ===========================================================
   manual-post.mjs — turn the posts in assets/data/manual.json
   into the news feed the site reads.

   For when you don't want (or can't) run the Graph API sync:
   paste the Facebook / Instagram caption into manual.json, run
   this, and the site is updated. No token, no network, no CI.

   Run: node scripts/manual-post.mjs

   It also writes the posts back into assets/data/news.local.json,
   so that if you later set up the GitHub Actions sync, these
   posts survive it instead of being overwritten.
   =========================================================== */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyOverride, curatedPosts, deriveExcerpt, deriveTitle, sortByDate } from './lib/feed.mjs';

const HERE       = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.resolve(HERE, '..');
const DATA_DIR   = path.join(ROOT, 'assets', 'data');
const IMG_DIR    = path.join(ROOT, 'assets', 'images', 'news');
const MANUAL_FILE = path.join(DATA_DIR, 'manual.json');
const LOCAL_FILE  = path.join(DATA_DIR, 'news.local.json');
const OUT_FILE    = path.join(DATA_DIR, 'news.json');

const PAGE_USERNAME = process.env.FB_PAGE_USERNAME || 'Tzerohk';
const PAGE_URL = `https://www.facebook.com/${PAGE_USERNAME}`;

/* ---------- helpers ---------- */

/* A stable id per post: the same URL always gets the same id, so
   re-running the script updates a post instead of adding a copy of it.
   (A date+index id would shift whenever a post is added at the top.) */
function postId(post) {
  if (post.id) return String(post.id);
  const url = String(post.url || '');
  const hash = createHash('sha1').update(url || post.text || '').digest('hex').slice(0, 8);
  return `manual-${post.date || 'nodate'}-${hash}`;
}

/* Where the card's "follow" button should point. For Instagram that is
   the profile, not the post — https://www.instagram.com/<user>/p/<id>/ */
function followUrl(post) {
  if (post.followUrl) return post.followUrl;
  if (post.source === 'Instagram') {
    const m = String(post.url || '').match(/instagram\.com\/([^/]+)\//i);
    if (m) return `https://www.instagram.com/${m[1]}/`;
  }
  return PAGE_URL;
}

/* An image may be a local path (kept as-is) or an http URL (downloaded
   into the repo, because Facebook and Instagram CDN links are signed
   and stop working after a few weeks). */
async function resolveImage(post, id) {
  const src = String(post.image || '').trim();
  if (!src) return '';
  if (!/^https?:\/\//i.test(src)) return src;

  try {
    const res = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0' } });
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
    const file = path.join(IMG_DIR, `${id}.${ext}`);
    await writeFile(file, buf);
    console.log(`[manual-post] downloaded ${src} -> ${path.relative(ROOT, file)}`);
    return path.relative(ROOT, file).split(path.sep).join('/');
  } catch (e) {
    console.warn(`[manual-post] image download failed (${e.message}); the card will use the URL as-is.`);
    return src;
  }
}

/* ---------- main ---------- */

async function main() {
  if (!existsSync(MANUAL_FILE)) {
    console.error(`\n[manual-post] ${path.relative(ROOT, MANUAL_FILE)} not found.\n`);
    process.exit(1);
  }

  const manual = JSON.parse(await readFile(MANUAL_FILE, 'utf8'));
  const entries = Array.isArray(manual.posts) ? manual.posts : [];

  /* The hand-written posts that already live in news.local.json
     (the HKTVmall launch card, and the seed posts). */
  let local = { posts: {} };
  if (existsSync(LOCAL_FILE)) {
    try {
      local = JSON.parse(await readFile(LOCAL_FILE, 'utf8'));
    } catch (e) {
      console.warn(`[manual-post] could not parse news.local.json, ignoring it: ${e.message}`);
      local = { posts: {} };
    }
  }
  const overrides = local.posts || {};

  /* --- 1. turn the manual entries into cards --- */
  const manualPosts = [];
  for (const entry of entries) {
    if (!entry || (!entry.text && !entry.title_zh)) continue;

    const id = postId(entry);
    const text = String(entry.text || entry.message || '').trim();
    const title = entry.title_zh || deriveTitle(text);
    const excerpt = entry.excerpt_zh || deriveExcerpt(text, title);
    const source = entry.source || 'Facebook';

    const post = {
      id,
      permalink: entry.url || entry.permalink || `${PAGE_URL}/posts/${id}`,
      datePublished: entry.date || entry.datePublished || '',
      title,
      message: text,
      excerpt,
      image: await resolveImage(entry, id),
      source,
      followUrl: followUrl({ ...entry, source }),
    };

    /* Optional translations, straight through. */
    for (const lang of ['en', 'ja']) {
      if (entry[`title_${lang}`]) post[`title_${lang}`] = entry[`title_${lang}`];
      if (entry[`excerpt_${lang}`]) post[`excerpt_${lang}`] = entry[`excerpt_${lang}`];
    }
    if (entry.link) post.link = entry.link;
    if (entry.cta_zh) post.cta = entry.cta_zh;
    if (entry.cta_en) post.cta_en = entry.cta_en;
    if (entry.cta_ja) post.cta_ja = entry.cta_ja;
    if (entry.follow === false) post.follow = false;

    manualPosts.push(post);
  }

  /* --- 2. merge with the hand-written posts --- */
  /* Curated posts (the ones with title_zh in news.local.json) stay.
     The ones this script wrote on a previous run are replaced by the
     freshly generated ones, so re-running never duplicates them. */
  const curated = curatedPosts(overrides, PAGE_URL).filter((p) => !p.id.startsWith('manual-'));

  const posts = [...manualPosts, ...curated];
  sortByDate(posts);

  /* With no manual posts at all, write an empty feed on purpose: the
     front-end treats that as "no feed" and leaves the hand-written
     cards in the HTML in place, which are a better empty state than a
     single leftover card. */
  const out = manualPosts.length
    ? { updatedAt: new Date().toISOString(), source: 'manual', page: { id: '', url: PAGE_URL }, posts }
    : { updatedAt: new Date().toISOString(), source: 'manual', page: { id: '', url: PAGE_URL }, posts: [] };
  await writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');

  /* --- 3. write the posts back into news.local.json ---
     So that if the Graph API sync is ever set up, these posts are
     treated as hand-written entries and survive it. Entries this
     script wrote on an earlier run are cleared first, so a post the
     user deleted from manual.json really disappears. */
  const nextOverrides = { ...overrides };
  for (const [id] of Object.entries(nextOverrides)) {
    if (id.startsWith('manual-')) delete nextOverrides[id];
  }
  for (const post of manualPosts) {
    const entry = {
      title_zh: post.title,
      excerpt_zh: post.excerpt,
      datePublished: post.datePublished,
      permalink: post.permalink,
      source: post.source,
      followUrl: post.followUrl,
      pinned: true,
    };
    if (post.title_en) entry.title_en = post.title_en;
    if (post.excerpt_en) entry.excerpt_en = post.excerpt_en;
    if (post.title_ja) entry.title_ja = post.title_ja;
    if (post.excerpt_ja) entry.excerpt_ja = post.excerpt_ja;
    if (post.follow === false) entry.follow = false;
    nextOverrides[post.id] = entry;
  }
  local.posts = nextOverrides;
  await writeFile(LOCAL_FILE, JSON.stringify(local, null, 2) + '\n', 'utf8');

  if (!manualPosts.length) {
    console.log('[manual-post] no manual posts — the built-in cards in the HTML stay.');
    return;
  }

  console.log(`[manual-post] ${manualPosts.length} manual post(s) + ${curated.length} curated -> ${path.relative(ROOT, OUT_FILE)}`);
  for (const post of posts) {
    console.log(`  ${post.datePublished || '(no date)'}  [${post.source}]  ${post.title}`);
  }
}

main().catch((e) => {
  console.error(`\n[manual-post] ${e.stack || e.message}\n`);
  process.exit(1);
});
