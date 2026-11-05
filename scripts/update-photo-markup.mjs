#!/usr/bin/env node
/* ===========================================================
   update-photo-markup.mjs — give the photographs their sizes.

   The photographs on this site were stored at the size a camera
   took them: 2048 pixels square, and the studded one weighed
   880 KB. The page shows that picture 300 pixels wide in the
   catalogue and 600 on its own page — so a visitor on a phone was
   downloading a photograph six times the size of the screen it
   went on, and the catalogue alone asked for 2.1 MB of pictures.

   scripts/compress-photos.py has made three copies of each
   photograph, in WebP and in JPEG, at 320, 640 and 1200 pixels
   wide. This puts them into the markup:

     · a <picture> that offers the WebP first and falls back to
       the JPEG;
     · a srcset, so the browser fetches the copy that suits the
       screen it is on — a phone takes the small one, a desktop
       the large one;
     · the width and the height, so the page knows the shape of
       the picture before it arrives and does not jump when it
       does.

   The <picture> is given `display: contents` in base.css, so it
   is not a box of its own: every rule that was written for an
   <img> keeps working unchanged.

   Only the pages that hold photographs by hand are touched. The
   catalogue, the product pages and the guides are written by
   scripts/gen-product-pages.mjs and scripts/lib/guide-page.mjs,
   which already build the picture the same way.

   Run: node scripts/update-photo-markup.mjs index.html about.html
   Or with no names, every page of the site is done:

       node scripts/update-photo-markup.mjs
   =========================================================== */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { isPhoto, photoCopy, photoSrcset, PHOTO_VERSION, SIZES } from '../assets/js/photos.js';
import { ROOT } from './lib/site.mjs';

/**
 * How wide the picture is drawn, for each place it appears.
 *
 * The browser uses this to work out which copy to fetch, so it
 * has to match what the CSS actually does with the picture.
 */
const SIZES_BY_CLASS = [
  [/hero__art/, '(max-width: 900px) 100vw, 480px'],
  [/series-card__media/, SIZES.card],
  [/about-flip__face/, SIZES.wide],
  [/card-product__media/, SIZES.card],
  [/news-card__media/, SIZES.news],
];

/** The size to declare for a photograph. Every photograph on the
    site is square, and so is every copy of one. */
const RATIO = 1;

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
 */
function pagesToDo(asked) {
  if (!asked.length) return htmlPages();
  return Promise.resolve(asked.map((f) => f.split(path.sep).join('/')));
}

/** The attributes of a tag, as a plain object. */
function parseAttrs(tag) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(tag))) attrs[m[1]] = m[2];
  return attrs;
}

/** The size to declare for a photograph. */
function dimensions() {
  return [1200, 1200];
}

/**
 * One picture tag, rewritten.
 *
 * The tag is found by what it points at, not by how it is written,
 * so the pages do not have to agree on the order of the attributes
 * for this to work.
 */
function rewriteTag(tag, indent) {
  const attrs = parseAttrs(tag);
  const raw = attrs.src;
  if (!raw) return null;

  /* The number in the query is the browser's way of being told
     the picture has changed; the copies carry their own. */
  const src = raw.replace(/\?v=\d+$/, '');
  if (!isPhoto(src)) return null;
  if (/srcset=/.test(tag)) return null;   /* already done */

  const sizes = (SIZES_BY_CLASS.find(([re]) => re.test(attrs.class || '')) || [null, SIZES.wide])[1];
  const [width, height] = dimensions();

  /* The attributes the picture keeps, in the order the pages use. */
  const keep = [];
  if (attrs.class) keep.push(`class="${attrs.class}"`);
  keep.push(`alt="${attrs.alt ?? ''}"`);
  keep.push(`width="${width}"`);
  keep.push(`height="${height}"`);
  keep.push(`loading="${attrs.loading || 'lazy'}"`);
  if (attrs.fetchpriority) keep.push(`fetchpriority="${attrs.fetchpriority}"`);
  keep.push(`decoding="${attrs.decoding || 'async'}"`);
  /* The translation hook, if the page had one. */
  for (const name of ['data-i18n-attr', 'data-i18n', 'data-i18n-aria']) {
    if (attrs[name]) keep.push(`${name}="${attrs[name]}"`);
  }

  const inner = indent + '  ';
  const cont = inner + '       ';

  return [
    `${indent}<picture>`,
    `${inner}<source type="image/webp" srcset="${photoSrcset(src, 'webp')}" sizes="${sizes}">`,
    `${inner}<img src="${photoCopy(src, 1200, 'jpg')}?v=${PHOTO_VERSION}"`,
    `${cont}srcset="${photoSrcset(src, 'jpg')}"`,
    `${cont}sizes="${sizes}"`,
    ...keep.map((a) => `${cont}${a}`),
    `${inner}>`,
    `${indent}</picture>`,
  ].join('\n');
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
    const out = text.replace(/<img\b[^>]*>/g, (tag, at) => {
      /* The indentation of the line the tag starts on. */
      const lineStart = text.lastIndexOf('\n', at) + 1;
      const indent = /^[ \t]*/.exec(text.slice(lineStart, at))[0];
      const next = rewriteTag(tag, indent);
      if (next == null) return tag;
      count++;
      return next;
    });

    if (!count) continue;
    const result = eol === '\r\n' ? out.replace(/\n/g, '\r\n') : out;
    await writeFile(full, result, 'utf8');
    console.log(`[update-photo-markup] ${file} — ${count} picture(s)`);
    touched++;
    pictures += count;
  }

  console.log(`[update-photo-markup] ${pictures} picture(s) in ${touched} file(s).`);
}

main().catch((e) => {
  console.error(`\n[update-photo-markup] ${e.stack || e.message}\n`);
  process.exit(1);
});
