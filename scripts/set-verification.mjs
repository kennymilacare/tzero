#!/usr/bin/env node
/* ===========================================================
   set-verification.mjs — put the Search Console / Bing token in.

   Getting a search engine to accept a site takes two steps: the
   site has to prove it belongs to you, and the token that proves it
   is put in a meta tag on the home page. The token is different
   every time, and pasting it by hand is easy to get wrong — one
   wrong character and the check silently fails.

   So this script does the pasting:

     node scripts/set-verification.mjs --google <token>
     node scripts/set-verification.mjs --bing <token>
     node scripts/set-verification.mjs --google-file <token>
     node scripts/set-verification.mjs --clear
     node scripts/set-verification.mjs --show

   The tokens are kept in assets/data/site.json, so there is one
   place to look, and the three home pages (Chinese, English,
   Japanese) are written from it, so they cannot disagree.

   These tokens are not secrets. They are meant to be read by the
   search engine, on a public page. The tokens that must never be
   published — the Facebook token and the app secret — live in
   GitHub Secrets and nowhere else.
   =========================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { BING_META, GOOGLE_META, HOME_PAGES, setBlock, tokenIn } from './lib/verification.mjs';
import { loadSite, ROOT, SITE_FILE } from './lib/site.mjs';

const ARGS = process.argv.slice(2);

const FLAG = (name) => {
  const at = ARGS.indexOf(name);
  return at >= 0 && ARGS[at + 1] && !ARGS[at + 1].startsWith('--') ? ARGS[at + 1] : null;
};

async function readVerification() {
  const raw = JSON.parse(await readFile(SITE_FILE, 'utf8'));
  const v = raw.verification || {};
  return { google: String(v.google || ''), bing: String(v.bing || '') };
}

async function writeVerification(google, bing) {
  const raw = JSON.parse(await readFile(SITE_FILE, 'utf8'));
  raw.verification = { google, bing };
  await writeFile(SITE_FILE, JSON.stringify(raw, null, 2) + '\n', 'utf8');
}

async function main() {
  const site = await loadSite();
  const args = ARGS;

  if (args.includes('--clear')) {
    await writeVerification('', '');
    for (const file of HOME_PAGES) {
      const full = path.join(ROOT, file);
      const html = await readFile(full, 'utf8');
      await writeFile(full, setBlock(html, '', ''), 'utf8');
      console.log(`[set-verification] cleared ${file}`);
    }
    console.log('[set-verification] the tokens are removed.');
    return;
  }

  if (args.includes('--show')) {
    const { google, bing } = await readVerification();
    console.log(`[set-verification] site      ${site.url}`);
    console.log(`[set-verification] google    ${google || '(not set)'}`);
    console.log(`[set-verification] bing      ${bing || '(not set)'}`);
    for (const file of HOME_PAGES) {
      const html = await readFile(path.join(ROOT, file), 'utf8');
      console.log(`[set-verification]   ${file}: google="${tokenIn(html, GOOGLE_META)}" bing="${tokenIn(html, BING_META)}"`);
    }
    return;
  }

  const google = FLAG('--google');
  const bing = FLAG('--bing');
  const googleFile = FLAG('--google-file');

  if (!google && !bing && !googleFile) {
    console.error('\n[set-verification] Give a token, for example:');
    console.error('[set-verification]   node scripts/set-verification.mjs --google <token>\n');
    process.exit(1);
  }

  let current = await readVerification();

  if (googleFile) {
    /* Google's file method: a file named after the token, at the
       site root, saying who it is for. */
    const name = `google${googleFile}.html`;
    await writeFile(path.join(ROOT, name), `google-site-verification: ${name}\n`, 'utf8');
    console.log(`[set-verification] wrote ${name}`);
    current = { ...current, google: googleFile };
  }

  if (google) current = { ...current, google };
  if (bing) current = { ...current, bing };

  await writeVerification(current.google, current.bing);

  for (const file of HOME_PAGES) {
    const full = path.join(ROOT, file);
    const html = await readFile(full, 'utf8');
    const after = setBlock(html, current.google, current.bing);
    if (after === html) continue;
    await writeFile(full, after, 'utf8');
    console.log(`[set-verification] wrote ${file}`);
  }

  console.log(`[set-verification] google = ${current.google || '(not set)'}`);
  console.log(`[set-verification] bing   = ${current.bing || '(not set)'}`);
  console.log('[set-verification] The tokens are public — they are meant to be read by the search engine.');
}

main().catch((e) => {
  console.error(`\n[set-verification] ${e.stack || e.message}\n`);
  process.exit(1);
});
