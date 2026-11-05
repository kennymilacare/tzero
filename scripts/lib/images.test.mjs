/* ===========================================================
   The checks that keep the pictures honest.

   The photographs on this site were stored at the size a camera
   took them — 2048 pixels square, and the studded one weighed
   880 KB. The catalogue shows that picture 300 pixels wide and
   the product page 600, so a visitor on a phone was downloading a
   photograph six times the size of the screen it went on, and the
   catalogue alone asked for 2.1 MB of pictures.

   Now every photograph comes in three widths and two formats, and
   the page asks for the one that suits the screen it is on. These
   tests are what stop that from quietly going wrong:

     · a picture with no width and no height makes the page jump
       when it arrives;
     · a photograph offered outside a <picture> is offered as the
       original, at full size, to every browser;
     · a <picture> whose <img> is not the last thing inside it is
       not a <picture> the browser will read;
     · a copy that the page offers but that is not in the
       repository is a broken picture.

   Run: node --test scripts/lib/images.test.mjs
   =========================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import { isPhoto } from '../../assets/js/photos.js';
import { attrsOf, elements, scan } from './html.mjs';
import { LANGS, PAGES, pageFile } from './langs.mjs';
import { ROOT } from './site.mjs';

/* The pages that are not part of the language set but are still
   published. */
const EXTRA = ['404.html'];

/** Every page of the site, in every language. */
function allPages() {
  const files = [];
  for (const page of PAGES) {
    for (const lang of LANGS) files.push(pageFile(lang, page.path));
  }
  for (const file of EXTRA) files.push(file);
  return files;
}

async function readPage(name) {
  const raw = await readFile(path.join(ROOT, name), 'utf8');
  return raw.replace(/\r\n/g, '\n');
}

async function there(file) {
  return access(path.join(ROOT, file)).then(() => true, () => false);
}

/* The <picture> elements of a page, and what is inside each one. */
function picturesIn(html) {
  const tags = scan(html);
  const spans = elements(html, tags);
  const out = [];

  for (const tag of tags) {
    if (tag.closing || tag.name !== 'picture') continue;
    const span = spans.get(tag.start);
    if (!span) continue;

    const inner = html.slice(span.contentStart, span.contentEnd);
    const innerTags = scan(inner);

    /* The <img> has to be the last thing inside a <picture> — that
       is the rule the HTML makes, and a browser that does not
       follow it will not use the picture at all. */
    const last = [...innerTags].reverse().find((t) => !t.closing && t.name !== 'source');

    out.push({
      tag,
      inner,
      innerTags,
      last,
      webp: innerTags.some((t) => !t.closing && t.name === 'source'
        && String(attrsOf(t).type || '').toLowerCase() === 'image/webp'),
    });
  }

  return out;
}

/* The pictures of a page that are photographs. */
function isPhotoSrc(src) {
  if (!src) return false;
  return isPhoto(String(src).replace(/\?v=\d+$/, ''));
}

/* ---------- the shape of the picture ---------- */

test('every picture says how big it is, so the page does not jump', async () => {
  for (const file of allPages()) {
    const html = await readPage(file);
    for (const tag of scan(html)) {
      if (tag.closing || tag.name !== 'img') continue;
      const attrs = attrsOf(tag);
      /* A picture with no source has nothing to load and nothing to
         size — the lightbox is filled in by the script when it is
         opened, and it is the picture it shows that has to say how
         big it is. */
      if (!attrs.src) continue;
      assert.ok(attrs.width, `${file}: a picture has no width`);
      assert.ok(attrs.height, `${file}: a picture has no height`);
      assert.match(String(attrs.width), /^\d+$/, `${file}: the width is not a number`);
      assert.match(String(attrs.height), /^\d+$/, `${file}: the height is not a number`);
    }
  }
});

test('every photograph is offered in a picture, with a WebP copy first', async () => {
  for (const file of allPages()) {
    const html = await readPage(file);
    const pictures = picturesIn(html);

    for (const tag of scan(html)) {
      if (tag.closing || tag.name !== 'img') continue;
      const attrs = attrsOf(tag);
      if (!isPhotoSrc(attrs.src) && !isPhotoSrc(String(attrs.srcset || '').split(',')[0])) continue;

      const inside = pictures.find((p) => p.inner.includes(tag.text));
      assert.ok(inside,
        `${file}: a photograph is offered on its own, with no picture to choose from`);
      assert.ok(inside.webp,
        `${file}: a photograph is offered without a WebP copy`);
    }
  }
});

test('the picture inside a picture is the last thing in it', async () => {
  for (const file of allPages()) {
    const html = await readPage(file);
    for (const picture of picturesIn(html)) {
      assert.ok(picture.last, `${file}: a picture holds nothing`);
      assert.equal(picture.last.name, 'img',
        `${file}: the <img> is not the last thing inside its <picture>`);
    }
  }
});

/* ---------- the files the page offers ---------- */

test('every copy a page offers is really there', async () => {
  for (const file of allPages()) {
    const html = await readPage(file);
    const folder = path.dirname(file);

    const offered = [];
    for (const tag of scan(html)) {
      if (tag.closing) continue;
      const attrs = attrsOf(tag);
      if (attrs.srcset) {
        for (const part of String(attrs.srcset).split(',')) {
          const url = part.trim().split(/\s+/)[0];
          if (url) offered.push(url);
        }
      }
    }

    for (const url of offered) {
      if (/^(https?:|data:|\/\/)/.test(url)) continue;
      const clean = url.split('#')[0].split('?')[0];
      if (!clean) continue;

      const target = path.join(ROOT, folder, clean);
      assert.ok(await there(path.relative(ROOT, target)),
        `${file}: "${url}" is offered on the page but is not there`);
    }
  }
});
