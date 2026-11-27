#!/usr/bin/env node
/* ===========================================================
   set-ga4.mjs — put the Google Analytics 4 measurement id in.

   Without it, the site can be seen but not measured: there is no
   count of the people who came, and no way of telling what they
   did. The measurement id names the property that the numbers go
   to, and it is not a secret — it is read by the browser of every
   visitor, on a public page.

   So this script does the pasting:

     node scripts/set-ga4.mjs G-XXXXXXXXXX
     node scripts/set-ga4.mjs --clear
     node scripts/set-ga4.mjs --show

   The id is kept in assets/data/site.json, so there is one place to
   look, and it is written into every page — the Chinese ones, the
   English and Japanese ones, the product pages and the guide pages.

   Then the pages that are written from other pages (the language
   pages, the product pages, the guide pages) have to be written
   again, so that they carry it too:

     node scripts/gen-product-pages.mjs
     node scripts/gen-lang-pages.mjs
     node scripts/gen-guide-pages.mjs

   Or run docs/publish.ps1, which does all of it and publishes.
   =========================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { ga4IdIn, setGa4, SOURCE_PAGES } from './lib/ga4.mjs';
import { ROOT, SITE_FILE } from './lib/site.mjs';

const ARGS = process.argv.slice(2);
const ID = /^(G-[A-Z0-9]+)$/;

async function readSite() {
  return JSON.parse(await readFile(SITE_FILE, 'utf8'));
}

async function writeSite(site) {
  await writeFile(SITE_FILE, JSON.stringify(site, null, 2) + '\n', 'utf8');
}

/** Write the block into every page that is a source of the others. */
async function writePages(id) {
  let changed = 0;
  for (const file of SOURCE_PAGES) {
    const full = path.join(ROOT, file);
    const raw = await readFile(full, 'utf8');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const text = raw.replace(/\r\n/g, '\n');
    const out = setGa4(text, id);
    if (out === text) continue;
    await writeFile(full, eol === '\r\n' ? out.replace(/\n/g, '\r\n') : out, 'utf8');
    console.log(`[set-ga4] ${file}`);
    changed++;
  }
  return changed;
}

async function main() {
  const site = await readSite();
  const current = String(site.ga4 || '');

  if (ARGS.includes('--show')) {
    console.log(`[set-ga4] the id in site.json: ${current || '(none)'}`);
    for (const file of SOURCE_PAGES) {
      const html = await readFile(path.join(ROOT, file), 'utf8');
      console.log(`[set-ga4] ${file}: ${ga4IdIn(html) || '(none)'}`);
    }
    return;
  }

  if (ARGS.includes('--clear')) {
    site.ga4 = '';
    await writeSite(site);
    const changed = await writePages('');
    console.log(`[set-ga4] cleared. ${changed} page(s) changed.`);
    console.log('[set-ga4] now run the generators and publish.');
    return;
  }

  const wanted = ARGS.find((a) => ID.test(a));
  if (!wanted) {
    console.error('\n[set-ga4] usage: node scripts/set-ga4.mjs <G-XXXXXXXXXX>\n');
    process.exit(1);
  }

  site.ga4 = wanted;
  await writeSite(site);
  const changed = await writePages(wanted);
  console.log(`[set-ga4] ${wanted} is in site.json. ${changed} page(s) changed.`);
  console.log('[set-ga4] now run the generators, then publish.');
}

main().catch((e) => {
  console.error(`\n[set-ga4] ${e.stack || e.message}\n`);
  process.exit(1);
});
