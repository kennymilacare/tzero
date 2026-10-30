/* ===========================================================
   The checks that keep the three languages honest.

   Each page now exists in three languages, at three addresses,
   and the words in each one are written into the file at build
   time. That is the whole point of the change — a crawler does not
   run JavaScript, so what is in the file is all there is.

   These tests are what stop that from quietly going wrong: a page
   that says it is in a language it is not, a translation that was
   never done, an alternate link that points at the same address as
   the page it is on, a link that leaves the language folder and
   lands the reader on the Chinese page.

   Run: node --test scripts/lib/lang.test.mjs
   =========================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import { HTML_LANG, LANGS, NEXT_LANG, PAGES, pageFile, pageUrl, relativePath } from './langs.mjs';
import { attrsOf, elements, scan } from './html.mjs';
import { ROOT } from './site.mjs';

const SITE = 'https://www.tzero-jp.com';

/* The comments are for people; a word inside one is not a word on
   the page. */
function withoutComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

async function readPage(name) {
  const raw = await readFile(path.join(ROOT, name), 'utf8');
  return raw.replace(/\r\n/g, '\n');
}

async function there(file) {
  return access(path.join(ROOT, file)).then(() => true, () => false);
}

/* ---------- the files themselves ---------- */

test('every page has a version in every language', async () => {
  for (const page of PAGES) {
    for (const lang of LANGS) {
      const file = pageFile(lang, page.path);
      assert.ok(await there(file), `${lang}: ${file} is missing`);
    }
  }
});

test('each language page says what language it is in', async () => {
  for (const page of PAGES) {
    for (const lang of LANGS) {
      const html = await readPage(pageFile(lang, page.path));
      assert.match(
        html,
        new RegExp(`<html lang="${HTML_LANG[lang]}" data-lang="${lang}"`),
        `${lang}/${page.path}: the page does not say which language it is in`,
      );
    }
  }
});

test('the English and Japanese pages have nothing left for the browser to do', async () => {
  for (const page of PAGES) {
    for (const lang of ['en', 'ja']) {
      const html = await readPage(pageFile(lang, page.path));
      assert.doesNotMatch(
        html,
        /data-i18n(-attr|-aria|-placeholder|-html|-json)?=/,
        `${lang}/${page.path}: a translation marker was left in the file`,
      );
    }
  }
});

/* ---------- the words ---------- */

/* A word that only exists in one language, and the word it
   replaced. The first is on the page; the second must not be. */
const LANGUAGE_PROOF = [
  { file: 'en/terms.html', has: 'Privacy Policy', hasNot: '私隱權政策' },
  { file: 'en/terms.html', has: 'Returns and exchanges', hasNot: '退換貨政策' },
  { file: 'en/terms.html', has: 'Governing law', hasNot: '適用法律' },
  { file: 'ja/terms.html', has: 'プライバシーポリシー', hasNot: '私隱權政策' },
  { file: 'ja/terms.html', has: '返品・交換について', hasNot: '退換貨政策' },
  { file: 'en/index.html', has: 'Hyaluronic acid', hasNot: '玻尿酸' },
  { file: 'ja/index.html', has: 'ヒアルロン酸', hasNot: '玻尿酸' },
  { file: 'en/contact.html', has: 'Kwun Tong', hasNot: '九龍觀塘173號申新大廈5樓' },
  { file: 'en/news.html', has: 'News', hasNot: '最新動態' },
  { file: 'en/about.html', has: 'About', hasNot: '關於我們' },
];

test('the English page really is English, and the Japanese one really is Japanese', async () => {
  for (const { file, has, hasNot } of LANGUAGE_PROOF) {
    const html = withoutComments(await readPage(file));
    assert.ok(html.includes(has), `${file}: "${has}" is not on the page`);
    assert.ok(!html.includes(hasNot), `${file}: "${hasNot}" is still on the page`);
  }
});

test('the three legal pages have the same shape', async () => {
  const count = async (file) => {
    const html = await readPage(file);
    /* Only what is inside the article — the footer has headings of
       its own, and the footer is not the legal writing. */
    const tags = scan(html);
    const spans = elements(html, tags);
    let inner = '';
    for (const tag of tags) {
      if (tag.closing) continue;
      const attrs = attrsOf(tag);
      if (tag.name !== 'article' || !String(attrs.class || '').includes('legal-prose')) continue;
      const span = spans.get(tag.start);
      if (span) inner = html.slice(span.contentStart, span.contentEnd);
      break;
    }
    assert.ok(inner, `${file}: the legal article is not there`);
    return {
      h2: (inner.match(/<h2[ >]/g) || []).length,
      h3: (inner.match(/<h3[ >]/g) || []).length,
      p: (inner.match(/<p[ >]/g) || []).length,
      li: (inner.match(/<li>/g) || []).length,
    };
  };

  const zh = await count('terms.html');
  for (const lang of ['en', 'ja']) {
    const other = await count(`${lang}/terms.html`);
    assert.deepEqual(other, zh, `${lang}/terms.html: the legal page is not the same shape as the Chinese one`);
  }
});

/* ---------- the addresses ---------- */

test('the canonical link points at the page itself', async () => {
  for (const page of PAGES) {
    for (const lang of LANGS) {
      const html = await readPage(pageFile(lang, page.path));
      const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
      const own = pageUrl(SITE, lang, page.path);
      assert.equal(canonical, own, `${lang}/${page.path}: the canonical link is not this page`);
    }
  }
});

test('the alternate links point at three real addresses, and at each other', async () => {
  for (const page of PAGES) {
    for (const lang of LANGS) {
      const html = await readPage(pageFile(lang, page.path));

      const alts = {};
      for (const m of html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)) {
        alts[m[1]] = m[2];
      }

      assert.equal(alts[HTML_LANG.zh], pageUrl(SITE, 'zh', page.path), `${lang}: the Chinese alternate is wrong`);
      assert.equal(alts[HTML_LANG.en], pageUrl(SITE, 'en', page.path), `${lang}: the English alternate is wrong`);
      assert.equal(alts[HTML_LANG.ja], pageUrl(SITE, 'ja', page.path), `${lang}: the Japanese alternate is wrong`);
      assert.equal(alts['x-default'], pageUrl(SITE, 'zh', page.path), `${lang}: the default alternate is wrong`);

      /* Three different addresses — a search engine treats four
         alternates that all point at the same place as a mistake. */
      const addresses = new Set([alts[HTML_LANG.zh], alts[HTML_LANG.en], alts[HTML_LANG.ja]]);
      assert.equal(addresses.size, 3, `${lang}/${page.path}: the three languages share one address`);
    }
  }
});

test('the language toggle points at the same page in the next language', async () => {
  for (const page of PAGES) {
    for (const lang of LANGS) {
      const html = await readPage(pageFile(lang, page.path));
      const toggle = html.match(/<a class="lang-toggle"[^>]*href="([^"]+)"[^>]*>/)?.[1];
      assert.equal(toggle, relativePath(lang, NEXT_LANG[lang], page.path),
        `${lang}/${page.path}: the toggle does not point at the next language`);
    }
  }
});

test('every page knows where its other two versions live', async () => {
  /* The page says so, so an old shared link with #lang=en can be
     turned into a real address instead of a hash nobody follows. */
  for (const page of PAGES) {
    for (const lang of LANGS) {
      const html = await readPage(pageFile(lang, page.path));
      const raw = html.match(/data-lang-urls='([^']*)'/)?.[1];
      assert.ok(raw, `${lang}/${page.path}: the page does not say where the other versions are`);

      const urls = JSON.parse(raw);
      for (const other of LANGS) {
        assert.equal(urls[other], pageUrl(SITE, other, page.path),
          `${lang}/${page.path}: the ${other} address is wrong`);
      }
    }
  }
});

test('the links on a page stay inside its own language', async () => {
  for (const page of PAGES) {
    for (const lang of LANGS) {
      const html = await readPage(pageFile(lang, page.path));
      const folder = lang === 'zh' ? '' : `${lang}/`;

      for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
        const href = m[1];
        if (/^(https?:|mailto:|tel:|#|\/\/)/.test(href)) continue;

        /* The language toggle is meant to leave the language. */
        if (m[0].includes('class="lang-toggle"')) continue;

        const target = path.posix.join(folder, href.split('#')[0].split('?')[0]);
        assert.ok(
          target.startsWith(folder),
          `${lang}/${page.path}: the link "${href}" leaves the ${lang} pages`,
        );
      }
    }
  }
});

/* ---------- the files a page points at ---------- */

test('every file a page points at is really there', async () => {
  for (const page of PAGES) {
    for (const lang of LANGS) {
      const file = pageFile(lang, page.path);
      const html = await readPage(file);
      const folder = path.dirname(file);

      const refs = [];
      for (const m of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) refs.push(m[1]);

      for (const ref of refs) {
        if (/^(https?:|mailto:|tel:|data:|#|\/\/)/.test(ref)) continue;
        const clean = ref.split('#')[0].split('?')[0];
        if (!clean) continue;

        const target = path.join(ROOT, folder, clean);
        assert.ok(await there(path.relative(ROOT, target)), `${file}: "${ref}" is not there`);
      }
    }
  }
});
