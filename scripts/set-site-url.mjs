#!/usr/bin/env node
/* ===========================================================
   set-site-url.mjs — move the site to a new address.

   The site is static, so its own address is written literally into
   every page (canonical, hreflang, og:url, og:image), into
   sitemap.xml and into robots.txt. This script rewrites all of them
   in one go and records the new address in assets/data/site.json,
   so there is one place to look and one command to run.

   Run: node scripts/set-site-url.mjs https://tzerohk.com
        node scripts/set-site-url.mjs https://tzerohk.com --dry-run
   =========================================================== */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { baseOf, canonicalOf, firstLocOf, normalizeBase, rewriteText, sitemapOf } from './lib/siteurl.mjs';
import { loadSite, ROOT, SITE_FILE } from './lib/site.mjs';

/* argv[0] is node itself and argv[1] is this file — the user's
   arguments start at argv[2]. */
const ARGS = process.argv.slice(2);
const DRY = ARGS.includes('--dry-run');

/** The files that carry the site's own address. */
async function targetFiles() {
  const html = (await readdir(ROOT))
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(ROOT, f));
  return [
    ...html,
    path.join(ROOT, 'sitemap.xml'),
    path.join(ROOT, 'robots.txt'),
    /* The JSON-LD in here names the site by address. */
    path.join(ROOT, 'assets', 'js', 'data.js'),
  ];
}

/**
 * The base URL a file is written against, read from the file itself.
 * The canonical link for a page, the first <loc> for the sitemap, the
 * Sitemap: line for robots.txt.
 */
function ownBase(file, text, fallback) {
  const url =
    file.endsWith('.xml') ? firstLocOf(text)
      : file.endsWith('.txt') ? sitemapOf(text)
        : canonicalOf(text);
  return baseOf(url) || fallback;
}

async function main() {
  const arg = ARGS.find((a) => !a.startsWith('--'));
  const newBase = normalizeBase(arg);
  if (!newBase) {
    console.error('\n[set-site-url] Give the new address, for example:');
    console.error('[set-site-url]   node scripts/set-site-url.mjs https://tzerohk.com\n');
    process.exit(1);
  }

  const site = await loadSite();
  const oldBase = site.url;
  if (!oldBase) {
    console.error('\n[set-site-url] assets/data/site.json has no "url" — nothing to move from.\n');
    process.exit(1);
  }
  if (oldBase.replace(/\/+$/, '') === newBase.replace(/\/+$/, '')) {
    console.log(`[set-site-url] The site is already at ${newBase} — nothing to do.`);
    return;
  }

  console.log(`[set-site-url] ${oldBase}  →  ${newBase}`);

  let changed = 0;
  for (const file of await targetFiles()) {
    const before = await readFile(file, 'utf8');
    const after = rewriteText(before, ownBase(file, before, oldBase), newBase);
    if (after === before) continue;
    changed++;
    console.log(`[set-site-url] ${DRY ? 'would update' : 'updated'} ${path.relative(ROOT, file)}`);
    if (!DRY) await writeFile(file, after, 'utf8');
  }

  /* site.json is where the address is recorded, so the next run knows
     where the site came from — and the test knows where it should be. */
  const raw = JSON.parse(await readFile(SITE_FILE, 'utf8'));
  raw.url = newBase;
  if (!DRY) await writeFile(SITE_FILE, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  console.log(`[set-site-url] ${DRY ? 'would set' : 'set'} assets/data/site.json → ${newBase}`);

  console.log(DRY
    ? `[set-site-url] (dry run — nothing was written)`
    : `[set-site-url] ${changed} file(s) updated.`);
}

main().catch((e) => {
  console.error(`\n[set-site-url] ${e.stack || e.message}\n`);
  process.exit(1);
});
