#!/usr/bin/env node
/* ===========================================================
   sync-social-links.mjs — make every social link match
   assets/data/site.json.

   The site is static, so the links in the HTML are literal URLs.
   This script rewrites the *handle* part of every facebook.com and
   instagram.com link (and the "@handle" shown in the footer), so
   that changing site.json is enough to move the whole site to a
   different account.

   Run: node scripts/sync-social-links.mjs
   =========================================================== */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { loadSite, usernameOf, ROOT } from './lib/site.mjs';

/* The files that carry social links. */
async function targetFiles() {
  const html = (await readdir(ROOT))
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(ROOT, f));
  const js = [
    path.join(ROOT, 'assets', 'js', 'data.js'),
    path.join(ROOT, 'assets', 'js', 'news.js'),
  ];
  return [...html, ...js];
}

function rewrite(text, site) {
  const fb = usernameOf(site.facebook);
  const ig = usernameOf(site.instagram);
  let out = text;

  /* The handle straight after the domain — everything after it
     (/posts/123, /p/abc) is left alone. */
  out = out.replace(
    /(https?:\/\/(?:www\.)?facebook\.com\/)([A-Za-z0-9._-]+)/gi,
    (m, prefix) => `${prefix}${fb}`,
  );
  out = out.replace(
    /(https?:\/\/(?:www\.)?instagram\.com\/)([A-Za-z0-9._-]+)/gi,
    (m, prefix) => `${prefix}${ig}`,
  );

  /* The "@handle" the footer shows as the account name. Anchored on
     the word before it, so an email address (@tzero-jp.com) and a
     phone number (@400-xxxx) are never touched. */
  out = out.replace(
    /(Instagram\s*·\s*@)([A-Za-z0-9._-]+)/g,
    (m, prefix) => `${prefix}${ig}`,
  );
  return out;
}

async function main() {
  const site = await loadSite();
  const fb = usernameOf(site.facebook);
  const ig = usernameOf(site.instagram);
  if (!fb || !ig) {
    console.error('\n[sync-social-links] site.json needs a facebook and an instagram URL.\n');
    process.exit(1);
  }

  console.log(`[sync-social-links] facebook @${fb}  instagram @${ig}`);

  let changed = 0;
  for (const file of await targetFiles()) {
    const before = await readFile(file, 'utf8');
    const after = rewrite(before, site);
    if (after === before) continue;
    await writeFile(file, after, 'utf8');
    changed++;
    console.log(`[sync-social-links] updated ${path.relative(ROOT, file)}`);
  }

  console.log(changed
    ? `[sync-social-links] ${changed} file(s) updated.`
    : '[sync-social-links] everything already matches site.json.');
}

main().catch((e) => {
  console.error(`\n[sync-social-links] ${e.stack || e.message}\n`);
  process.exit(1);
});
