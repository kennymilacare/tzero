#!/usr/bin/env node
/* ===========================================================
   gen-lang-pages.mjs — one page per language, per page.

   The problem
   ------------
   The site used to have three languages behind one address. The
   words were swapped in by JavaScript, so a crawler — which does
   not run scripts, and has no cookie to remember — only ever saw
   the Chinese version. The English and Japanese pages could not
   be found at all.

   Worse, the alternate links said that the English and Japanese
   versions were at the same address as the Chinese one, which is
   not true and which a search engine takes as a contradiction.

   What this does now
   -------------------
   Every page has an address of its own in every language:

       /            /products.html        Chinese
       /en/         /en/products.html     English
       /ja/         /ja/products.html     Japanese

   The Chinese pages stay where they are, so no old link dies. The
   words are written into the file at build time, so a crawler
   reads them without running anything — and the alternate links
   point at three real addresses that point back at each other.

   The Chinese pages are written too: their head is brought in
   line with the same rule, so the three versions of a page agree
   with each other. The four Chinese product pages belong to
   scripts/gen-product-pages.mjs, which writes them from the same
   builders.

   Run: node scripts/gen-lang-pages.mjs
   =========================================================== */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { faqs, i18n, products, productUrl } from '../assets/js/data.js';
import { buildProductPage } from './lib/product-page.mjs';
import { localiseGraph, plainGraph, t, translatePage } from './lib/langpage.mjs';
import { faqBlock } from './lib/seo.mjs';
import { LANGS, PAGES } from './lib/langs.mjs';
import { loadSite, ROOT } from './lib/site.mjs';
import { applyTerms, loadTerms } from './lib/terms.mjs';

const TEMPLATE = path.join(ROOT, 'product.html');

/* The pages that carry a graph of their own, and which key holds it. */
const GRAPHS = {
  home: 'seo.jsonld.home',
  products: 'seo.jsonld.products',
  news: 'seo.jsonld.news',
};

/* The pages that carry nothing but a breadcrumb and a line about
   themselves. */
const PLAIN = {
  about: { type: 'WebPage', crumb: 'footer.link.about' },
  contact: { type: 'ContactPage', crumb: 'footer.link.contact' },
  terms: { type: 'WebPage', crumb: 'footer.link.terms' },
};

/** The file a page is written to. */
function fileFor(lang, pagePath) {
  if (lang === 'zh') return pagePath || 'index.html';
  return `${lang}/${pagePath || 'index.html'}`;
}

/**
 * The structured data for one page in one language.
 *
 * Null means "leave the block that is already there alone" — which
 * is what the Chinese pages do, because gen-jsonld.mjs wrote theirs.
 */
function graphFor(lang, kind, siteUrl, pagePath, title, description) {
  const key = GRAPHS[kind];
  if (key) {
    const raw = i18n[lang][key];
    if (!raw) throw new Error(`data.js has no ${lang}["${key}"]`);
    return localiseGraph(JSON.parse(raw), siteUrl, lang);
  }
  if (PLAIN[kind]) {
    return plainGraph({
      siteUrl,
      lang,
      path: pagePath,
      title,
      description,
      type: PLAIN[kind].type,
      crumb: t(lang, PLAIN[kind].crumb),
    });
  }
  return null;
}

/** Keep the line endings the file already had. */
function withEol(raw, text) {
  return raw.includes('\r\n') ? text.replace(/\n/g, '\r\n') : text;
}

async function main() {
  const site = await loadSite();
  if (!site.url) throw new Error('[gen-lang-pages] assets/data/site.json has no "url"');

  const terms = await loadTerms();
  const template = (await readFile(TEMPLATE, 'utf8')).replace(/\r\n/g, '\n');
  let written = 0;

  for (const page of PAGES) {
    const kind = page.kind;
    const isProduct = kind === 'product';
    const product = isProduct ? products.find((p) => productUrl(p.id) === page.path) : null;

    /* The Chinese page this one is made from. */
    let source = template;
    let raw = template;
    if (!isProduct) {
      const file = path.join(ROOT, page.path || 'index.html');
      raw = await readFile(file, 'utf8');
      source = raw.replace(/\r\n/g, '\n');
    }

    for (const lang of LANGS) {
      const isZh = lang === 'zh';
      /* The Chinese product pages belong to gen-product-pages.mjs. */
      if (isZh && isProduct) continue;

      /* A product page's own title and description are built from
         the product itself — "T-ZERO Ultra Thin — …", not "Product
         Details". The other pages take theirs from the word list. */
      const title = isZh || isProduct ? null : i18n[lang][`seo.og.title.${kind}`];
      const description = isZh || isProduct ? null : i18n[lang][`seo.og.desc.${kind}`];

      let html = source;
      if (isProduct) {
        html = buildProductPage(source, product, products, {
          siteUrl: site.url,
          lang,
          file: page.path,
          productUrl,
          note: 'node scripts/gen-lang-pages.mjs',
        }).html;
      }

      html = translatePage(html, {
        siteUrl: site.url,
        lang,
        path: page.path,
        title,
        description,
        jsonLd: isZh ? null : graphFor(lang, kind, site.url, page.path, title, description),
        faq: kind === 'home' ? faqBlock(faqs, lang, 'scripts/gen-lang-pages.mjs') : null,
        strip: !isZh,
        dropKeywords: !isZh && !isProduct,
      });

      /* The legal page is a long piece of writing rather than a
         set of labels, so it comes from its own file — once for
         each language. */
      if (kind === 'terms') html = applyTerms(html, lang, terms);

      const out = fileFor(lang, page.path);
      const full = path.join(ROOT, out);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, withEol(raw, html), 'utf8');
      written++;
      console.log(`[gen-lang-pages] wrote ${out}`);
    }
  }

  console.log(`[gen-lang-pages] ${written} page(s) written.`);
}

main().catch((err) => {
  console.error(`\n[gen-lang-pages] ${err.stack || err.message}\n`);
  process.exit(1);
});
