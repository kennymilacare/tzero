#!/usr/bin/env node
/* ===========================================================
   bump-versions.mjs — tell the browsers that a file has changed.

   Every script on this site is loaded with a version number:
   assets/js/main.js?v=13. The number says "if you have got this
   number, you have got the file" — so the browser does not fetch it
   again. That is a good thing, right up until the file changes and
   the number does not: returning visitors then keep the old one,
   and nothing on the page moves.

   The chain is the awkward part. If data.js changes, then every
   script that imports data.js has changed too, and every page that
   loads those scripts has changed too. Writing that out by hand
   across thirty-odd pages is how a version number gets missed.

   So: name the file that changed, and the number it is now.

     node scripts/bump-versions.mjs splash.js 5

   It rewrites the "?v=" for that file everywhere it is named — in
   the HTML pages and in the scripts that import it — and prints
   what it touched.

   Run: node scripts/bump-versions.mjs <file.js> <version>
   =========================================================== */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { ROOT } from './lib/site.mjs';

/** Every HTML page the site publishes. */
async function htmlPages() {
  const files = [];
  for (const dir of ['', 'en', 'ja']) {
    const inner = await readdir(path.join(ROOT, dir)).catch(() => []);
    for (const name of inner) {
      if (name.endsWith('.html')) files.push(path.join(dir, name));
    }
  }
  return files;
}

/** Every script in the assets folder. */
async function jsFiles() {
  const inner = await readdir(path.join(ROOT, 'assets/js')).catch(() => []);
  return inner.filter((name) => name.endsWith('.js')).map((name) => path.join('assets/js', name));
}

async function main() {
  const [name, version] = process.argv.slice(2);

  if (!name || !/^\d+$/.test(String(version))) {
    console.error('\n[bump-versions] usage: node scripts/bump-versions.mjs <file.js> <version>\n');
    process.exit(1);
  }

  const pattern = new RegExp(
    `(?<![\\w.-])(${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?v=)\\d+`,
    'g',
  );

  const files = [...(await htmlPages()), ...(await jsFiles())];
  let touched = 0;

  for (const file of files) {
    const full = path.join(ROOT, file);
    const raw = await readFile(full, 'utf8');
    /* The file mixes line endings; keep the one it came with. */
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const text = raw.replace(/\r\n/g, '\n');

    const out = text.replace(pattern, `$1${version}`);
    if (out === text) continue;

    const result = eol === '\r\n' ? out.replace(/\n/g, '\r\n') : out;
    await writeFile(full, result, 'utf8');
    console.log(`[bump-versions] ${file} → ${name}?v=${version}`);
    touched += 1;
  }

  console.log(`[bump-versions] ${touched} file(s) changed.`);
}

main().catch((e) => {
  console.error(`\n[bump-versions] ${e.stack || e.message}\n`);
  process.exit(1);
});
