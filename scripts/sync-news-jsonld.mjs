#!/usr/bin/env node
/* ===========================================================
   sync-news-jsonld.mjs — write the news structured data from
   the feed the site actually shows.

   Two things were wrong with the news ItemList in assets/js/data.js:

   1. "itemListOrder" was written "itemListOrderDescending" — the
      wrong case. schema.org has no such term (the real ones are
      ItemListOrderAscending and ItemListOrderDescending), so a
      validator flagged it as an error on a live page.

   2. The four entries in the list were months old and all pointed
      at the Facebook page, while the page itself showed different
      posts. Structured data that describes something the visitor
      cannot see is worse than none.

   The list is now built from assets/data/news.json — the same file
   the page reads — so the two cannot disagree. Run:

       node scripts/sync-news-jsonld.mjs

   manual-post.mjs calls it at the end, so a new post updates the
   static copy as well as the live one.
   =========================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { curatedPosts, sortByDate } from './lib/feed.mjs';
import { loadSite, usernameOf, ROOT } from './lib/site.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(ROOT, 'assets', 'data', 'news.json');
const LOCAL_FILE = path.join(ROOT, 'assets', 'data', 'news.local.json');
const DATA_JS = path.join(ROOT, 'assets', 'js', 'data.js');

/* The page shows at most this many posts — news.js has the same limit. */
const MAX_POSTS = 8;

/* The three copies of the block in data.js, one per language.
   `home` is the first breadcrumb — it is also how the script tells
   the three blocks apart, so it has to be the exact string used. */
const LANGS = [
  { key: 'zh', home: '首頁',     latest: '最新動態',   listName: 'T-ZERO 第九感 最新動態' },
  { key: 'en', home: 'Home',     latest: 'Latest News', listName: 'T-ZERO NINTH SENSE Updates' },
  { key: 'ja', home: 'ホーム',   latest: '最新ニュース', listName: 'T-ZERO 第九感 最新情報' },
];

/* The enum schema.org actually defines. */
const ORDER_DESC = 'https://schema.org/ItemListOrderDescending';

/* ---------- the feed ---------- */

/**
 * The posts to list, newest first.
 *
 * news.json is what the page reads, so it is the source of truth.
 * When it is empty (no posts have been synced yet) the hand-written
 * cards in news.local.json are used instead.
 */
export async function feedPosts() {
  if (existsSync(DATA_FILE)) {
    try {
      const raw = JSON.parse(await readFile(DATA_FILE, 'utf8'));
      const posts = Array.isArray(raw.posts) ? raw.posts : [];
      if (posts.length) {
        return { posts: sortByDate([...posts]).slice(0, MAX_POSTS), source: 'news.json' };
      }
    } catch (e) {
      console.warn(`[sync-news-jsonld] could not read news.json: ${e.message}`);
    }
  }

  if (existsSync(LOCAL_FILE)) {
    try {
      const raw = JSON.parse(await readFile(LOCAL_FILE, 'utf8'));
      const site = await loadSite();
      const pageUrl = `https://www.facebook.com/${usernameOf(site.facebook)}`;
      const posts = curatedPosts(raw.posts || {}, pageUrl);
      if (posts.length) return { posts: sortByDate(posts).slice(0, MAX_POSTS), source: 'news.local.json' };
    } catch (e) {
      console.warn(`[sync-news-jsonld] could not read news.local.json: ${e.message}`);
    }
  }

  return { posts: [], source: 'none' };
}

/** The headline of a post in one language, falling back to the Chinese source. */
function titleOf(post, lang) {
  const localised = post[`title_${lang}`];
  if (localised != null && localised !== '') return localised;
  return post.title || '';
}

/* ---------- rendering ---------- */

/* A JS string literal. */
const q = (value) => JSON.stringify(String(value == null ? '' : value));

/**
 * The whole `seo.jsonld.news` block, for one language.
 *
 * The breadcrumb and the list name are the same in every language
 * copy; only the wording and the posts change.
 */
export function renderBlock({ siteUrl, lang, items }) {
  const L = [];
  L.push("    'seo.jsonld.news': JSON.stringify({");
  L.push('      "@context": "https://schema.org",');
  L.push('      "@graph": [');
  L.push('        { "@type": "BreadcrumbList", "itemListElement": [');
  L.push(`          { "@type": "ListItem", "position": 1, "name": ${q(lang.home)}, "item": ${q(siteUrl)} },`);
  L.push(`          { "@type": "ListItem", "position": 2, "name": ${q(lang.latest)}, "item": ${q(`${siteUrl}news.html`)} }`);
  L.push('        ] },');
  L.push(`        { "@type": "ItemList", "name": ${q(lang.listName)},`);
  L.push(`          "numberOfItems": ${items.length},`);
  L.push(`          "itemListOrder": ${q(ORDER_DESC)},`);
  L.push('          "itemListElement": [');
  items.forEach((item, i) => {
    const bits = ['"@type": "ListItem"', `"position": ${i + 1}`];
    if (item.datePublished) bits.push(`"datePublished": ${q(item.datePublished)}`);
    bits.push(`"url": ${q(item.url)}`);
    bits.push(`"name": ${q(item.name)}`);
    L.push(`            { ${bits.join(', ')} }${i < items.length - 1 ? ',' : ''}`);
  });
  L.push('          ] }');
  L.push('      ]');
  L.push('    }),');
  return L.join('\n');
}

/* ---------- rewriting data.js ---------- */

const BLOCK_KEY = "'seo.jsonld.news': JSON.stringify({";
const BLOCK_END = '\n    }),';

/**
 * Replace the `seo.jsonld.news` block that belongs to one language.
 *
 * The three blocks are identical in shape, so the language is found
 * by its first breadcrumb. If that string is not found the script
 * fails rather than writing the Chinese block into the English slot.
 */
export function replaceBlock(text, lang, block) {
  let from = 0;
  while (true) {
    const at = text.indexOf(BLOCK_KEY, from);
    if (at < 0) throw new Error(`no seo.jsonld.news block found for ${lang.key}`);
    const endAt = text.indexOf(BLOCK_END, at);
    if (endAt < 0) throw new Error('the seo.jsonld.news block is not closed');

    const region = text.slice(at, endAt);
    if (region.includes(`"name": ${q(lang.home)}`)) {
      return text.slice(0, at) + block + text.slice(endAt + BLOCK_END.length);
    }
    from = endAt + BLOCK_END.length;
  }
}

/* ---------- main ---------- */

export async function syncNewsJsonLd() {
  const site = await loadSite();
  if (!site.url) {
    throw new Error('site.json has no "url"');
  }

  const { posts, source } = await feedPosts();

  const raw = await readFile(DATA_JS, 'utf8');
  /* The file mixes line endings; keep the one it came with. */
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  let text = raw.replace(/\r\n/g, '\n');

  /* The typo is worth fixing even when there are no posts to list. */
  text = text.replace(
    'https://schema.org/itemListOrderDescending',
    ORDER_DESC,
  );

  if (!posts.length) {
    console.warn('[sync-news-jsonld] no posts in the feed — the news list was left as it is.');
    if (text !== raw.replace(/\r\n/g, '\n')) {
      await writeFile(DATA_JS, eol === '\r\n' ? text.replace(/\n/g, '\r\n') : text, 'utf8');
      console.log('[sync-news-jsonld] fixed the itemListOrder spelling in data.js');
    }
    return { posts: 0, source, changed: false };
  }

  for (const lang of LANGS) {
    const items = posts.map((post) => ({
      name: titleOf(post, lang.key),
      url: post.permalink || site.url,
      datePublished: post.datePublished || '',
    }));
    const block = renderBlock({ siteUrl: site.url, lang, items });
    text = replaceBlock(text, lang, block);
  }

  const out = eol === '\r\n' ? text.replace(/\n/g, '\r\n') : text;
  const changed = out !== raw;
  if (changed) await writeFile(DATA_JS, out, 'utf8');

  return { posts: posts.length, source, changed };
}

async function main() {
  const { posts, source, changed } = await syncNewsJsonLd();
  console.log(
    changed
      ? `[sync-news-jsonld] wrote ${posts} post(s) from ${source} into data.js.`
      : `[sync-news-jsonld] data.js already matches ${source} (${posts} post(s)).`,
  );
}

/* Run when called from the command line, not when imported. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`\n[sync-news-jsonld] ${e.stack || e.message}\n`);
    process.exit(1);
  });
}
