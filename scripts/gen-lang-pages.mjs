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

import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { faqs, i18n, products, productUrl } from '../assets/js/data.js';
import { buildProductPage, withCatalogue } from './lib/product-page.mjs';
import { localiseGraph, plainGraph, t, translatePage } from './lib/langpage.mjs';
import { withoutAttrs } from './lib/html.mjs';
import { faqBlock } from './lib/seo.mjs';
import { LANGS, PAGES } from './lib/langs.mjs';
import {
  feedPosts, newsGraphFor, newsPageNumber, newsPagePaths,
  pageSuffix, pagerMarkup, postsForPage,
} from './lib/newspages.mjs';
import { loadSite, ROOT, writeIfChanged } from './lib/site.mjs';
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

/**
 * What makes one news page its own page: which handful of posts it
 * shows, the links to the pages either side of it, and — so that no
 * two of them say exactly the same thing — which page of the news it
 * is.
 */
function newsPageHtml(html, { lang, page, total, paths }) {
  let out = html;

  /* Which page this is. The script that draws the cards reads it. */
  out = out.replace(/data-news-page="\d+"/, `data-news-page="${page}"`);

  /* The hand-written brand cards ride along on the first page, so
     the pages after it do not claim them. */
  if (page > 1) out = out.replace(/\s*data-news-keep-curated/, '');

  /* The links to the pages either side, and the numbers. */
  const pager = pagerMarkup(lang, page, total, paths);
  out = out.replace(
    /(<!--\s*NEWS PAGER:START\s*-->)([\s\S]*?)(<!--\s*NEWS PAGER:END\s*-->)/,
    (m, start, _middle, end) => `${start}\n${pager}\n${end}`,
  );

  /* Which page of the news this is — in the title, in the
     description, and in the heading the page shows. */
  const suffix = pageSuffix(lang, page, total);
  if (suffix) {
    out = out.replace(/<title>([\s\S]*?)<\/title>/, (m, text) => `<title>${text}${suffix}</title>`);
    out = out.replace(
      /(<meta name="description" content=")([^"]*)(")/,
      (m, open, text, close) => `${open}${text}${suffix}${close}`,
    );
    /* The heading's words are swapped in by the browser when the
       page loads, and that would wipe the suffix away. So the marker
       goes with it — the words are already in the file. */
    out = out.replace(
      /(<h1[^>]*>)([\s\S]*?)(<\/h1>)/,
      (m, open, text, close) => `${withoutAttrs(open, ['data-i18n'])}${text}${suffix}${close}`,
    );
  }

  return out;
}

async function main() {
  const site = await loadSite();
  if (!site.url) throw new Error('[gen-lang-pages] assets/data/site.json has no "url"');

  const terms = await loadTerms();
  const template = (await readFile(TEMPLATE, 'utf8')).replace(/\r\n/g, '\n');
  /* The posts the feed holds, and the pages they are split over. */
  const feed = feedPosts();
  const newsPaths = newsPagePaths(feed);
  let written = 0;

  for (const page of PAGES) {
    const kind = page.kind;
    /* The guides have a generator of their own — they are written
       from the guide files, not translated from a Chinese page.
       The list of them (guides.html) is written there too, so that
       the menu, the footer and the guide pages all agree about it. */
    if (kind === 'guide' || kind === 'guides') continue;
    const isProduct = kind === 'product';
    const isNews = kind === 'news';
    const product = isProduct ? products.find((p) => productUrl(p.id) === page.path) : null;

    /* The Chinese page this one is made from. */
    let source = template;
    let raw = template;
    if (!isProduct) {
      /* Every news page is made from news.html — the first page is
         the source, and the ones after it are the same page with
         another handful of posts on it. */
      const file = path.join(ROOT, isNews ? 'news.html' : (page.path || 'index.html'));
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

      /* Which page of the news this is, and the posts it shows. */
      const newsNumber = isNews ? newsPageNumber(page.path) : 0;
      const newsPosts = isNews ? postsForPage(feed, newsNumber) : [];

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

      /* The catalogue, written into the file. It used to be drawn
         by a script when the page loaded, so a crawler — which does
         not run scripts — saw a page with a heading and nothing on
         it: no product names, no prices, no links. The words are
         there now, before anything runs; the script still redraws
         the grid when the page loads, so the filters work. */
      if (kind === 'products') {
        html = withCatalogue(html, products, lang, productUrl);
      }

      html = translatePage(html, {
        siteUrl: site.url,
        lang,
        path: page.path,
        title,
        description,
        /* The news pages carry their own list of the posts they
           show — the whole feed would describe a page that is not
           there. Every language's block is written here, so that the
           three versions of a page agree. */
        jsonLd: isNews
          ? localiseGraph(
              newsGraphFor({ siteUrl: site.url, lang, pagePath: page.path, posts: newsPosts }),
              site.url,
              lang,
            )
          : (isZh ? null : graphFor(lang, kind, site.url, page.path, title, description)),
        faq: kind === 'home' ? faqBlock(faqs, lang, 'scripts/gen-lang-pages.mjs') : null,
        strip: !isZh,
        dropKeywords: !isZh && !isProduct,
      });

      if (isNews) {
        html = newsPageHtml(html, { lang, page: newsNumber, total: newsPaths.length, paths: newsPaths });
      }

      /* The legal page is a long piece of writing rather than a
         set of labels, so it comes from its own file — once for
         each language. */
      if (kind === 'terms') html = applyTerms(html, lang, terms);

      const out = fileFor(lang, page.path);
      const full = path.join(ROOT, out);
      await mkdir(path.dirname(full), { recursive: true });
      const changed = await writeIfChanged(full, withEol(raw, html));
      written++;
      console.log(`[gen-lang-pages] ${changed ? 'wrote' : 'unchanged'} ${out}`);
    }
  }

  console.log(`[gen-lang-pages] ${written} page(s) written.`);
}

main().catch((err) => {
  console.error(`\n[gen-lang-pages] ${err.stack || err.message}\n`);
  process.exit(1);
});
