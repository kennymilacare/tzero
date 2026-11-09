#!/usr/bin/env node
/* ===========================================================
   scripts/fix-punctuation.mjs — put the punctuation of every
   piece of copy the same way round.

   The rule is in scripts/lib/punctuation.mjs, and the check
   that keeps it is scripts/lib/punctuation.test.mjs. This
   script is the sweep: it goes over the copy the site is
   written in and puts the marks right.

   It only touches prose. Code, comments, URLs, numbers and
   the names of things are left exactly as they were.

   Run:  node scripts/fix-punctuation.mjs --check
         node scripts/fix-punctuation.mjs --write
   =========================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { convertHtml, convertJs, convertJson, COPY_FILES } from './lib/punctuation.mjs';
import { ROOT, writeIfChanged } from './lib/site.mjs';

/* The copy, and how it is written down. The list lives in
   scripts/lib/punctuation.mjs, so that the sweep and the test
   go over exactly the same files. */
const FILES = COPY_FILES;

const CONVERTERS = { html: convertHtml, js: convertJs, json: convertJson };

/* The lines that changed, so a run can be read before it is
   written. */
function changedLines(before, after) {
  const a = before.split('\n');
  const b = after.split('\n');
  if (a.length !== b.length) return [];
  const out = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) out.push({ line: i + 1, before: a[i], after: b[i] });
  }
  return out;
}

async function main() {
  const write = process.argv.includes('--write');
  /* The files may be named on the command line, one after the other:
     node scripts/fix-punctuation.mjs --write index.html terms.html
     Only the files that are named are touched. */
  const named = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const files = named.length
    ? FILES.filter(([file]) => named.includes(file))
    : FILES;
  if (named.length && files.length !== named.length) {
    const unknown = named.filter((n) => !FILES.some(([f]) => f === n));
    throw new Error(`not a copy file: ${unknown.join(', ')}`);
  }

  let totalFiles = 0;
  let totalLines = 0;

  for (const [file, kind] of files) {
    const full = path.join(ROOT, file);
    const before = await readFile(full, 'utf8');
    const after = CONVERTERS[kind](before);
    if (before === after) {
      console.log(`  ${file} — nothing to change`);
      continue;
    }
    const diff = changedLines(before, after);
    totalFiles++;
    totalLines += diff.length;
    console.log(`\n  ${file} — ${diff.length} line(s)`);
    for (const d of diff) {
      const b = d.before.trim();
      const a = d.after.trim();
      console.log(`    ${d.line}`);
      console.log(`      - ${b.length > 200 ? `${b.slice(0, 200)}…` : b}`);
      console.log(`      + ${a.length > 200 ? `${a.slice(0, 200)}…` : a}`);
    }
    if (write) {
      await writeIfChanged(full, after);
    }
  }

  console.log(
    `\n${totalFiles} file(s) would change, ${totalLines} line(s).` +
      (write ? ' Written.' : ' Nothing was written — run with --write.'),
  );
}

main().catch((err) => {
  console.error(`\n[fix-punctuation] ${err.stack || err.message}\n`);
  process.exit(1);
});
