#!/usr/bin/env node
/* ===========================================================
   check-idempotent.mjs — do the generators say the same thing
   twice?

   The generators write the site's pages from the files in the
   repository. If they do not always write the same bytes, then
   what is on the site and what is in the repository drift apart —
   and the next commit is full of changes nobody made.

   So: run them again, and compare. Every file must come out
   exactly as it went in.

   This is a script and not a test, on purpose. The generators
   rewrite the very files the tests read, and node --test runs the
   test files in parallel — so a test that ran the generators would
   be reading files while another test was rewriting them.

   Run: node scripts/check-idempotent.mjs
   =========================================================== */

import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { ROOT } from './lib/site.mjs';

const GENERATORS = [
  'scripts/gen-product-pages.mjs',
  'scripts/gen-faq-html.mjs',
  'scripts/gen-jsonld.mjs',
  'scripts/gen-lang-pages.mjs',
  'scripts/update-sitemap.mjs',
];

/** Every file the generators write. */
async function generatedFiles() {
  const files = [];

  const root = await readdir(ROOT);
  for (const name of root) {
    if (name.endsWith('.html')) files.push(name);
  }
  for (const dir of ['en', 'ja']) {
    const inner = await readdir(path.join(ROOT, dir)).catch(() => []);
    for (const name of inner) {
      if (name.endsWith('.html')) files.push(`${dir}/${name}`);
    }
  }

  files.push('sitemap.xml');
  return files.sort();
}

/** A short fingerprint of a file's contents. */
async function fingerprint(file) {
  const raw = await readFile(path.join(ROOT, file));
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

async function main() {
  const files = await generatedFiles();

  const before = new Map();
  for (const file of files) before.set(file, await fingerprint(file));

  console.log(`[check-idempotent] ${files.length} generated file(s). Running the generators again…`);

  for (const generator of GENERATORS) {
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const run = promisify(execFile);
    try {
      await run(process.execPath, [path.join(ROOT, generator)], { cwd: ROOT });
    } catch (e) {
      console.error(`\n[check-idempotent] ${generator} failed:\n${e.stdout || ''}${e.stderr || e.message}\n`);
      process.exit(1);
    }
  }

  const changed = [];
  for (const file of files) {
    const after = await fingerprint(file);
    if (after !== before.get(file)) changed.push(file);
  }

  if (changed.length) {
    console.error('\n[check-idempotent] these files changed when the generators ran again:');
    for (const file of changed) console.error(`  ${file}`);
    console.error('\nThe generators are not writing the same thing twice — the pages and the');
    console.error('repository will drift apart. Fix the generator before committing.\n');
    process.exit(1);
  }

  console.log(`[check-idempotent] all ${files.length} file(s) came out exactly the same.`);
}

main().catch((e) => {
  console.error(`\n[check-idempotent] ${e.stack || e.message}\n`);
  process.exit(1);
});
