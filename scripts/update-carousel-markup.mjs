#!/usr/bin/env node
/* ===========================================================
   update-carousel-markup.mjs — point the banner at the new sizes.

   The four pictures in the banner were 2658 pixels wide and cost
   about a megabyte between them, and every page of the site
   carries them. scripts/compress-carousel.py has made two copies
   of each — one 1600 wide for the big screens, one 800 wide for
   the phones.

   This puts the new sizes into the markup:

     · a srcset, so the browser fetches the copy that suits the
       screen it is on — a phone takes the small one, a desktop
       takes the large one;
     · a lower priority for the three slides that are not showing.
       They are all inside the screen, so the browser fetched them
       all at once and they competed with the one picture that has
       to arrive first — the one the page is judged on;
     · the new number in the file name, so the browser knows to
       fetch the new picture and not the old one.

   Run: node scripts/update-carousel-markup.mjs
   Or name the pages:  node scripts/update-carousel-markup.mjs index.html
   =========================================================== */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { ROOT } from './lib/site.mjs';

/* The version the pictures are on now. */
const VERSION = 2;

/* The sizes the pictures were made at, and the shape they are in.
   The shape is the same in both copies, so the page does not jump
   whichever one the browser picks. */
const SMALL = 800;
const LARGE = 1600;
const RATIO = 592 / 1600;

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

/**
 * The pages to work on.
 *
 * Named on the command line, they are the ones that are written —
 * the tool then knows exactly which files it is about to touch.
 * With no names, every page of the site is done.
 *
 *   node scripts/update-carousel-markup.mjs index.html products.html
 */
function pagesToDo(asked) {
  if (!asked.length) return htmlPages();
  return Promise.resolve(asked.map((f) => f.split(path.sep).join('/')));
}

/**
 * One picture tag, rewritten.
 *
 * The tag is found by what it points at, not by how it is written,
 * so the pages do not have to agree on the order of the attributes
 * for this to work.
 */
function rewriteTag(tag) {
  const src = tag.match(/src="([^"]*?carousel\/([^"/]+)\.jpg)(?:\?v=\d+)?"/);
  if (!src) return null;
  if (/srcset=/.test(tag)) return null;   /* already done */

  const prefix = src[1].slice(0, src[1].length - `carousel/${src[2]}.jpg`.length);
  const name = src[2];

  const small = `${prefix}carousel/${name}-${SMALL}.jpg?v=${VERSION}`;
  const large = `${prefix}carousel/${name}-${LARGE}.jpg?v=${VERSION}`;

  /* The banner is the picture the whole page is judged on — it
     gets the big copy as its plain src, because that is the one
     the page is measured with. The small pictures inside the news
     cards are the opposite: they are drawn into a corner, so they
     start from the small copy. */
  const isBanner = /class="[^"]*top-banner__img/.test(tag);

  let out = tag.replace(src[0], `src="${isBanner ? large : small}"`);

  /* The two copies, and how wide the picture is drawn. */
  const sizes = isBanner
    ? '100vw'
    : '(max-width: 768px) 100vw, 400px';

  const srcset = `srcset="${small} ${SMALL}w, ${large} ${LARGE}w" `
    + `sizes="${sizes}"`;

  /* Keep the line the src is on as it is, and put the new
     attributes on the next one, at the same indentation. */
  const before = tag.slice(0, tag.indexOf('src="'));
  const lastLine = before.split('\n').pop();
  const indent = /^\s*/.exec(lastLine)[0];
  const sep = indent ? `\n${indent}` : ' ';

  out = out.replace(/(src="[^"]*")/, `$1${sep}${srcset}`);

  /* The width and height tell the browser the shape of the picture
     before it arrives, so the page does not jump when it does. */
  const w = isBanner ? LARGE : SMALL;
  out = out.replace(/width="\d+" height="\d+"/,
    `width="${w}" height="${Math.round(w * RATIO)}"`);

  /* The slides that are not showing are fetched last. */
  if (isBanner && !/fetchpriority=/.test(out)) {
    out = out.replace(/(\s+)(data-carousel-slide)/, '$1fetchpriority="low"$1$2');
  }

  return out;
}

async function main() {
  let touched = 0;
  let pictures = 0;

  for (const file of await pagesToDo(process.argv.slice(2))) {
    const full = path.join(ROOT, file);
    const raw = await readFile(full, 'utf8');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const text = raw.replace(/\r\n/g, '\n');

    let count = 0;
    const out = text.replace(/<img\b[^>]*>/g, (tag) => {
      const next = rewriteTag(tag);
      if (next == null) return tag;
      count++;
      return next;
    });

    if (!count) continue;
    const result = eol === '\r\n' ? out.replace(/\n/g, '\r\n') : out;
    await writeFile(full, result, 'utf8');
    console.log(`[update-carousel-markup] ${file} — ${count} picture(s)`);
    touched++;
    pictures += count;
  }

  console.log(`[update-carousel-markup] ${pictures} picture(s) in ${touched} file(s).`);
}

main().catch((e) => {
  console.error(`\n[update-carousel-markup] ${e.stack || e.message}\n`);
  process.exit(1);
});
