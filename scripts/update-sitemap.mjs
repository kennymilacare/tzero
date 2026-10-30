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

   What the sitemap says is worked out in scripts/lib/sitemap.mjs,
   so that a test can check the file on disk without this script
   having to write it.

   Run: node scripts/update-sitemap.mjs
   =========================================================== */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { pageUrl } from './lib/langs.mjs';
import { sitemapFor } from './lib/sitemap.mjs';
import { loadSite, ROOT } from './lib/site.mjs';

const SITEMAP = path.join(ROOT, 'sitemap.xml');

async function main() {
  const site = await loadSite();
  if (!site.url) {
    console.error('\n[update-sitemap] site.json has no "url".\n');
    process.exit(1);
  }

  const { text, list } = await sitemapFor(site.url);
  await writeFile(SITEMAP, text, 'utf8');

  console.log(`[update-sitemap] wrote sitemap.xml — ${list.length} URL(s).`);
  for (const entry of list) {
    console.log(`[update-sitemap]   ${entry.lastmod}  ${pageUrl(site.url, entry.lang, entry.path)}`);
  }
}

main().catch((e) => {
  console.error(`\n[update-sitemap] ${e.stack || e.message}\n`);
  process.exit(1);
});
