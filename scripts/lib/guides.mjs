/* ===========================================================
   scripts/lib/guides.mjs — the buying guides, in one place.

   Six evergreen pages:

       guide-size.html         what size am I?
       guide-material.html     latex, polyurethane or polyisoprene?
       guide-texture.html      plain, ribbed, studded, wrinkled?
       guide-thickness.html    0.01 mm, 0.03 mm, 0.04 mm — what differs?
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
import thickness from './guides/thickness.mjs';

import { escapeAttr, escapeText } from './html.mjs';

/** The guides, in the order they are listed on the pages. */
export const GUIDES = [size, material, texture, thickness, firstTime, hyaluronic];

/** The page each guide is written to. */
export const GUIDE_PATHS = GUIDES.map((g) => g.path);

/**
 * The page that lists every guide.
 *
 * The guides used to be reachable only from the four product pages.
 * Every other page of the site — the home page, the catalogue, the
 * news, the about page — linked to none of them, and a crawler had
 * no reason to find them. This page is where the guides are all
 * listed together, and it is in the menu and the footer of every
 * page, so the whole cluster hangs together.
 */
export const GUIDE_HUB = { path: 'guides.html', published: '2026-11-02' };

/** The guide written to a given page. */
export function guideByPath(path) {
  return GUIDES.find((g) => g.path === path) || null;
}

/* ---------- the sharing picture of a guide ---------- */

/**
 * Where the sharing picture of a page lives, inside the site.
 *
 * Every page of the site used to point at one picture — the brand
 * mark — so a guide shared on WhatsApp looked the same as the home
 * page shared on WhatsApp: a logo and nothing else. Now each guide
 * has a picture of its own, in the language of the page it belongs
 * to, with the guide's own heading on it.
 *
 * The pictures are written by scripts/gen-guide-og-images.mjs and
 * kept in the repository, so the site can be published without a
 * browser to draw them.
 */
export function guideOgImagePath(pagePath, lang) {
  const slug = String(pagePath).replace(/\.html$/, '');
  return `assets/images/og/${slug}-${lang}.png`;
}

/** The same picture, as the address a crawler fetches. */
export function guideOgImageUrl(siteUrl, pagePath, lang) {
  return `${siteUrl}${guideOgImagePath(pagePath, lang)}`;
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

  /* The page that lists every guide. */
  hubEyebrow: { zh: '選購指南', en: 'Buying guides', ja: '購入ガイド' },
  hubTitle: {
    zh: '【安全套選購指南】買安全套前必看, 解決你的所有避孕疑惑',
    en: 'Condom buying guide: what to read before you buy',
    ja: '【コンドーム購入ガイド】購入前に知っておきたい疑問をすべて解説',
  },
  hubH1: {
    zh: '買安全套之前,先看這六篇',
    en: 'Six things to read before you buy a condom',
    ja: 'コンドームを買う前に読んでおきたい6つのガイド',
  },
  hubLead: {
    zh: '尺碼、材質、紋路、厚度、第一次買,以及潤滑到底有沒有用 — 最常被問到的六個問題,一次講清楚。',
    en: 'Size, material, texture, thickness, buying one for the first time, and what the lubricant is actually doing — the six questions people ask most, answered properly.',
    ja: 'サイズ、素材、テクスチャ、厚さ、はじめての一本、そして潤滑剤が実際に何をしているのか。よく聞かれる六つの疑問に、ひとつずつ答えました。',
  },
  hubDescription: {
    zh: '從安全套尺寸闊度量度、乳膠與PU材質比較、超薄厚度選擇到玻尿酸潤滑液的防乾功效，香港 T-ZERO 團隊為您一次解答常見疑問。',
    en: 'From measuring the width of a condom to comparing latex with PU, choosing how thin to go, and what the hyaluronic lubricant does about dryness — the Hong Kong T-ZERO team answers the questions people ask most, in one place.',
    ja: 'サイズを測る方法からラテックスとPUの素材の違い、極薄の選び方、ヒアルロテン酸の潤滑効果まで。香港のT-ZEROチームがよくある質問を一気に解説します。',
  },
  hubCount: { zh: '篇指南', en: 'guides', ja: '本のガイド' },
};

/**
 * The guides, as a list of links in the footer of every page.
 *
 * The titles come from the guide files themselves, so the link a
 * visitor reads in the footer is the same words as the heading on
 * the page it points at — and there is only ever one copy of it.
 */
export function footerGuidesHtml(lang) {
  const items = GUIDES.map((g) =>
    `            <li><a href="${escapeAttr(g.path)}">${escapeText(g.short[lang] || g.short.zh)}</a></li>`,
  ).join('\n');

  return `            <li><a href="${escapeAttr(GUIDE_HUB.path)}">${escapeText(GUIDE_UI.all[lang])}</a></li>
${items}`;
}
