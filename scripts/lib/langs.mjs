/* ===========================================================
   scripts/lib/langs.mjs — the address of every language.

   The site used to have three languages behind one address, with
   the words swapped in by JavaScript. A crawler reads the words
   that are in the file and nothing else, so it only ever saw the
   Chinese one — and the English and Japanese pages could never
   be found.

   Now every language has an address of its own:

       /            /products.html        Chinese
       /en/         /en/products.html     English
       /ja/         /ja/products.html     Japanese

   Chinese stays where it is, so no old link dies. This file is
   the one place that knows the rule; the generators, the sitemap
   writer and the tests all read it from here.

   Pure — no filesystem, no network.
   =========================================================== */

import { products, productUrl } from '../../assets/js/data.js';

/* The three languages, in the order they cycle. */
export const LANGS = ['zh', 'en', 'ja'];

/* The tag that goes on <html lang>. */
export const HTML_LANG = { zh: 'zh-HK', en: 'en', ja: 'ja-JP' };

/* The folder each language lives in, relative to the site root. */
export const LANG_DIR = { zh: '', en: 'en/', ja: 'ja/' };

/* The language the toggle points at. */
export const NEXT_LANG = { zh: 'en', en: 'ja', ja: 'zh' };

/* The short name shown on the toggle. */
export const NEXT_LABEL = { zh: 'EN', en: 'JA', ja: '中' };

/* What the toggle says to a screen reader. */
export const TOGGLE_ARIA = {
  zh: '切換至 English',
  en: 'Switch to 日本語',
  ja: '日本語から繁體中文へ切替',
};

/**
 * Every page that has a version in every language.
 *
 * `path` is the page's own path inside the site root — '' for the
 * home page, so that it is the root itself and not /index.html.
 */
export const PAGES = [
  { path: '', kind: 'home' },
  { path: 'products.html', kind: 'products' },
  ...products.map((p) => ({ path: productUrl(p.id), kind: 'product' })),
  { path: 'news.html', kind: 'news' },
  { path: 'about.html', kind: 'about' },
  { path: 'contact.html', kind: 'contact' },
  { path: 'terms.html', kind: 'terms' },
];

/** The address of one page in one language. */
export function pageUrl(siteUrl, lang, path) {
  const base = String(siteUrl || '').replace(/\/+$/, '');
  return `${base}/${LANG_DIR[lang]}${path}`;
}

/** The file on disk that holds one page in one language. */
export function pageFile(lang, path) {
  return `${LANG_DIR[lang]}${path || 'index.html'}`;
}

/**
 * The path from one page to another, relative — so the link works
 * at any depth and wherever the site is published.
 */
export function relativePath(fromLang, toLang, path) {
  const file = path || 'index.html';
  const up = LANG_DIR[fromLang] ? '../' : '';
  return `${up}${LANG_DIR[toLang]}${file}`;
}

/**
 * The four entries that say "this page is also in these other
 * languages". The same four for every language of the page — that
 * is what makes the group agree with itself.
 */
export function alternates(siteUrl, path) {
  return [
    { hreflang: HTML_LANG.zh, href: pageUrl(siteUrl, 'zh', path) },
    { hreflang: HTML_LANG.en, href: pageUrl(siteUrl, 'en', path) },
    { hreflang: HTML_LANG.ja, href: pageUrl(siteUrl, 'ja', path) },
    { hreflang: 'x-default', href: pageUrl(siteUrl, 'zh', path) },
  ];
}

/** The canonical link and the four alternates, as markup. */
export function linkBlock(siteUrl, lang, path, indent = '  ') {
  const lines = [`${indent}<link rel="canonical" href="${pageUrl(siteUrl, lang, path)}">`];
  for (const alt of alternates(siteUrl, path)) {
    lines.push(`${indent}<link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}">`);
  }
  return lines.join('\n');
}

/** The addresses of this page in the three languages, as JSON. */
export function langUrlsJson(siteUrl, path) {
  const out = {};
  for (const lang of LANGS) out[lang] = pageUrl(siteUrl, lang, path);
  return JSON.stringify(out);
}
