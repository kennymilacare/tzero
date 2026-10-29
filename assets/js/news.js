/* ===========================================================
   news.js — render the Facebook feed into [data-news-list].

   Reads assets/data/news.json, which scripts/sync-facebook.mjs
   writes (see docs/facebook-sync.md). If the file is missing or
   the fetch fails, the hand-written cards already in the HTML
   stay in place — this only ever upgrades the page.

   Every string coming out of the JSON is written with textContent,
   never innerHTML, because Facebook post text is not authored here.
   =========================================================== */

import { getLang, t } from './i18n.js?v=5';

const DATA_URL = 'assets/data/news.json';
const MAX_POSTS = 8;
const FALLBACK_PAGE_URL = 'https://www.facebook.com/Tzerohk';

/**
 * Pick a localised field on a post.
 *
 * Posts use a different model from products: the base field IS the
 * Chinese source (whatever was posted on Facebook), and _en / _ja are
 * optional hand-written overrides. So we look for the current
 * language, then fall back to the base field — never to _en, which
 * would show English to a Chinese visitor.
 */
function pickNews(obj, field) {
  const lang = getLang();
  const localised = obj[`${field}_${lang}`];
  if (localised != null && localised !== '') return localised;
  const base = obj[field];
  return base != null ? base : '';
}

/* Static markup — safe to inject, contains no user data. */
const FB_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>' +
  '</svg>';

const IG_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.059 1.689.073 4.948.073 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>' +
  '</svg>';

/* Which network a post came from, and how to say so. Anything that is not
   Instagram (Facebook, HKTVmall, a hand-written post) uses the Facebook
   wording, which is the site's default. */
function sourceSuffix(post) {
  return post.source === 'Instagram' ? '.instagram' : '';
}

function sourceIcon(post) {
  if (post.source === 'Instagram') return IG_ICON;
  if (post.source === 'HKTVmall' || post.source === 'Watsons') return '';
  return FB_ICON;
}

const state = {
  posts: [],
  pageUrl: FALLBACK_PAGE_URL,
  loaded: false,
};

/* The networks a post can come from. Curated brand cards (HKTVmall,
   Watsons) are not social posts — a page that filters by network
   still shows those. */
const SOCIAL_SOURCES = ['facebook', 'instagram'];

/* A curated card is written by hand (news.local.json) and is not part of
   the chronological feed — a launch announcement, a shop-where-to-find-us
   card. It is page furniture, not news. */
function isCurated(post) {
  return !SOCIAL_SOURCES.includes(String(post.source || '').toLowerCase());
}

/**
 * The posts a given list should show.
 *
 * The list container can narrow the feed with
 *   data-news-source="instagram"          — only Instagram
 *   data-news-source="facebook,instagram"— both
 * With no attribute, everything is shown.
 *
 * data-news-limit caps the feed. A list that also carries
 *   data-news-keep-curated
 * keeps its curated brand cards however busy the feed gets, so a
 * hand-written launch card is never pushed off the page by a week of
 * posts.
 */
function postsFor(list) {
  const limit = Number(list.getAttribute('data-news-limit')) || MAX_POSTS;
  const wanted = (list.getAttribute('data-news-source') || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const posts = wanted.length
    ? state.posts.filter((p) => {
        const src = String(p.source || '').toLowerCase();
        if (!SOCIAL_SOURCES.includes(src)) return true;
        return wanted.includes(src);
      })
    : state.posts;

  if (!list.hasAttribute('data-news-keep-curated')) {
    return posts.slice(0, limit);
  }

  /* The limit counts feed posts; curated cards ride along with them. */
  let feedLeft = limit;
  return posts.filter((p) => {
    if (isCurated(p)) return true;
    if (feedLeft > 0) {
      feedLeft -= 1;
      return true;
    }
    return false;
  });
}

/* ---------- render ---------- */

function buildCard(post) {
  const suffix = sourceSuffix(post);
  const title = pickNews(post, 'title') || t('home.news.latest.title' + suffix);
  const excerpt = pickNews(post, 'excerpt');
  const permalink = post.permalink || state.pageUrl;
  const cta = pickNews(post, 'cta') || t('home.news.cta' + suffix);
  const link = post.link || permalink;

  const article = document.createElement('article');
  article.className = 'news-card reveal';
  article.setAttribute('data-news-card', '');

  /* media */
  const media = document.createElement('a');
  media.className = 'news-card__media';
  media.href = permalink;
  media.target = '_blank';
  media.rel = 'noopener';
  media.setAttribute('aria-label', title);

  if (post.image) {
    const img = document.createElement('img');
    img.src = post.image;
    img.alt = title;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.appendChild(img);
  } else {
    // No photo — the media panel still needs to look deliberate.
    media.classList.add('news-card__media--empty');
  }

  const source = document.createElement('span');
  source.className = 'news-card__source';
  source.innerHTML = sourceIcon(post);
  const sourceLabel = document.createElement('span');
  sourceLabel.textContent = post.source || t('home.news.source');
  source.appendChild(sourceLabel);
  media.appendChild(source);

  article.appendChild(media);

  /* body */
  const body = document.createElement('div');
  body.className = 'news-card__body';

  if (post.datePublished) {
    const date = document.createElement('span');
    date.className = 'news-card__date';
    date.textContent = post.datePublished;
    body.appendChild(date);
  }

  const h3 = document.createElement('h3');
  h3.className = 'news-card__title';
  h3.textContent = title;
  body.appendChild(h3);

  if (excerpt) {
    const p = document.createElement('p');
    p.className = 'news-card__excerpt';
    p.textContent = excerpt;
    body.appendChild(p);
  }

  const actions = document.createElement('div');
  actions.className = 'news-card__actions';

  const primary = document.createElement('a');
  primary.className = 'btn btn--primary btn--sm';
  primary.href = link;
  primary.target = '_blank';
  primary.rel = 'noopener';
  primary.textContent = cta;
  actions.appendChild(primary);

  // Curated (non-Facebook) posts don't get a "follow the page" button.
  if (post.follow !== false) {
    const ghost = document.createElement('a');
    ghost.className = 'btn btn--ghost btn--sm';
    // An Instagram post links to the Instagram profile, not the Facebook page.
    ghost.href = post.followUrl || state.pageUrl;
    ghost.target = '_blank';
    ghost.rel = 'noopener';
    ghost.textContent = t('home.news.follow' + suffix);
    actions.appendChild(ghost);
  }

  body.appendChild(actions);
  article.appendChild(body);

  return article;
}

function render() {
  if (!state.loaded || !state.posts.length) return;

  const lists = document.querySelectorAll('[data-news-list]');
  if (!lists.length) return;

  lists.forEach((list) => {
    const posts = postsFor(list);
    if (!posts.length) return;

    // Replace the built-in cards in place — the container also holds
    // other content (a heading, a "view more" link) that must survive.
    const existing = list.querySelectorAll('[data-news-card]');
    if (!existing.length) return;

    const cards = posts.map(buildCard);
    existing[0].before(...cards);
    existing.forEach((el) => el.remove());

    // The reveal animation is driven by .reveal.is-visible. These cards
    // were created after initReveal() ran, so show them ourselves.
    requestAnimationFrame(() => {
      cards.forEach((c) => c.classList.add('is-visible'));
    });
  });

  updateJsonLd();
}

/* Build one NewsArticle node for a post. */
function newsArticle(post, position) {
  const entry = {
    '@type': 'NewsArticle',
    position,
    headline: pickNews(post, 'title'),
    url: post.permalink || state.pageUrl,
  };
  const published = post.datePublished;
  if (published) entry.datePublished = published;
  const description = pickNews(post, 'excerpt');
  if (description) entry.description = description;
  if (post.image) {
    try { entry.image = new URL(post.image, window.location.href).href; } catch (e) { /* leave it out */ }
  }
  return entry;
}

/**
 * Update the page's structured data with the live feed.
 *
 *   data-news-jsonld="list"   — news.html: replace the ItemList entries
 *   data-news-jsonld="latest" — index.html: publish the newest post as a
 *                                NewsArticle node in the graph
 */
function updateJsonLd() {
  const script = document.querySelector('script[type="application/ld+json"][data-news-jsonld]');
  if (!script || !state.posts.length) return;

  try {
    const data = JSON.parse(script.textContent);
    const graph = data['@graph'] || [];
    const mode = script.getAttribute('data-news-jsonld');

    if (mode === 'list') {
      const list = graph.find((n) => n['@type'] === 'ItemList');
      if (!list) return;
      // Use the same filter the page shows, so the structured data
      // matches what a visitor sees.
      const el = document.querySelector('[data-news-list]');
      const posts = el ? postsFor(el) : state.posts;
      list.itemListElement = posts.map((post, i) => newsArticle(post, i + 1));
    } else {
      const node = newsArticle(state.posts[0], 1);
      const at = graph.findIndex((n) => n['@type'] === 'NewsArticle');
      if (at >= 0) graph[at] = node;
      else graph.push(node);
    }

    script.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    // A malformed structured-data block shouldn't take the page down.
  }
}

/* ---------- load ---------- */

async function load() {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const posts = Array.isArray(data.posts) ? data.posts : [];
    if (!posts.length) throw new Error('no posts in feed file');

    state.pageUrl = (data.page && data.page.url) || FALLBACK_PAGE_URL;
    state.posts = posts.filter((p) => p && !p.hidden).slice(0, MAX_POSTS);
    state.loaded = true;
    render();
  } catch (e) {
    // Leave the hand-written cards in the HTML exactly as they are.
    console.info('[news] Facebook feed unavailable, keeping the built-in cards.', e.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  load();
  document.addEventListener('lang:change', render);
});
