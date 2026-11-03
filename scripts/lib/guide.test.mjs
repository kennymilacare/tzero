/* ===========================================================
   The checks that keep the buying guides honest.

   Five guides, three languages each, fifteen pages. A guide is
   the part of the site that answers a question before anybody
   buys anything — so it has to be readable, it has to say the
   same thing in all three languages, and it has to be found.

   These tests are what stop that from quietly going wrong: a
   Japanese sentence with a Korean word in it, a question on the
   page that is not in the structured data, a guide that links to
   a page which does not exist, a guide that the search box has
   never heard of.

   Run: node --test scripts/lib/guide.test.mjs
   =========================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import { products, productUrl } from '../../assets/js/data.js';
import { GUIDES, GUIDE_HUB, GUIDE_UI } from './guides.mjs';
import { escapeText } from './html.mjs';
import { HTML_LANG, LANGS, pageFile, pageUrl } from './langs.mjs';
import { changedOn } from './sitemap.mjs';
import { ROOT } from './site.mjs';
import { SPOKEN } from './spoken.mjs';

const SITE = 'https://www.tzero-jp.com';

/* The writing systems that must not turn up where they do not
   belong. Japanese uses kanji, which look like Chinese, so kanji
   on its own is not a mistake — but Hangul and Cyrillic in a
   Japanese sentence always are. */
const HANGUL = /[ᄀ-ᇿ㄰-㆏ꥠ-꥿가-힯]/;
const CYRILLIC = /[Ѐ-ӿԀ-ԯ]/;
const CJK = /[　-〿㐀-䶿一-鿿豈-﫿＀-￯]/;
const KANA = /[぀-ゟ゠-ヿ]/;
const BROKEN = /�/;

/* ---------- helpers ---------- */

async function readPage(name) {
  const raw = await readFile(path.join(ROOT, name), 'utf8');
  return raw.replace(/\r\n/g, '\n');
}

async function there(file) {
  return access(path.join(ROOT, file)).then(() => true, () => false);
}

/** Every page the site publishes. */
async function sitePages() {
  const { readdir } = await import('node:fs/promises');
  const out = [];
  for (const dir of ['', 'en', 'ja']) {
    const inner = await readdir(path.join(ROOT, dir)).catch(() => []);
    for (const name of inner) {
      if (name.endsWith('.html')) out.push(dir ? `${dir}/${name}` : name);
    }
  }
  return out;
}

/** Every sentence of a guide, in one language. */
function textsOf(guide, lang) {
  const out = [];
  const push = (field) => {
    if (field == null) return;
    if (typeof field === 'string') { out.push(field); return; }
    const v = field[lang];
    if (typeof v === 'string') out.push(v);
  };

  push(guide.short); push(guide.blurb); push(guide.eyebrow); push(guide.h1);
  push(guide.title); push(guide.description); push(guide.lead);

  for (const section of guide.sections) {
    push(section.h2);
    for (const block of section.blocks) {
      push(block.text); push(block.title);
      (block.items || []).forEach(push);
      (block.head || []).forEach(push);
      (block.rows || []).forEach((row) => row.forEach(push));
    }
  }

  for (const item of guide.faq) { push(item.q); push(item.a); }

  return out.filter((s) => s && s.trim());
}

/** The FAQ node in a page's structured data. */
function faqNode(html) {
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let graph;
    try {
      graph = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const nodes = graph['@graph'] || [graph];
    const faq = nodes.find((n) => n['@type'] === 'FAQPage');
    if (faq) return faq;
  }
  return null;
}

/* ---------- the shape of a guide ---------- */

test('every guide has a heading, some writing, a table and three questions', () => {
  for (const guide of GUIDES) {
    assert.ok(guide.h1 && guide.h1.zh, `${guide.slug}: no heading`);
    assert.ok(guide.lead && guide.lead.zh, `${guide.slug}: no lead paragraph`);
    assert.ok(guide.sections.length >= 3, `${guide.slug}: only ${guide.sections.length} section(s)`);
    assert.ok(guide.faq.length >= 3, `${guide.slug}: only ${guide.faq.length} question(s)`);

    const blocks = guide.sections.flatMap((s) => s.blocks);
    assert.ok(blocks.some((b) => b.t === 'p'), `${guide.slug}: no writing`);
    assert.ok(blocks.some((b) => b.t === 'table'), `${guide.slug}: no table`);

    const ids = guide.sections.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, `${guide.slug}: two sections share an id`);
  }
});

test('every guide says the same thing in all three languages', () => {
  for (const guide of GUIDES) {
    for (const field of ['short', 'blurb', 'eyebrow', 'h1', 'title', 'description', 'lead']) {
      for (const lang of LANGS) {
        assert.ok(guide[field] && guide[field][lang], `${guide.slug}: no ${lang} ${field}`);
      }
    }
    for (const section of guide.sections) {
      for (const lang of LANGS) {
        assert.ok(section.h2 && section.h2[lang], `${guide.slug}/${section.id}: no ${lang} heading`);
      }
    }
    for (const item of guide.faq) {
      for (const lang of LANGS) {
        assert.ok(item.q && item.q[lang], `${guide.slug}: a question has no ${lang}`);
        assert.ok(item.a && item.a[lang], `${guide.slug}: an answer has no ${lang}`);
      }
    }
  }
});

/* ---------- the words ---------- */

test('the English guide has no Chinese in it, and the Japanese one is Japanese', () => {
  for (const guide of GUIDES) {
    for (const s of textsOf(guide, 'en')) {
      assert.ok(!CJK.test(s), `en/${guide.path}: "${s}" is not English`);
    }

    for (const s of textsOf(guide, 'ja')) {
      assert.ok(!HANGUL.test(s), `ja/${guide.path}: "${s}" has a Korean character in it`);
      assert.ok(!CYRILLIC.test(s), `ja/${guide.path}: "${s}" has a Cyrillic character in it`);
      assert.ok(!BROKEN.test(s), `ja/${guide.path}: "${s}" is broken`);
    }

    assert.ok(KANA.test(guide.h1.ja), `ja/${guide.path}: the heading is not written in Japanese`);
  }
});

/* The Chinese of a guide is written Chinese — the way a shop would
   put it on a shelf. The rest of the site is written this way
   already; the guides are the one place where it is easy to slip
   back into speech, and a page that reads as though it were
   dictated is a page no shop would want on its shelf.

   The words of speech and what to write instead live in
   scripts/lib/spoken.mjs, because the same rule holds for the
   news cards. */
test('the Chinese of a guide is written Chinese, not Cantonese speech', () => {
  const shared = Object.values(GUIDE_UI)
    .map((v) => (typeof v === 'string' ? v : v.zh))
    .filter(Boolean);

  for (const guide of GUIDES) {
    for (const s of [...textsOf(guide, 'zh'), ...shared]) {
      for (const [spoken, written] of SPOKEN) {
        assert.ok(!s.includes(spoken),
          `zh/${guide.path}: "${spoken}" is Cantonese speech — write "${written}" instead. In: ${s}`);
      }
    }
  }
});

test('no guide says the same word twice in the same place', () => {
  /* A translator that was run twice, or a copy-and-paste, leaves
     the same sentence in a row. It reads as a mistake. */
  for (const guide of GUIDES) {
    for (const lang of LANGS) {
      const sentences = textsOf(guide, lang);
      for (let i = 1; i < sentences.length; i++) {
        assert.notEqual(sentences[i], sentences[i - 1],
          `${lang}/${guide.path}: the same sentence appears twice in a row`);
      }
    }
  }
});

/* ---------- the pages ---------- */

test('every guide has a page in every language', async () => {
  for (const guide of GUIDES) {
    for (const lang of LANGS) {
      const file = pageFile(lang, guide.path);
      assert.ok(await there(file), `${file} is missing`);
    }
  }
});

test('each guide page carries the words of its own language', async () => {
  for (const guide of GUIDES) {
    for (const lang of LANGS) {
      const html = await readPage(pageFile(lang, guide.path));
      assert.ok(html.includes(escapeText(guide.h1[lang])),
        `${lang}/${guide.path}: the heading is not the one from the guide file`);
      assert.ok(html.includes(escapeText(guide.lead[lang])),
        `${lang}/${guide.path}: the lead paragraph is not the one from the guide file`);
    }
  }
});

test('each guide page says what it is about, in its own structured data', async () => {
  for (const guide of GUIDES) {
    for (const lang of LANGS) {
      const html = await readPage(pageFile(lang, guide.path));

      const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
      assert.ok(blocks.length, `${lang}/${guide.path}: there is no structured data`);

      const nodes = blocks.flatMap((m) => {
        const graph = JSON.parse(m[1]);
        return graph['@graph'] || [graph];
      });

      const types = nodes.map((n) => n['@type']);
      assert.ok(types.includes('BreadcrumbList'), `${lang}/${guide.path}: no breadcrumb`);
      assert.ok(types.includes('WebPage'), `${lang}/${guide.path}: no WebPage`);
      assert.ok(types.includes('FAQPage'), `${lang}/${guide.path}: no FAQPage`);

      const page = nodes.find((n) => n['@type'] === 'WebPage');
      assert.equal(page.url, pageUrl(SITE, lang, guide.path),
        `${lang}/${guide.path}: the structured data points at another page`);
      assert.equal(page.inLanguage, HTML_LANG[lang],
        `${lang}/${guide.path}: the structured data says the wrong language`);
    }
  }
});

test('the questions on the page are the questions in the structured data', async () => {
  for (const guide of GUIDES) {
    for (const lang of LANGS) {
      const html = await readPage(pageFile(lang, guide.path));
      const faq = faqNode(html);
      assert.ok(faq, `${lang}/${guide.path}: there is no FAQ in the structured data`);

      const shown = [...html.matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map((m) => m[1].trim());
      const said = faq.mainEntity.map((q) => escapeText(q.name));

      assert.equal(shown.length, guide.faq.length,
        `${lang}/${guide.path}: the page asks ${shown.length} question(s), the guide file has ${guide.faq.length}`);
      assert.deepEqual(shown, said,
        `${lang}/${guide.path}: the page and the structured data do not ask the same questions`);
    }
  }
});

test('every guide has a table of contents that points at its own sections', async () => {
  for (const guide of GUIDES) {
    for (const lang of LANGS) {
      const html = await readPage(pageFile(lang, guide.path));
      for (const section of guide.sections) {
        assert.ok(html.includes(`id="${section.id}"`),
          `${lang}/${guide.path}: the section "${section.id}" is not on the page`);
        assert.ok(html.includes(`href="#${section.id}"`),
          `${lang}/${guide.path}: the table of contents does not point at "${section.id}"`);
      }
    }
  }
});

/* ---------- the links out ---------- */

test('every guide points at pages that exist', async () => {
  for (const guide of GUIDES) {
    for (const target of guide.related) {
      for (const lang of LANGS) {
        assert.ok(await there(pageFile(lang, target)),
          `${guide.path} points at ${target}, which has no ${lang} page`);
      }
    }
  }
});

test('every guide page links to the pages the guide file says it does', async () => {
  for (const guide of GUIDES) {
    for (const lang of LANGS) {
      const html = await readPage(pageFile(lang, guide.path));
      for (const target of guide.related) {
        assert.ok(html.includes(`href="${target}"`),
          `${lang}/${guide.path}: there is no link to ${target}`);
      }
    }
  }
});

test('every guide page offers the other four guides', async () => {
  for (const guide of GUIDES) {
    for (const lang of LANGS) {
      const html = await readPage(pageFile(lang, guide.path));
      for (const other of GUIDES) {
        if (other.path === guide.path) continue;
        assert.ok(html.includes(`href="${other.path}"`),
          `${lang}/${guide.path}: there is no link to ${other.path}`);
      }
    }
  }
});

test('the picture each guide shows is really on the site', async () => {
  for (const guide of GUIDES) {
    assert.ok(await there(guide.image), `${guide.path}: ${guide.image} is missing`);
    assert.ok(guide.imageWidth && guide.imageHeight, `${guide.path}: the picture has no size`);
    assert.equal(guide.imageWidth, guide.imageHeight, `${guide.path}: the picture is not square`);
  }
});

/* ---------- the rest of the site ---------- */

test('every product page offers the guides', async () => {
  for (const product of products) {
    for (const lang of LANGS) {
      const file = pageFile(lang, productUrl(product.id));
      const html = await readPage(file);
      for (const guide of GUIDES) {
        assert.ok(html.includes(`href="${guide.path}"`),
          `${file}: there is no link to ${guide.path}`);
      }
    }
  }
});

test('the search list agrees with the guides', async () => {
  const { guides } = await import('../../assets/js/guides.js');

  assert.equal(guides.length, GUIDES.length, 'the search list and the guides are not the same number');

  for (const guide of GUIDES) {
    const found = guides.find((g) => g.slug === guide.slug);
    assert.ok(found, `${guide.slug} is not in the search list`);
    assert.equal(found.url, guide.path, `${guide.slug}: the search list points at another page`);
    assert.deepEqual(found.title, guide.short, `${guide.slug}: the search list has another title`);
    assert.deepEqual(found.desc, guide.blurb, `${guide.slug}: the search list has another description`);
  }
});

test('the sitemap lists every guide in every language', async () => {
  const xml = await readPage('sitemap.xml');
  for (const guide of GUIDES) {
    for (const lang of LANGS) {
      const loc = `<loc>${pageUrl(SITE, lang, guide.path)}</loc>`;
      assert.ok(xml.includes(loc), `the sitemap does not list ${loc}`);
    }
  }
});

/* ---------- the page that lists them all ---------- */

test('the list of the guides has a page in every language', async () => {
  for (const lang of LANGS) {
    assert.ok(await there(pageFile(lang, GUIDE_HUB.path)),
      `${pageFile(lang, GUIDE_HUB.path)} is missing`);
  }
});

test('the list of the guides says what it is', async () => {
  for (const lang of LANGS) {
    const html = await readPage(pageFile(lang, GUIDE_HUB.path));

    const nodes = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .flatMap((m) => {
        const graph = JSON.parse(m[1]);
        return graph['@graph'] || [graph];
      });

    const types = nodes.map((n) => n['@type']);
    assert.ok(types.includes('BreadcrumbList'), `${lang}/${GUIDE_HUB.path}: no breadcrumb`);
    assert.ok(types.includes('CollectionPage'), `${lang}/${GUIDE_HUB.path}: no CollectionPage`);
    assert.ok(types.includes('ItemList'), `${lang}/${GUIDE_HUB.path}: no ItemList`);

    const list = nodes.find((n) => n['@type'] === 'ItemList');
    assert.equal(list.itemListElement.length, GUIDES.length,
      `${lang}/${GUIDE_HUB.path}: the list holds ${list.itemListElement.length} of ${GUIDES.length} guides`);

    /* And the words on the page are the words in the guide files. */
    assert.ok(html.includes(escapeText(GUIDE_UI.hubH1[lang])),
      `${lang}/${GUIDE_HUB.path}: the heading is not the one from the guide files`);
    for (const guide of GUIDES) {
      assert.ok(html.includes(`href="${guide.path}"`),
        `${lang}/${GUIDE_HUB.path}: there is no link to ${guide.path}`);
    }
  }
});

test('the sitemap lists the page that lists the guides', async () => {
  const xml = await readPage('sitemap.xml');
  for (const lang of LANGS) {
    const loc = `<loc>${pageUrl(SITE, lang, GUIDE_HUB.path)}</loc>`;
    assert.ok(xml.includes(loc), `the sitemap does not list ${loc}`);
  }
});

/* ---------- the guides are found ---------- */

test('every page of the site offers the guides', async () => {
  /* The guides used to be reachable only from the four product
     pages. Every other page linked to none of them, and a crawler
     had no reason to find them. Now they are in the menu and in the
     footer of every page. */
  for (const file of await sitePages()) {
    const html = await readPage(file);

    assert.ok(html.includes(`href="${GUIDE_HUB.path}"`),
      `${file}: there is no link to ${GUIDE_HUB.path}`);

    for (const guide of GUIDES) {
      assert.ok(html.includes(`href="${guide.path}"`),
        `${file}: there is no link to ${guide.path}`);
    }
  }
});

test('the footer of every page lists the guides under their own names', async () => {
  for (const file of await sitePages()) {
    const html = await readPage(file);
    const block = html.match(/<ul data-footer-guides>([\s\S]*?)<\/ul>/);
    assert.ok(block, `${file}: the footer has no list of guides`);

    for (const guide of GUIDES) {
      assert.ok(block[1].includes(`>${escapeText(guide.short.zh)}<`)
        || block[1].includes(`>${escapeText(guide.short.en)}<`)
        || block[1].includes(`>${escapeText(guide.short.ja)}<`),
        `${file}: the footer does not name ${guide.slug}`);
    }
  }
});

/* ---------- the date on the page ---------- */

test('the date a guide shows is the day its words were last changed', async () => {
  /* The date used to be written down by hand, in the guide file, and
     it went out of date the moment a guide was rewritten. It comes
     from git now: the day the words were last committed. */
  for (const guide of GUIDES) {
    const source = `scripts/lib/guides/${guide.slug}.mjs`;
    const date = await changedOn(source);
    if (!date) continue;   /* git cannot say — nothing to check */

    for (const lang of LANGS) {
      const html = await readPage(pageFile(lang, guide.path));
      assert.ok(html.includes(`<time datetime="${date}">${date}</time>`),
        `${lang}/${guide.path}: the page does not show ${date}, the day the words were changed`);
    }
  }
});
