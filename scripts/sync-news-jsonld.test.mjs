/* ===========================================================
   The checks for the news structured data.

   assets/js/data.js holds three copies of the news block — one per
   language — and the sync rewrites them from assets/data/news.json
   every time the feed is pulled.

   The write used to push the key four spaces to the right every
   time it ran: the line's own indentation was kept, and the block
   added four more on top of it. By November the key sat eighty-eight
   spaces in while the keys beside it sat four, and every commit
   carried the difference.

   These tests are what stop it from doing that again.

   Run: node --test scripts/sync-news-jsonld.test.mjs
   =========================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { renderBlock, replaceBlock } from './sync-news-jsonld.mjs';
import { i18n } from '../assets/js/data.js';
import { ROOT } from './lib/site.mjs';

const SITE = 'https://www.tzero-jp.com';

const LANGS = [
  { key: 'zh', home: '首頁',     latest: '最新動態',   listName: 'T-ZERO 第九感 最新動態' },
  { key: 'en', home: 'Home',     latest: 'Latest News', listName: 'T-ZERO NINTH SENSE Updates' },
  { key: 'ja', home: 'ホーム',   latest: '最新ニュース', listName: 'T-ZERO 第九感 最新情報' },
];

const DATA_JS = path.join(ROOT, 'assets', 'js', 'data.js');

/* A data.js with one news block in it, as it looks before a sync.
   The indentation is given, because that is the thing that used to
   go wrong: a block written deep in the file and one written at the
   normal depth must both end up in the same place. */
function withBlock(indent, lang) {
  return [
    '  zh: {',
    "    'seo.jsonld.home': JSON.stringify({}),",
    `${indent}'seo.jsonld.news': JSON.stringify({`,
    '      "@context": "https://schema.org",',
    '      "@graph": [ { "@type": "BreadcrumbList", "itemListElement": [',
    `        { "@type": "ListItem", "position": 1, "name": ${JSON.stringify(lang.home)}, "item": ${JSON.stringify(SITE)} }`,
    '      ] } ]',
    '    }),',
    '  },',
  ].join('\n');
}

test('writing the block again leaves it exactly where it was', () => {
  const lang = LANGS[0];
  const block = renderBlock({ siteUrl: SITE, lang, items: [] });

  for (const indent of ['    ', '                        ']) {
    const once = replaceBlock(withBlock(indent, lang), lang, block);
    const twice = replaceBlock(once, lang, block);
    assert.equal(twice, once,
      `the block moved the second time it was written (it had ${indent.length} spaces)`);
  }
});

test('the news key sits at the same depth as the keys beside it', async () => {
  const html = await readFile(DATA_JS, 'utf8');
  const depths = new Map();

  for (const m of html.matchAll(/^([ ]*)'seo\.jsonld\.(\w+)':/gm)) {
    const [, indent, key] = m;
    if (!depths.has(key)) depths.set(key, new Set());
    depths.get(key).add(indent.length);
  }

  for (const key of ['home', 'products', 'news']) {
    const found = depths.get(key);
    assert.ok(found, `data.js has no seo.jsonld.${key} block`);
    assert.equal(found.size, 1,
      `seo.jsonld.${key} is written at ${[...found].join(' and ')} spaces`);
  }

  assert.equal(
    [...depths.get('news')][0],
    [...depths.get('home')][0],
    'the news block is not written at the same depth as the blocks beside it',
  );
});

test('the three news blocks are still readable', () => {
  for (const lang of ['zh', 'en', 'ja']) {
    const graph = JSON.parse(i18n[lang]['seo.jsonld.news'])['@graph'];
    const list = graph.find((n) => n['@type'] === 'ItemList');
    assert.ok(list, `${lang}: the news list is not in the structured data`);
    assert.equal(
      list.itemListElement.length,
      list.numberOfItems,
      `${lang}: the news list says it has ${list.numberOfItems} posts but lists ${list.itemListElement.length}`,
    );
  }
});
