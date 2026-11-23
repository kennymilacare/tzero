/* ===========================================================
   scripts/lib/newspages.mjs — the news pages, and how many there are.

   The site used to show the newest few posts and stop. Everything
   older sat in the feed file, where no visitor could reach it and
   no crawler could read it. The news is now split over as many
   addresses as it needs — news.html, news-2.html, news-3.html —
   and each one shows its own handful of posts.

   How many pages there are depends on how many posts the feed
   holds, so this file reads the feed. That is the one thing here
   that touches the disk: everything else is worked out from it.

   The words the pages need are here too, in the three languages.
   They are not in assets/js/data.js because these pages are drawn
   by the generator, not swapped in the browser — the same way the
   buying guides carry their own words.

   Pure apart from reading the feed file.
   =========================================================== */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { i18n } from '../../assets/js/data.js';
import { sortByDate } from './feed.mjs';
import { ROOT } from './site.mjs';

const FEED_FILE = path.join(ROOT, 'assets', 'data', 'news.json');
const LOCAL_FILE = path.join(ROOT, 'assets', 'data', 'news.local.json');

/* How many posts a page shows. */
export const POSTS_PER_PAGE = 5;

/* The posts a page shows are the ones from a social network. The
   hand-written brand cards — the launch announcement, the shop
   card — are page furniture, and they ride along on the first
   page however long the feed gets. */
const SOCIAL_SOURCES = ['facebook', 'instagram'];

/** Whether a post is one of the social posts, or a hand-written card. */
export function isCurated(post) {
  return !SOCIAL_SOURCES.includes(String(post?.source || '').toLowerCase());
}

/**
 * The posts the feed holds, newest first.
 *
 * news.json is what the pages read, so it is the source of truth.
 * When it is empty — before the first sync — the hand-written cards
 * are used instead, so that the pages are never empty.
 */
export function feedPosts() {
  for (const file of [FEED_FILE, LOCAL_FILE]) {
    try {
      const raw = JSON.parse(readFileSync(file, 'utf8'));
      const posts = Array.isArray(raw.posts) ? raw.posts : [];
      if (posts.length) return sortByDate([...posts]);
    } catch (e) {
      /* No file, or no posts in it — try the next one. */
    }
  }
  return [];
}

/** How many pages the posts need. */
export function newsPageCount(posts = feedPosts()) {
  const social = posts.filter((p) => !isCurated(p)).length;
  return Math.max(1, Math.ceil(social / POSTS_PER_PAGE));
}

/**
 * The addresses of the news pages.
 *
 * The first one is news.html — the address the site has always had.
 * The rest are news-2.html, news-3.html and so on.
 */
export function newsPagePaths(posts = feedPosts()) {
  const total = newsPageCount(posts);
  return Array.from({ length: total }, (_, i) => (i === 0 ? 'news.html' : `news-${i + 1}.html`));
}

/** Which page an address is — news.html is the first, news-2.html the second. */
export function newsPageNumber(pagePath) {
  const m = String(pagePath || '').match(/^news(?:-(\d+))?\.html$/);
  if (!m) return 1;
  return m[1] ? Number(m[1]) : 1;
}

/**
 * The posts one page shows.
 *
 * The social posts are split into pages of five; the hand-written
 * cards ride along on the first page.
 */
export function postsForPage(posts, pageNumber) {
  const social = posts.filter((p) => !isCurated(p));
  const curated = posts.filter(isCurated);
  const start = (pageNumber - 1) * POSTS_PER_PAGE;
  const slice = social.slice(start, start + POSTS_PER_PAGE);
  if (!slice.length) return curated;
  return pageNumber === 1 ? [...slice, ...curated] : slice;
}

/* ---------- the words ---------- */

/* What the pager says, in the three languages. */
const PAGER = {
  zh: { prev: '上一頁', next: '下一頁', page: '第 {n} 頁，共 {total} 頁', label: '最新動態分頁' },
  en: { prev: 'Previous', next: 'Next', page: 'Page {n} of {total}', label: 'News pages' },
  ja: { prev: '前へ', next: '次へ', page: '全{total}ページ中{n}ページ目', label: '最新ニュースのページ' },
};

/** The pager's words in one language, with the numbers filled in. */
export function pagerWords(lang, page, total) {
  const w = PAGER[lang] || PAGER.zh;
  return {
    prev: w.prev,
    next: w.next,
    page: w.page.replace('{n}', String(page)).replace('{total}', String(total)),
    label: w.label,
  };
}

/**
 * What is added to the title and the description of a page after
 * the first — so that no two of them say exactly the same thing.
 */
export function pageSuffix(lang, page, total) {
  if (page <= 1) return '';
  const w = PAGER[lang] || PAGER.zh;
  const text = w.page.replace('{n}', String(page)).replace('{total}', String(total));
  if (lang === 'en') return ` (${text})`;
  return `（${text}）`;
}

/**
 * The pager under the list: a link to the page before, the numbers,
 * and a link to the page after.
 *
 * The links are real addresses, so a crawler can follow them and a
 * visitor can share one. They are written into the page, not drawn
 * by a script, for the same reason.
 */
export function pagerMarkup(lang, page, total, paths) {
  const w = pagerWords(lang, page, total);
  const parts = [];

  if (page > 1) {
    parts.push(
      `    <a class="news-pager__link news-pager__link--prev" href="${paths[page - 2]}" rel="prev">${w.prev}</a>`,
    );
  } else {
    parts.push('    <span class="news-pager__link news-pager__link--prev is-disabled" aria-hidden="true">&nbsp;</span>');
  }

  const numbers = paths
    .map((p, i) => {
      const n = i + 1;
      if (n === page) {
        return `      <span class="news-pager__number is-current" aria-current="page">${n}</span>`;
      }
      return `      <a class="news-pager__number" href="${p}">${n}</a>`;
    })
    .join('\n');
  parts.push(numbers);

  if (page < total) {
    parts.push(
      `    <a class="news-pager__link news-pager__link--next" href="${paths[page]}" rel="next">${w.next}</a>`,
    );
  } else {
    parts.push('    <span class="news-pager__link news-pager__link--next is-disabled" aria-hidden="true">&nbsp;</span>');
  }

  return [
    `  <nav class="news-pager" aria-label="${w.label}">`,
    `    <p class="news-pager__count">${w.page}</p>`,
    '    <div class="news-pager__numbers">',
    parts.join('\n'),
    '    </div>',
    '  </nav>',
  ].join('\n');
}

/**
 * The headline of a post in one language, falling back to the Chinese
 * source — the same rule the pages use.
 */
export function titleOf(post, lang) {
  const localised = post?.[`title_${lang}`];
  if (localised != null && localised !== '') return localised;
  return post?.title || '';
}

/**
 * The structured data of one news page: the breadcrumb and the list
 * of the posts that page shows.
 *
 * The shape comes from the block in assets/js/data.js, so that the
 * three languages agree with each other; the list is then narrowed
 * to the posts this page shows. The structured data has to describe
 * what a visitor can see — a list of every post in the feed would
 * describe a page that is not there.
 */
export function newsGraphFor({ siteUrl, lang, pagePath, posts }) {
  const base = JSON.parse(i18n[lang]?.['seo.jsonld.news'] || '{"@graph":[]}');
  const graph = base['@graph'] || [];

  const crumbs = graph.find((n) => n['@type'] === 'BreadcrumbList');
  if (crumbs && Array.isArray(crumbs.itemListElement) && crumbs.itemListElement.length) {
    const last = crumbs.itemListElement[crumbs.itemListElement.length - 1];
    last.item = `${siteUrl}${pagePath}`;
  }

  const list = graph.find((n) => n['@type'] === 'ItemList');
  if (list) {
    list.itemListElement = posts.map((post, i) => {
      const item = { '@type': 'ListItem', position: i + 1 };
      if (post.datePublished) item.datePublished = post.datePublished;
      item.url = post.permalink || siteUrl;
      item.name = titleOf(post, lang);
      return item;
    });
    list.numberOfItems = posts.length;
    list.itemListOrder = 'https://schema.org/ItemListOrderDescending';
  }

  return base;
}
