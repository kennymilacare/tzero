/* ===========================================================
   product.js — product detail page (reads ?id= from URL)
   =========================================================== */

import { products } from './data.js?v=22';
import { productCardHTML, productMediaHTML } from './product-svg.js?v=6';
import { initI18n, getLang, t, pickByLang } from './i18n.js?v=5';

function readId() {
  return new URLSearchParams(window.location.search).get('id') || products[0].id;
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
  document.title = `${pickByLang(product, 'name')} · T-ZERO 第九感`;

  renderRelated(product);
  renderReviews(product);
}

function init() {
  initI18n();
  render();
  document.addEventListener('lang:change', render);
}

document.addEventListener('DOMContentLoaded', init);