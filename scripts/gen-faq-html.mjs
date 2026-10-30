#!/usr/bin/env node
/* ===========================================================
   gen-faq-html.mjs — write the FAQ into index.html.

   The FAQ used to be drawn by JavaScript only, so a crawler that
   does not run scripts saw an empty box — and the FAQPage block in
   the structured data described questions the page itself did not
   show. Now the questions are in the markup, and the page replaces
   them with the same questions in the visitor's language.

   Run: node scripts/gen-faq-html.mjs

   assets/js/data.js holds the questions, so edit them there and
   run this again — never edit the block in index.html by hand.
   =========================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { faqs } from '../assets/js/data.js';
import { faqBlock } from './lib/seo.mjs';
import { ROOT } from './lib/site.mjs';

const INDEX = path.join(ROOT, 'index.html');

/* The div the FAQ lives in. */
const OPEN = '<div class="faq reveal" data-faq>';

/**
 * Find the closing tag of the div that starts at `from`.
 *
 * The block holds nested <div>s once the questions are in it, so the
 * first </div> is not the end of it — the tags have to be counted.
 * Returns the index of the matching </div>, so the caller can replace
 * what is between the two tags and leave the closing one in place.
 */
function endOfDiv(text, from) {
  /* One pattern for both kinds of tag, so the two can never be read
     out of order. The counter is what finds the matching close. */
  const tag = /<div\b[^>]*>|<\/div>/g;
  let depth = 1;
  let match;

  tag.lastIndex = from;
  while ((match = tag.exec(text)) !== null) {
    if (match[0] === '</div>') {
      depth--;
      if (depth === 0) return match.index;
    } else {
      depth++;
    }
  }
  throw new Error('the FAQ div is never closed');
}

async function main() {
  const raw = await readFile(INDEX, 'utf8');
  /* The file mixes line endings; keep the one it came with. */
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const text = raw.replace(/\r\n/g, '\n');

  const start = text.indexOf(OPEN);
  if (start < 0) throw new Error('index.html has no [data-faq] div');
  const contentStart = start + OPEN.length;
  const contentEnd = endOfDiv(text, contentStart);

  const block = faqBlock(faqs);
  const out = text.slice(0, contentStart) + '\n' + block + text.slice(contentEnd);
  const result = eol === '\r\n' ? out.replace(/\n/g, '\r\n') : out;

  if (result === raw) {
    console.log('[gen-faq-html] index.html already has the current FAQ.');
    return;
  }

  await writeFile(INDEX, result, 'utf8');
  console.log(`[gen-faq-html] wrote ${faqs.length} question(s) into index.html.`);
}

main().catch((e) => {
  console.error(`\n[gen-faq-html] ${e.stack || e.message}\n`);
  process.exit(1);
});
