/* ===========================================================
   scripts/lib/pages.mjs — every page, and the files it shows.

   A page is not only its own file. The news pages show the feed,
   the product pages show the catalogue. When the feed changes, the
   news pages have changed as well — and two things need to know
   that:

     · the sitemap, which dates each page by the newest thing
       that page shows;
     · IndexNow, which tells the search engines what changed.

   Both read this file, so they can never disagree about what a
   page depends on.

   Pure — no filesystem, no network.
   =========================================================== */

import { LANGS, PAGES, pageFile } from './langs.mjs';

/* How often a crawler should come back, and how important the page
   is — the same for all three languages of a page. */
export const CHANGEFREQ = {
  home: 'weekly',
  products: 'weekly',
  product: 'weekly',
  news: 'weekly',
  about: 'monthly',
  contact: 'monthly',
  terms: 'yearly',
};

export const PRIORITY = {
  home: '1.0',
  products: '0.9',
  product: '0.8',
  news: '0.7',
  about: '0.6',
  contact: '0.5',
  terms: '0.3',
};

/** What a page shows, on top of the page itself. */
export function extrasFor(kind) {
  const feed = ['assets/data/news.json', 'assets/data/news.local.json'];
  const catalogue = ['assets/js/data.js'];

  if (kind === 'home' || kind === 'news') return feed;
  if (kind === 'products' || kind === 'product') return catalogue;
  return [];
}

/**
 * Every page in every language, with the files it shows.
 *
 * `file` is the page itself. `files` is the page plus everything
 * it shows — which is what the date and the "what changed" answer
 * are worked out from.
 */
export function pageList() {
  const list = [];

  for (const page of PAGES) {
    const extra = extrasFor(page.kind);

    for (const lang of LANGS) {
      const file = pageFile(lang, page.path);
      list.push({
        lang,
        path: page.path,
        kind: page.kind,
        file,
        files: [file, ...extra],
        changefreq: CHANGEFREQ[page.kind] || 'weekly',
        priority: PRIORITY[page.kind] || '0.5',
      });
    }
  }

  return list;
}
