/* ===========================================================
   scripts/lib/guides.mjs — the buying guides, in one place.

   Five evergreen pages:

       guide-size.html         what size am I?
       guide-material.html     latex, polyurethane or polyisoprene?
       guide-texture.html      plain, ribbed, studded, wrinkled?
       guide-first-time.html   buying one for the first time
       guide-hyaluronic.html   what hyaluronic acid actually does

   Each guide is a page in three languages, and every word of it
   is written out here — so a crawler reads it without running
   anything, and the three versions of a guide cannot drift
   apart.

   Pure data — no filesystem, no network.
   =========================================================== */

import firstTime from './guides/first-time.mjs';
import hyaluronic from './guides/hyaluronic.mjs';
import material from './guides/material.mjs';
import size from './guides/size.mjs';
import texture from './guides/texture.mjs';

/** The guides, in the order they are listed on the pages. */
export const GUIDES = [size, material, texture, firstTime, hyaluronic];

/** The page each guide is written to. */
export const GUIDE_PATHS = GUIDES.map((g) => g.path);

/** The guide written to a given page. */
export function guideByPath(path) {
  return GUIDES.find((g) => g.path === path) || null;
}

/**
 * The words the guide pages share.
 *
 * They live here rather than in assets/js/data.js because they are
 * only ever needed when a page is written — the browser never has
 * to swap them, because each language has a page of its own.
 */
export const GUIDE_UI = {
  home: { zh: '首頁', en: 'Home', ja: 'ホーム' },
  guides: { zh: '選購指南', en: 'Buying guides', ja: '購入ガイド' },
  toc: { zh: '本文目錄', en: 'On this page', ja: '目次' },
  faq: { zh: '常見問題', en: 'Frequently asked questions', ja: 'よくある質問' },
  related: { zh: '相關閱讀', en: 'Related reading', ja: '関連ページ' },
  all: { zh: '全部選購指南', en: 'All buying guides', ja: 'すべての購入ガイド' },
  updated: { zh: '最後更新', en: 'Last updated', ja: '最終更新' },
};
