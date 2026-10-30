#!/usr/bin/env node
/* ===========================================================
   update-sitemap.mjs — write sitemap.xml from what is really there.

   Two things were wrong with the sitemap:

   1. It listed the products as product.html?id=… — four URLs that
      all carried the same canonical link, so a crawler could only
      ever keep one of them. The products have real pages now
      (product-ultra-thin.html and friends) and the sitemap lists
      those.

   2. Every lastmod was the same old date, even though the news
      changes most days. A sitemap that says nothing changed is a
      sitemap a crawler trusts less. Each date is now the day the
      page (and the data it shows) was last changed.

   Run: node scripts/update-sitemap.mjs
   =========================================================== */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { products, productUrl } from '../assets/js/data.js';
import { loadSite, ROOT } from './lib/site.mjs';

const run = promisify(execFile);
const SITEMAP = path.join(ROOT, 'sitemap.xml');

/* The pages the sitemap lists, in the order they matter.
   `files` is everything that page shows — the date is the newest
   of them, so the news pages move when a post is added. */
function pageList() {
  const feed = ['assets/data/news.json', 'assets/data/news.local.json'];
  const catalogue = ['assets/js/data.js'];

  const list = [
    { loc: '', files: ['index.html', ...feed], changefreq: 'weekly', priority: '1.0' },
    { loc: 'products.html', files: ['products.html', ...catalogue], changefreq: 'weekly', priority: '0.9' },
  ];

  for (const p of products) {
    list.push({
      loc: productUrl(p.id),
      files: [productUrl(p.id), ...catalogue],
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  list.push(
    { loc: 'about.html', files: ['about.html'], changefreq: 'monthly', priority: '0.6' },
    { loc: 'news.html', files: ['news.html', ...feed], changefreq: 'weekly', priority: '0.7' },
    { loc: 'contact.html', files: ['contact.html'], changefreq: 'monthly', priority: '0.5' },
    { loc: 'terms.html', files: ['terms.html'], changefreq: 'yearly', priority: '0.3' },
  );

  return list;
}

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
  const url = (loc) => (loc ? `${base}${loc}` : base);

  const entries = list.map((entry) => {
    const loc = url(entry.loc);
    const alternates = ['zh-HK', 'en', 'ja-JP', 'x-default']
      .map((lang) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${loc}"/>`)
      .join('\n');
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
${alternates}
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
    console.log(`[update-sitemap]   ${entry.lastmod}  ${entry.loc || '/'}`);
  }
}

main().catch((e) => {
  console.error(`\n[update-sitemap] ${e.stack || e.message}\n`);
  process.exit(1);
});
