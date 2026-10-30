/* ===========================================================
   product-svg.js — generate consistent SVG mockups for products
   (no copyrighted brand imagery)
   =========================================================== */

import { brands, productUrl } from './data.js?v=25';
import { getLang as realGetLang, pickByLang, t } from './i18n.js?v=7';
import { assetUrl } from './paths.js?v=2';

const W = 200;
const H = 280;

/* Map brand id → accent colour for the package band. */
function brandColor(brandId) {
  const b = brands.find((x) => x.id === brandId);
  return b ? b.color : '#86ABCA';
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;',
  })[c]);
}

/**
 * Build a "product pack" SVG.
 * @param {object} product
 * @param {string} lang  'zh' | 'en'
 * @param {boolean} large — larger size (used on detail page)
 */
export function productSVG(product, lang = 'zh', large = false) {
  const w = large ? 320 : W;
  const h = large ? 440 : H;
  const accent = product.color || brandColor(product.brand);
  const name = pickByLang(product, 'name');
  const sub  = pickByLang(product, 'subtitle');

  // scale text proportionally
  const fName = large ? 22 : 14;
  const fSub  = large ? 13 : 10;
  const fBig  = large ? 44 : 28;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"
     width="${w}" height="${h}" role="img"
     aria-label="${escapeXml(name)}">
  <defs>
    <linearGradient id="bg-${product.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- soft background -->
  <rect x="0" y="0" width="${w}" height="${h}" fill="url(#bg-${product.id})"/>

  <!-- package -->
  <g transform="translate(${w * 0.18}, ${h * 0.08})">
    <!-- back shadow -->
    <rect x="6" y="6" width="${w * 0.64}" height="${h * 0.84}"
          rx="14" fill="${accent}" opacity="0.18"/>
    <!-- main pack -->
    <rect x="0" y="0" width="${w * 0.64}" height="${h * 0.84}"
          rx="14" fill="#FFFFFF" stroke="${accent}" stroke-width="2"/>
    <!-- top accent band -->
    <rect x="0" y="0" width="${w * 0.64}" height="${h * 0.08}"
          rx="14" fill="${accent}"/>
    <rect x="0" y="${h * 0.04}" width="${w * 0.64}" height="${h * 0.04}" fill="${accent}"/>
    <!-- thickness callout -->
    ${product.thickness_mm ? `<text x="${w * 0.32}" y="${h * 0.26}"
          text-anchor="middle"
          font-family="Inter, sans-serif" font-weight="800"
          font-size="${fBig}" fill="${accent}">
      ${product.thickness_mm}
    </text>
    <text x="${w * 0.32}" y="${h * 0.30}"
          text-anchor="middle"
          font-family="Inter, sans-serif" font-weight="600"
          font-size="${fSub * 0.85}" fill="${accent}">
      mm
    </text>` : ''}
    <!-- product name -->
    <text x="${w * 0.32}" y="${h * 0.50}"
          text-anchor="middle"
          font-family="Inter, sans-serif" font-weight="700"
          font-size="${fName}" fill="#2B1F18">
      ${escapeXml(truncate(name, large ? 18 : 12))}
    </text>
    <text x="${w * 0.32}" y="${h * 0.56}"
          text-anchor="middle"
          font-family="Inter, sans-serif" font-weight="400"
          font-size="${fSub}" fill="#6E5944">
      ${escapeXml(truncate(sub, large ? 24 : 16))}
    </text>
    <!-- pieces -->
    <text x="${w * 0.32}" y="${h * 0.74}"
          text-anchor="middle"
          font-family="Inter, sans-serif" font-weight="700"
          font-size="${fSub * 1.4}" fill="#2B1F18">
      ${product.pieces} ${t('product.card.pieces')}
    </text>
  </g>

  <!-- material dot -->
  <circle cx="${w * 0.84}" cy="${h * 0.92}" r="6" fill="${accent}"/>
</svg>`.trim();
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

/* ---------- Card renderer (used by index, products, product detail) ---------- */

function getLangSafe() { try { return realGetLang(); } catch { return 'zh'; } }

/**
 * Render the product image (real photo) if the product has one,
 * otherwise fall back to the inline SVG mockup.
 * @param {object} product
 * @param {boolean} large — true on detail page; false on cards
 */
export function productMediaHTML(product, large = false) {
  const lang = getLangSafe();
  if (product.image) {
    const altKey = `image_alt_${lang}`;
    const alt = product[altKey] || product.image_alt_zh || pickByLang(product, 'name');
    return `<img class="product-image" src="${assetUrl(product.image)}" alt="${escapeXml(alt)}" loading="lazy" decoding="async">`;
  }
  return productSVG(product, lang, large);
}

export function productCardHTML(product) {
  const lang = getLangSafe();
  return `
    <a class="card-product" href="${productUrl(product.id)}">
      <div class="card-product__media">
        <div class="card-product__badges">
          ${product.popular ? `<span class="badge badge--accent" data-i18n="product.card.popular">熱賣</span>` : ''}
        </div>
        ${productMediaHTML(product, false)}
      </div>
      <div class="card-product__brand">${product.brand.toUpperCase()}</div>
      <h3 class="card-product__name">${pickByLang(product, 'name')}</h3>
      <p class="card-product__sub">${pickByLang(product, 'subtitle')}</p>
      <div class="card-product__specs">
        <span class="card-product__spec">
          <span data-i18n="product.card.material">物料</span>:
          <strong>${product.material}</strong>
        </span>
        ${product.thickness_mm ? `<span class="card-product__spec">
          <span data-i18n="product.card.thickness">厚度</span>:
          <strong>${product.thickness_mm} mm</strong>
        </span>` : ''}
      </div>
      <div class="card-product__bottom">
        <span class="card-product__price">
          <span class="currency" data-i18n="product.card.from">HK$</span>${product.price_hkd}
        </span>
        <span class="btn btn--primary btn--sm"
              data-hktv="${product.hktv_url}"
              onclick="event.preventDefault();event.stopPropagation();window.open('${product.hktv_url}','_blank','noopener')">
          <span data-i18n="product.card.buy">前往 HKTVmall</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 17L17 7M7 7h10v10"/>
          </svg>
        </span>
      </div>
    </a>
  `;
}