/* ===========================================================
   product.js — product detail page.

   Each product has its own file now (product-ultra-thin.html and
   friends), and the file says which product it is:

       <body data-product-id="tzero-ultra-thin">

   The old product.html?id=… still works — it is what old links
   point at — but it now points its canonical at the product's own
   page, so a crawler ends up on the right one.
   =========================================================== */

import { products, productUrl } from './data.js?v=24';
import { productCardHTML, productMediaHTML } from './product-svg.js?v=7';
import { initI18n, getLang, t, pickByLang } from './i18n.js?v=6';

function readId() {
  const fromBody = document.body && document.body.dataset.productId;
  if (fromBody) return fromBody;
  return new URLSearchParams(window.location.search).get('id') || products[0].id;
}

/* Is this the old catch-all page rather than a product's own file? */
function isLegacyPage() {
  return !document.body.dataset.productId;
}

/* The address the site is published at — read from the page's own
   canonical link, so a preview build points at the real address
   rather than at wherever it happens to be served from. */
function siteBase() {
  const canonical = document.querySelector('link[rel="canonical"]');
  const href = canonical ? canonical.getAttribute('href') || '' : '';
  const m = href.match(/^(https?:\/\/[^\/]+)\//);
  return m ? `${m[1]}/` : `${window.location.origin}/`;
}

/* The address of the product's own page. */
function pageUrlOf(product) {
  return `${siteBase()}${productUrl(product.id)}`;
}

/** The title a search result should show for this product. */
function titleOf(product) {
  return `${pickByLang(product, 'name')} — ${pickByLang(product, 'subtitle')} | T-ZERO 第九感`;
}

/** The description a search result should show for this product. */
function descriptionOf(product) {
  return `${pickByLang(product, 'description')} ${pickByLang(product, 'subtitle')}。`
    + `每盒 ${product.pieces} 片,HK$${product.price_hkd},即日送貨,全黑啞面保密包裝。`;
}

/**
 * Keep the head in step with the product and the language.
 *
 * The generated pages already carry the right values for the
 * default language; this keeps them right when the visitor
 * switches language, and it points the old product.html?id=… at
 * the product's own page.
 */
function updateHead(product) {
  const title = titleOf(product);
  const description = descriptionOf(product);

  document.title = title;

  const set = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', value);
  };
  set('meta[name="description"]', description);
  set('meta[property="og:title"]', title);
  set('meta[property="og:description"]', description);
  set('meta[name="twitter:title"]', title);
  set('meta[name="twitter:description"]', description);

  /* The old page says "this is product.html"; the truth is that it
     is one product, and it has a page of its own. The generated
     pages already point at themselves, so they are left alone. */
  const url = pageUrlOf(product);
  if (isLegacyPage()) {
    set('meta[property="og:url"]', url);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', url);
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => {
      el.setAttribute('href', url);
    });
  }

  /* The structured data follows the language too. */
  const script = document.querySelector('script[type="application/ld+json"][data-product-jsonld]');
  if (!script) return;
  try {
    const data = JSON.parse(script.textContent);
    const graph = data['@graph'] || [];
    const node = graph.find((n) => n['@type'] === 'Product');
    if (node) {
      node.name = pickByLang(product, 'name');
      node.alternateName = product.name_en || product.name_zh;
      node.description = pickByLang(product, 'description');
    }
    const crumbs = graph.find((n) => n['@type'] === 'BreadcrumbList');
    if (crumbs && crumbs.itemListElement && crumbs.itemListElement[2]) {
      crumbs.itemListElement[2].name = pickByLang(product, 'name');
      crumbs.itemListElement[2].item = url;
    }
    script.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    /* A malformed block should not take the page down. */
  }
}

function spec(labelKey, value) {
  return `
    <div class="row">
      <dt>${t(labelKey)}</dt>
      <dd>${value}</dd>
    </div>
  `;
}

function renderRelated(product) {
  const wrap = document.querySelector('[data-related]');
  if (!wrap) return;
  const related = products
    .filter((p) => p.id !== product.id && p.brand === product.brand)
    .slice(0, 4);
  const filler = related.length < 4
    ? products.filter((p) => p.id !== product.id && !related.includes(p)).slice(0, 4 - related.length)
    : [];
  wrap.innerHTML = [...related, ...filler].map(productCardHTML).join('');
}

function starsHTML(rating) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  let html = '';
  for (let i = 0; i < 5; i++) {
    const fill = i < full ? 'is-on' : '';
    html += `<svg class="review-card__star ${fill}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.95 6.27 6.85.78-5.13 4.74 1.45 6.78L12 17.7l-6.12 3.37 1.45-6.78L2.2 9.55l6.85-.78L12 2.5z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  }
  return html;
}

function initialOf(name) {
  return (name || '').trim().charAt(0).toUpperCase() || '?';
}

function reviewCardHTML(review) {
  const name = pickByLang(review, 'name');
  const location = pickByLang(review, 'location');
  const date = pickByLang(review, 'date');
  const body = pickByLang(review, 'body');
  return `
    <article class="review-card">
      <div class="review-card__stars" role="img" aria-label="${review.rating} / 5">${starsHTML(review.rating)}</div>
      <p class="review-card__body">${body}</p>
      <div class="review-card__foot">
        <div class="review-card__avatar" aria-hidden="true">${initialOf(name)}</div>
        <div class="review-card__meta">
          <div class="review-card__name">${name}</div>
          <div class="review-card__sub">${location} · ${date}</div>
        </div>
        ${review.verified ? `<span class="review-card__verified"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12 10 17 19 7"/></svg><span>${t('product.reviews.verified')}</span></span>` : ''}
      </div>
    </article>
  `;
}

function renderReviews(product) {
  const wrap = document.querySelector('[data-reviews]');
  if (!wrap) return;
  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  if (reviews.length === 0) {
    wrap.innerHTML = `<p class="reviews-empty">${t('product.reviews.empty')}</p>`;
    return;
  }
  wrap.innerHTML = reviews.map(reviewCardHTML).join('');
}

function render() {
  const id = readId();
  const product = products.find((p) => p.id === id) || products[0];

  const img = document.querySelector('[data-image]');
  if (img) img.innerHTML = productMediaHTML(product, true);

  const titleEl = document.querySelector('[data-title]');
  if (titleEl) titleEl.textContent = pickByLang(product, 'name');

  const subEl = document.querySelector('[data-subtitle]');
  if (subEl) subEl.textContent = pickByLang(product, 'subtitle');

  const descEl = document.querySelector('[data-desc]');
  if (descEl) descEl.textContent = pickByLang(product, 'description');

  const brandEl = document.querySelector('[data-brand]');
  if (brandEl) brandEl.textContent = product.brand.toUpperCase();

  const priceEl = document.querySelector('[data-price]');
  if (priceEl) priceEl.innerHTML = `
    <span class="currency">HK$</span>${product.price_hkd}
  `;

  const buyEl = document.querySelector('[data-buy]');
  if (buyEl) buyEl.setAttribute('href', product.hktv_url);

  const specsEl = document.querySelector('[data-specs]');
  if (specsEl) {
    specsEl.innerHTML = `
      <dl>
        ${spec('product.card.material', product.material)}
        ${product.thickness_mm ? spec('product.card.thickness', `${product.thickness_mm} mm`) : ''}
        ${spec('product.card.pieces', `${product.pieces} ${t('product.card.pieces')}`)}
        <div class="row">
          <dt>${t('product.detail.brand')}</dt>
          <dd>${product.brand}</dd>
        </div>
        <div class="row">
          <dt>${t('product.detail.series')}</dt>
          <dd>${product.series}</dd>
        </div>
      </dl>
    `;
  }

  // Document title & meta
  updateHead(product);

  renderRelated(product);
  renderReviews(product);
}

function init() {
  initI18n();

  /* The old product.html with nothing in the query string has no
     product to show. Send the visitor to the catalogue instead of
     pretending the first product is the page. */
  if (isLegacyPage() && !new URLSearchParams(window.location.search).get('id')) {
    window.location.replace('products.html');
    return;
  }

  render();
  document.addEventListener('lang:change', render);
}

document.addEventListener('DOMContentLoaded', init);