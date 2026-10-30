#!/usr/bin/env node
/* ===========================================================
   update-sitemap.mjs — write sitemap.xml from what is really there.

   Three things were wrong with the sitemap:

   1. It listed the products as product.html?id=… — four URLs that
      all carried the same canonical link, so a crawler could only
      ever keep one of them. The products have real pages now
      (product-ultra-thin.html and friends) and the sitemap lists
      those.

   2. Every lastmod was the same old date, even though the news
      changes most days. A sitemap that says nothing changed is a
      sitemap a crawler trusts less. Each date is now the day the
      page (and the data it shows) was last changed.

   3. It listed one address per page, even though every page now
      exists in three languages at three addresses. A sitemap that
      hides two thirds of the site is a sitemap that keeps two
      thirds of it out of the search results — so every page is
      listed once per language, and each entry names the other two
      so the crawler knows they are the same page.

   Run: node scripts/update-sitemap.mjs
   =========================================================== */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { LANGS, PAGES, alternates, pageFile, pageUrl } from './lib/langs.mjs';
import { loadSite, ROOT } from './lib/site.mjs';

const run = promisify(execFile);
const SITEMAP = path.join(ROOT, 'sitemap.xml');

/* The pages the sitemap lists, in the order they matter.
   `files` is everything that page shows — the date is the newest
   of them, so the news pages move when a post is added. */
function pageList() {
  const feed = ['assets/data/news.json', 'assets/data/news.local.json'];
  const catalogue = ['assets/js/data.js'];

  const list = [];

  for (const page of PAGES) {
    /* What the page shows, on top of the page itself. */
    let extra = [];
    if (page.kind === 'home' || page.kind === 'news') extra = feed;
    if (page.kind === 'products' || page.kind === 'product') extra = catalogue;

    for (const lang of LANGS) {
      const file = pageFile(lang, page.path);
      list.push({
        lang,
        path: page.path,
        file,
        files: [file, ...extra],
        changefreq: CHANGEFREQ[page.kind] || 'weekly',
        priority: PRIORITY[page.kind] || '0.5',
      });
    }
  }

  return list;
}

/* How often a crawler should come back, and how important the page
   is — the same for all three languages of a page. */
const CHANGEFREQ = {
  home: 'weekly',
  products: 'weekly',
  product: 'weekly',
  news: 'weekly',
  about: 'monthly',
  contact: 'monthly',
  terms: 'yearly',
};

const PRIORITY = {
  home: '1.0',
  products: '0.9',
  product: '0.8',
  news: '0.7',
  about: '0.6',
  contact: '0.5',
  terms: '0.3',
};

/** The day a file was last changed, according to git. */
async function changedOn(file) {
  try {
    const { stdout } = await run('git', ['log', '-1', '--format=%cs', '--', file], { cwd: ROOT });
    const date = stdout.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  } catch (e) {
    return null;
  }
}

/** The newest of several dates — or today, if git cannot say. */
async function lastmodOf(files) {
  const dates = (await Promise.all(files.map(changedOn))).filter(Boolean);
  if (!dates.length) return new Date().toISOString().slice(0, 10);
  return dates.sort().pop();
}

function render(list, base) {
  const entries = list.map((entry) => {
    const loc = pageUrl(base, entry.lang, entry.path);
    /* The other two languages of this very page, and the Chinese
       one as the default. */
    const links = alternates(base, entry.path)
      .map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>`)
      .join('\n');
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
${links}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
}

async function main() {
  const site = await loadSite();
  if (!site.url) {
    console.error('\n[update-sitemap] site.json has no "url".\n');
    process.exit(1);
  }

  const list = pageList();
  for (const entry of list) {
    entry.lastmod = await lastmodOf(entry.files);
  }

  await writeFile(SITEMAP, render(list, site.url), 'utf8');
  console.log(`[update-sitemap] wrote sitemap.xml — ${list.length} URL(s).`);
  for (const entry of list) {
    console.log(`[update-sitemap]   ${entry.lastmod}  ${pageUrl(site.url, entry.lang, entry.path)}`);
  }
}

main().catch((e) => {
  console.error(`\n[update-sitemap] ${e.stack || e.message}\n`);
  process.exit(1);
});
