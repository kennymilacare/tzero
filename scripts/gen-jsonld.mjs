#!/usr/bin/env node
/* ===========================================================
   gen-jsonld.mjs — put the structured data in the markup.

   The problem
   ------------
   The pages used to carry an empty block:

       <script type="application/ld+json" data-i18n-json="seo.jsonld.home">
       </script>

   and JavaScript filled it in once the page loaded. A crawler
   that does not run scripts — which is most of them, and all of
   the ones that never look at a rich result — saw nothing at
   all. An empty JSON-LD block is worse than no block: a parser
   that finds one it cannot read may throw the whole page's
   structured data away.

   What it does now
   -----------------
   The Chinese version — the site's own language — is written
   into the file at build time. The page still swaps it for the
   visitor's language when it loads, so nothing changes for a
   reader; but a crawler reads the whole thing straight out of
   the markup.

   Run: node scripts/gen-jsonld.mjs
   =========================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { i18n } from '../assets/js/data.js';
import { ROOT } from './lib/site.mjs';

/* The language the markup is written in. The other two are put in
   by the browser when the visitor switches. */
const LANG = 'zh';

/* The pages that carry structured data, and the key that holds it. */
const PAGES = [
  { file: 'index.html', key: 'seo.jsonld.home' },
  { file: 'news.html', key: 'seo.jsonld.news' },
  { file: 'products.html', key: 'seo.jsonld.products' },
];

/* The pages that carry nothing but a breadcrumb and a line about
   themselves. What they say about themselves is already in the
   page — its <title> and its description — so it is read from
   there rather than written out a second time. */
const PLAIN_PAGES = [
  { file: 'about.html', type: 'WebPage' },
  { file: 'contact.html', type: 'ContactPage' },
  { file: 'terms.html', type: 'WebPage' },
];

/* The site's own address. */
const SITE = 'https://www.tzero-jp.com';

/**
 * Put the JSON into the block, keeping the attributes.
 *
 * The attributes matter: `data-i18n-json` is what the browser
 * looks for when it swaps the block for the visitor's language.
 */
function fill(text, key, json) {
  const re = new RegExp(
    `(<script type="application/ld\\+json"[^>]*data-i18n-json="${key}"[^>]*>)([\\s\\S]*?)(</script>)`,
  );
  const m = text.match(re);
  if (!m) throw new Error(`the page has no [data-i18n-json="${key}"] block`);
  return text.slice(0, m.index) + m[1] + '\n' + json + '\n' + m[3] + text.slice(m.index + m[0].length);
}

/**
 * The plain pages: a breadcrumb and the page itself.
 *
 * The title and the description are read out of the page, so the
 * structured data cannot say something different from what the
 * page says.
 */
function plainGraph(text, file, type) {
  const title = text.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
  const description = text.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim();
  if (!title) throw new Error(`${file} has no <title>`);

  const page = {
    '@type': type,
    '@id': `${SITE}/${file}#webpage`,
    url: `${SITE}/${file}`,
    name: title,
    isPartOf: { '@id': `${SITE}/#site` },
    inLanguage: 'zh-HK',
  };
  if (description) page.description = description;
  /* The contact page is about the shop, so it points at the shop. */
  if (type === 'ContactPage') page.mainEntity = { '@id': `${SITE}/#org` };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首頁', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: title, item: `${SITE}/${file}` },
        ],
      },
      page,
    ],
  };
}

/**
 * Put the JSON into the block, keeping the attributes.
 *
 * The attributes matter: `data-i18n-json` is what the browser
 * looks for when it swaps the block for the visitor's language.
 */
function fillPlain(text, json) {
  const re = /(<script type="application\/ld\+json"[^>]*data-seo-jsonld="page"[^>]*>)([\s\S]*?)(<\/script>)/;
  const m = text.match(re);
  if (!m) throw new Error('the page has no [data-seo-jsonld="page"] block');
  return text.slice(0, m.index) + m[1] + '\n' + json + '\n' + m[3] + text.slice(m.index + m[0].length);
}

async function main() {
  for (const { file, key } of PAGES) {
    const full = path.join(ROOT, file);
    const raw = await readFile(full, 'utf8');
    /* The file mixes line endings; keep the one it came with. */
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const text = raw.replace(/\r\n/g, '\n');

    const graph = i18n[LANG][key];
    if (!graph) throw new Error(`data.js has no ${LANG}["${key}"]`);

    /* `</` inside a <script> would close the block early. It cannot
       appear in our JSON, but a stray one would break the page. */
    const json = JSON.stringify(JSON.parse(graph), null, 2).replace(/<\//g, '<\\/');

    const out = fill(text, key, json);
    const result = eol === '\r\n' ? out.replace(/\n/g, '\r\n') : out;

    if (result === raw) {
      console.log(`[gen-jsonld] ${file} already has the current structured data.`);
      continue;
    }

    await writeFile(full, result, 'utf8');
    console.log(`[gen-jsonld] wrote the structured data into ${file}.`);
  }

  for (const { file, type } of PLAIN_PAGES) {
    const full = path.join(ROOT, file);
    const raw = await readFile(full, 'utf8');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    const text = raw.replace(/\r\n/g, '\n');

    const json = JSON.stringify(plainGraph(text, file, type), null, 2).replace(/<\//g, '<\\/');
    const out = fillPlain(text, json);
    const result = eol === '\r\n' ? out.replace(/\n/g, '\r\n') : out;

    if (result === raw) {
      console.log(`[gen-jsonld] ${file} already has the current structured data.`);
      continue;
    }

    await writeFile(full, result, 'utf8');
    console.log(`[gen-jsonld] wrote the structured data into ${file}.`);
  }
}

main().catch((e) => {
  console.error(`\n[gen-jsonld] ${e.stack || e.message}\n`);
  process.exit(1);
});
