#!/usr/bin/env node
/* ===========================================================
   gen-guide-pages.mjs — the buying guides, one page per language.

   The five guides answer the questions people ask before they
   buy a condom for the first time: what size am I, what is it
   made of, what do the textures mean, how do I buy one, and
   what is hyaluronic acid actually doing in there.

   Each guide is written once, in three languages, at three
   addresses:

       /guide-size.html        /en/guide-size.html     /ja/guide-size.html

   The words come from scripts/lib/guides/, which is build-time
   only — the browser never sees it, and the page it writes is
   complete before a single script runs. That is the point: a
   crawler does not run JavaScript, so what is in the file is all
   there is.

   This also writes the page that lists them all — /guides.html —
   which is in the menu and the footer of every page of the site,
   so that the guides are not reachable only from the product
   pages.

   Run: node scripts/gen-guide-pages.mjs
   =========================================================== */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { i18n } from '../assets/js/data.js';
import { guideBody, guideJsonLd, hubBody, hubJsonLd } from './lib/guide-page.mjs';
import { GUIDES, GUIDE_HUB, GUIDE_UI, guideOgImageUrl } from './lib/guides.mjs';
import { escapeText } from './lib/html.mjs';
import { translatePage } from './lib/langpage.mjs';
import { LANGS } from './lib/langs.mjs';
import { changedOn } from './lib/sitemap.mjs';
import { loadSite, ROOT } from './lib/site.mjs';

const TEMPLATE = path.join(ROOT, 'product.html');
const INDEX = path.join(ROOT, 'assets/js/guides.js');

/**
 * The day a page's words were last changed.
 *
 * Git knows it — it is the day the file was last committed — and
 * asking it means there is no date to forget to write down when a
 * guide is rewritten. The date on the page and the date in the
 * sitemap then come from the same place and cannot disagree.
 */
async function modifiedOn(files, fallback) {
  const dates = [];
  for (const file of files) {
    const date = await changedOn(file);
    if (date) dates.push(date);
  }
  if (!dates.length) return fallback;
  return dates.sort().pop();
}

/** The file a page is written to. */
function fileFor(lang, pagePath) {
  if (lang === 'zh') return pagePath;
  return `${lang}/${pagePath}`;
}

/** Keep the line endings the file already had. */
function withEol(raw, text) {
  return raw.includes('\r\n') ? text.replace(/\n/g, '\r\n') : text;
}

/** Replace a tag, found by what it is rather than by the words inside it. */
function fillTag(html, pattern, replacement, label) {
  const re = new RegExp(pattern, 'i');
  const m = re.exec(html);
  if (!m) {
    throw new Error(
      `[gen-guide-pages] the template no longer contains the ${label}.\n` +
      `  looking for: ${pattern}\n` +
      '  product.html has changed — update this script to match.'
    );
  }
  return html.slice(0, m.index) + replacement + html.slice(m.index + m[0].length);
}

/**
 * The page a guide — or the list of them — is built from.
 *
 * product.html is the template — it has the header and the footer,
 * and a guide needs both. What belongs to a product and not to a
 * guide is taken out: the product script, the product's own copy
 * in the head, the note that says the old catch-all page stays out
 * of the search results, and the carousel.
 *
 * The carousel goes because it is a megabyte of pictures of the
 * shop. A guide is a page to read, and on a page to read the
 * pictures push the words down the screen and slow the first
 * paint — the guide pages were the slowest pages on the site for
 * no reason at all.
 */
function pageShell(template, bodyHtml) {
  let html = template;

  /* The product page's own script — there is no product on a
     guide page, and the script would fall back to the first
     product in the catalogue. */
  html = html.replace(/\s*<script type="module" src="assets\/js\/product\.js[^"]*"><\/script>/, '');

  /* No page of the site is the products list while you are
     reading a guide. */
  html = html.replace(/ class="nav__link is-active"/g, ' class="nav__link"');

  /* The template says "do not index me", because it is the old
     catch-all product page. A guide is a real page, and it is
     welcome in the search results. */
  html = html.replace(
    /  <!-- The old catch-all product page[\s\S]*?-->\n\s*<meta name="robots" content="noindex,follow">/,
    '  <meta name="robots" content="index,follow">',
  );

  /* The carousel — four pictures, over a megabyte, of the shop.
     Not on a page that is about reading. */
  html = html.replace(
    /  <!-- ========== TOP BANNER \(CAROUSEL\) ========== -->\n  <div class="top-banner top-banner--carousel"[\s\S]*?\n  <\/div>\n/,
    '',
  );

  /* And the script that drives it — there is no carousel left on
     the page for it to drive, so there is nothing to download. */
  html = html.replace(/\s*<script src="assets\/js\/carousel\.js[^"]*"[^>]*><\/script>/, '');

  /* The body of the page. */
  html = html.replace(/  <main>[\s\S]*?  <\/main>/, bodyHtml);

  return html;
}

/** The head of one page: its own words, in one language. */
function pageHead(html, { title, description, keywords }) {
  html = fillTag(html, '<title>[^<]*</title>', `<title>${escapeText(title)}</title>`, 'the title');
  html = fillTag(html, '<meta\\s+name="description"[^>]*>',
    `<meta name="description" content="${escapeText(description)}">`, 'the meta description');
  html = fillTag(html, '<meta\\s+name="keywords"[^>]*>',
    `<meta name="keywords" content="${escapeText(keywords)}">`, 'the keywords');

  html = fillTag(html, '<meta\\s+property="og:title"[^>]*>',
    `<meta property="og:title" content="${escapeText(title)}">`, 'the og:title');
  html = fillTag(html, '<meta\\s+property="og:description"[^>]*>',
    `<meta property="og:description" content="${escapeText(description)}">`, 'the og:description');
  html = fillTag(html, '<meta\\s+name="twitter:title"[^>]*>',
    `<meta name="twitter:title" content="${escapeText(title)}">`, 'the twitter:title');
  html = fillTag(html, '<meta\\s+name="twitter:description"[^>]*>',
    `<meta name="twitter:description" content="${escapeText(description)}">`, 'the twitter:description');

  return html;
}

/**
 * The list the browser searches.
 *
 * The search box on every page offers the guides as well as the
 * products and the ordinary pages. The words come from the same
 * files the pages are written from, so the list cannot go out of
 * date on its own — and there is only ever one copy of a guide's
 * title, kept in one place.
 */
function searchIndex() {
  const entries = GUIDES.map((g) => `  {
    slug: ${JSON.stringify(g.slug)},
    url: ${JSON.stringify(g.path)},
    image: ${JSON.stringify(g.image)},
    title: {
      zh: ${JSON.stringify(g.short.zh)},
      en: ${JSON.stringify(g.short.en)},
      ja: ${JSON.stringify(g.short.ja)},
    },
    desc: {
      zh: ${JSON.stringify(g.blurb.zh)},
      en: ${JSON.stringify(g.blurb.en)},
      ja: ${JSON.stringify(g.blurb.ja)},
    },
  }`).join(',\n');

  return `/* ===========================================================
   guides.js — the buying guides, for the search box.

   GENERATED FILE — do not edit by hand.
   Run: node scripts/gen-guide-pages.mjs
   Source: scripts/lib/guides/*.mjs

   Each guide, with the address it lives at and the words that
   describe it. Every page carries the same file, so a guide can
   be found from any language.
   =========================================================== */

export const guides = [
${entries}
];
`;
}

/** Write one page, in one language, and say so. */
async function write(pagePath, lang, html, raw, note) {
  html = html.replace('<!DOCTYPE html>',
    `<!DOCTYPE html>\n<!-- GENERATED FILE — do not edit by hand.\n     Run: node scripts/gen-guide-pages.mjs\n     Source: ${note} -->`);

  const out = fileFor(lang, pagePath);
  const full = path.join(ROOT, out);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, withEol(raw, html), 'utf8');
  console.log(`[gen-guide-pages] wrote ${out}`);
}

async function main() {
  const site = await loadSite();
  if (!site.url) throw new Error('[gen-guide-pages] assets/data/site.json has no "url"');

  const raw = (await readFile(TEMPLATE, 'utf8')).replace(/\r\n/g, '\n');
  const template = raw.replace(/\r\n/g, '\n');
  let written = 0;

  /* --- the five guides --- */
  for (const guide of GUIDES) {
    const source = `scripts/lib/guides/${guide.slug}.mjs`;
    const modified = await modifiedOn([source], guide.published);

    for (const lang of LANGS) {
      const isZh = lang === 'zh';

      let html = pageShell(template, guideBody(guide, lang, modified));
      html = pageHead(html, {
        title: guide.title[lang] || guide.title.zh,
        description: guide.description[lang] || guide.description.zh,
        keywords: guide.title[lang] || guide.title.zh,
      });

      /* The structured data goes in just before </head>. */
      html = html.replace('</head>',
        `  <script type="application/ld+json" data-guide-jsonld>\n${JSON.stringify(guideJsonLd(guide, lang, site.url, modified), null, 2).replace(/<\//g, '<\\/')}\n  </script>\n</head>`);

      html = translatePage(html, {
        siteUrl: site.url,
        lang,
        path: guide.path,
        title: guide.title[lang] || guide.title.zh,
        description: guide.description[lang] || guide.description.zh,
        jsonLd: guideJsonLd(guide, lang, site.url, modified),
        faq: null,
        strip: !isZh,
        dropKeywords: false,
        /* The guide's own picture, so that a guide shared in a chat
           shows its own heading and not the brand's logo. */
        ogImage: guideOgImageUrl(site.url, guide.path, lang),
        ogImageAlt: `${i18n[lang]['seo.brand.name']} — ${guide.h1[lang] || guide.h1.zh}`,
      });

      await write(guide.path, lang, html, raw, source);
      written++;
    }
  }

  /* --- the page that lists them all --- */
  const hubModified = await modifiedOn(
    [...GUIDES.map((g) => `scripts/lib/guides/${g.slug}.mjs`), 'scripts/lib/guides.mjs'],
    GUIDE_HUB.published,
  );

  for (const lang of LANGS) {
    const isZh = lang === 'zh';

    let html = pageShell(template, hubBody(lang));
    html = pageHead(html, {
      title: GUIDE_UI.hubTitle[lang],
      description: GUIDE_UI.hubDescription[lang],
      keywords: GUIDE_UI.hubTitle[lang],
    });

    /* The menu says which page you are on. */
    html = html.replace('<a href="guides.html" class="nav__link"',
      '<a href="guides.html" class="nav__link is-active"');

    html = html.replace('</head>',
      `  <script type="application/ld+json" data-guide-jsonld>\n${JSON.stringify(hubJsonLd(lang, site.url, hubModified), null, 2).replace(/<\//g, '<\\/')}\n  </script>\n</head>`);

    html = translatePage(html, {
      siteUrl: site.url,
      lang,
      path: GUIDE_HUB.path,
      title: GUIDE_UI.hubTitle[lang],
      description: GUIDE_UI.hubDescription[lang],
      jsonLd: hubJsonLd(lang, site.url, hubModified),
      faq: null,
      strip: !isZh,
      dropKeywords: false,
      ogImage: guideOgImageUrl(site.url, GUIDE_HUB.path, lang),
      ogImageAlt: `${i18n[lang]['seo.brand.name']} — ${GUIDE_UI.hubH1[lang]}`,
    });

    await write(GUIDE_HUB.path, lang, html, raw, 'scripts/lib/guides.mjs');
    written++;
  }

  console.log(`[gen-guide-pages] ${written} page(s) written.`);

  await writeFile(INDEX, searchIndex(), 'utf8');
  console.log('[gen-guide-pages] wrote assets/js/guides.js');
}

main().catch((err) => {
  console.error(`\n[gen-guide-pages] ${err.stack || err.message}\n`);
  process.exit(1);
});
