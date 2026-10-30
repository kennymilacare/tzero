/* ===========================================================
   gen-product-pages.mjs — one real page per product.

   Why this exists
   ---------------
   The site used to serve every product from product.html?id=… .
   All four URLs then carried the same canonical link, so a
   crawler had no way to tell that they were four different
   products — it would pick one and drop the rest.

   Now each product has its own file:

       product-extra-lub.html
       product-extended.html
       product-studded.html
       product-ultra-thin.html

   Each file carries its own title, description, canonical,
   Open Graph tags and Product structured data — written into
   the HTML, not swapped in by JavaScript — so the page is
   complete before a single script runs.

   product.html stays as the template AND as the fallback for
   old links (product.html?id=…). The generator reads it, fills
   in the per-product bits and writes the four files.

   Run:  node scripts/gen-product-pages.mjs
   =========================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { products, productUrl } from '../assets/js/data.js';
import { loadSite, ROOT } from './lib/site.mjs';

const TEMPLATE = path.join(ROOT, 'product.html');

/* ---------- small helpers ---------- */

const escapeHtml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

/** Replace a snippet — and shout if the template ever stops matching. */
function fill(text, needle, replacement, label) {
  if (!text.includes(needle)) {
    throw new Error(
      `[gen-product-pages] the template no longer contains the ${label}.\n` +
      `  looking for: ${JSON.stringify(needle.slice(0, 120))}\n` +
      '  product.html has changed — update this script to match.'
    );
  }
  return text.split(needle).join(replacement);
}

/* ---------- per-product copy ---------- */

/** A title that leads with the product, then what makes it special. */
function titleOf(p) {
  return `${p.name_zh} — ${p.subtitle_zh} | T-ZERO 第九感`;
}

/** A description that says what the product is and how to get it. */
function descriptionOf(p) {
  const bits = [p.description_zh];
  if (p.subtitle_zh) bits.push(`${p.subtitle_zh}。`);
  bits.push(`每盒 ${p.pieces} 片,HK$${p.price_hkd},即日送貨,全黑啞面保密包裝。`);
  return bits.join('');
}

function keywordsOf(p) {
  return [
    'T-ZERO', '第九感', p.name_zh, p.series,
    '玻尿酸安全套', '安全套', 'condom', 'hyaluronic',
    '香港', '即日送貨', '保密包裝',
    p.thickness_mm ? '超薄' : '',
    p.type === 'textured' ? '顆粒' : '',
    p.type === 'functional' ? '潤滑' : '',
  ].filter(Boolean).join(', ');
}

/* ---------- the pieces of the page ---------- */

/** The specification list, in the same shape product.js builds. */
function specsHtml(p) {
  const row = (label, value) => `
            <div class="row">
              <dt>${escapeHtml(label)}</dt>
              <dd>${escapeHtml(value)}</dd>
            </div>`;
  return `<dl>${row('物料', p.material)}${p.thickness_mm ? row('厚度', `${p.thickness_mm} mm`) : ''}${row('片裝', `${p.pieces} 片裝`)}${row('品牌', p.brand)}${row('系列', p.series)}
          </dl>`;
}

const STAR = `<svg class="review-card__star is-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.95 6.27 6.85.78-5.13 4.74 1.45 6.78L12 17.7l-6.12 3.37 1.45-6.78L2.2 9.55l6.85-.78L12 2.5z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const STAR_OFF = STAR.replace(' is-on', '');

/** One review, in the same shape product.js builds. */
function reviewHtml(r) {
  const full = Math.max(0, Math.min(5, Math.round(r.rating)));
  const stars = Array.from({ length: 5 }, (_, i) => (i < full ? STAR : STAR_OFF)).join('');
  const initial = (r.name_zh || '').trim().charAt(0).toUpperCase() || '?';
  return `
            <article class="review-card">
              <div class="review-card__stars" role="img" aria-label="${r.rating} / 5">${stars}</div>
              <p class="review-card__body">${escapeHtml(r.body_zh)}</p>
              <div class="review-card__foot">
                <div class="review-card__avatar" aria-hidden="true">${escapeHtml(initial)}</div>
                <div class="review-card__meta">
                  <div class="review-card__name">${escapeHtml(r.name_zh)}</div>
                  <div class="review-card__sub">${escapeHtml(r.location_zh)} · ${escapeHtml(r.date_zh)}</div>
                </div>
                ${r.verified ? `<span class="review-card__verified"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12 10 17 19 7"/></svg><span>已認證購買</span></span>` : ''}
              </div>
            </article>`;
}

/** The other three products, as links a crawler can follow. */
function relatedHtml(p, all) {
  const related = all.filter((x) => x.id !== p.id && x.brand === p.brand).slice(0, 4);
  const filler = related.length < 4
    ? all.filter((x) => x.id !== p.id && !related.includes(x)).slice(0, 4 - related.length)
    : [];
  return [...related, ...filler].map((x) => `
            <a class="card-product" href="${productUrl(x.id)}">
              <div class="card-product__media">
                <div class="card-product__badges">
                  ${x.popular ? `<span class="badge badge--accent" data-i18n="product.card.popular">熱賣</span>` : ''}
                </div>
                <img class="product-image" src="${x.image}" alt="${escapeHtml(x.image_alt_zh || x.name_zh)}" loading="lazy" decoding="async">
              </div>
              <div class="card-product__brand">${escapeHtml(x.brand.toUpperCase())}</div>
              <h3 class="card-product__name">${escapeHtml(x.name_zh)}</h3>
              <p class="card-product__sub">${escapeHtml(x.subtitle_zh)}</p>
              <div class="card-product__bottom">
                <span class="card-product__price">
                  <span class="currency" data-i18n="product.card.from">HK$</span>${x.price_hkd}
                </span>
              </div>
            </a>`).join('');
}

/* ---------- structured data ---------- */

function productJsonLd(p, siteUrl, pageUrl) {
  const reviews = Array.isArray(p.reviews) ? p.reviews : [];
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
    : null;

  const product = {
    '@type': 'Product',
    '@id': `${pageUrl}#product`,
    name: p.name_zh,
    alternateName: p.name_en,
    description: p.description_zh,
    image: [`${siteUrl}${p.image.replace(/^\//, '')}`],
    sku: p.id,
    url: pageUrl,
    brand: { '@type': 'Brand', name: 'T-ZERO 第九感' },
    offers: {
      '@type': 'Offer',
      url: p.hktv_url,
      priceCurrency: 'HKD',
      price: String(p.price_hkd),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'T-ZERO 第九感' },
    },
  };

  if (average !== null) {
    product.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: average.toFixed(1),
      reviewCount: String(reviews.length),
      bestRating: '5',
      worstRating: '1',
    };
    product.review = reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name_zh },
      datePublished: r.date_zh,
      reviewBody: r.body_zh,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: String(r.rating),
        bestRating: '5',
        worstRating: '1',
      },
    }));
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首頁', item: `${siteUrl}` },
          { '@type': 'ListItem', position: 2, name: '全部產品', item: `${siteUrl}products.html` },
          { '@type': 'ListItem', position: 3, name: p.name_zh, item: pageUrl },
        ],
      },
      product,
    ],
  };
}

/* ---------- build one page ---------- */

function buildPage(template, p, all, siteUrl) {
  const file = productUrl(p.id);
  const pageUrl = `${siteUrl}${file}`;
  const title = titleOf(p);
  const description = descriptionOf(p);
  const keywords = keywordsOf(p);
  const reviews = Array.isArray(p.reviews) ? p.reviews : [];

  let html = template;

  /* --- the head --- */
  html = fill(html,
    '<title>產品詳情 · T-ZERO 第九感</title>',
    `<title>${escapeHtml(title)}</title>`, 'the title');

  html = fill(html,
    '<meta name="description" content="查看 T-ZERO 第九感玻尿酸安全套產品詳情:規格、成分、使用方法、顧客評價。日本工藝製造,即日送貨,保密包裝。">',
    `<meta name="description" content="${escapeHtml(description)}">`, 'the meta description');

  html = fill(html,
    '<meta name="keywords" content="T-ZERO, 第九感, 安全套, 玻尿酸安全套, 產品詳情, condom, hyaluronic, 香港, 潤滑, 超薄, 持久, 顆粒">',
    `<meta name="keywords" content="${escapeHtml(keywords)}">`, 'the keywords');

  html = fill(html,
    `<link rel="canonical" href="${siteUrl}product.html">
  <link rel="alternate" hreflang="zh-HK" href="${siteUrl}product.html">
  <link rel="alternate" hreflang="en" href="${siteUrl}product.html">
  <link rel="alternate" hreflang="ja-JP" href="${siteUrl}product.html">
  <link rel="alternate" hreflang="x-default" href="${siteUrl}product.html">`,
    `<link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="zh-HK" href="${pageUrl}">
  <link rel="alternate" hreflang="en" href="${pageUrl}">
  <link rel="alternate" hreflang="ja-JP" href="${pageUrl}">
  <link rel="alternate" hreflang="x-default" href="${pageUrl}">`,
    'the canonical and hreflang block');

  html = fill(html,
    '<meta property="og:title" content="產品詳情 · T-ZERO 第九感" data-i18n-attr="content" data-i18n="seo.og.title.product">',
    `<meta property="og:title" content="${escapeHtml(title)}">`, 'the og:title');

  html = fill(html,
    '<meta property="og:description" content="查看 T-ZERO 第九感玻尿酸安全套產品詳情:規格、成分、使用方法、顧客評價。日本工藝,即日送貨。" data-i18n-attr="content" data-i18n="seo.og.desc.product">',
    `<meta property="og:description" content="${escapeHtml(description)}">`, 'the og:description');

  html = fill(html,
    `<meta property="og:url" content="${siteUrl}product.html">`,
    `<meta property="og:url" content="${pageUrl}">`, 'the og:url');

  html = fill(html,
    '<meta name="twitter:title" content="產品詳情 · T-ZERO 第九感" data-i18n-attr="content" data-i18n="seo.og.title.product">',
    `<meta name="twitter:title" content="${escapeHtml(title)}">`, 'the twitter:title');

  html = fill(html,
    '<meta name="twitter:description" content="查看 T-ZERO 第九感玻尿酸安全套產品詳情:規格、成分、使用方法、顧客評價。日本工藝,即日送貨。" data-i18n-attr="content" data-i18n="seo.og.desc.product">',
    `<meta name="twitter:description" content="${escapeHtml(description)}">`, 'the twitter:description');

  /* The structured data goes in just before </head>. */
  html = fill(html, '</head>',
    `  <script type="application/ld+json" data-product-jsonld>\n${JSON.stringify(productJsonLd(p, siteUrl, pageUrl), null, 2)}\n  </script>\n</head>`,
    'the </head> marker');

  /* --- the body --- */
  html = fill(html, '<body>', `<body data-product-id="${escapeHtml(p.id)}">`, 'the <body> tag');

  html = fill(html,
    '<div class="product-detail__image" data-image></div>',
    `<div class="product-detail__image" data-image><img class="product-image" src="${p.image}" alt="${escapeHtml(p.image_alt_zh || p.name_zh)}" width="600" height="600" fetchpriority="high" decoding="async"></div>`,
    'the product image');

  html = fill(html,
    '<div class="card-product__brand" data-brand></div>',
    `<div class="card-product__brand" data-brand>${escapeHtml(p.brand.toUpperCase())}</div>`, 'the brand');

  html = fill(html,
    '<h1 data-title>產品詳情</h1>',
    `<h1 data-title>${escapeHtml(p.name_zh)}</h1>`, 'the product title');

  html = fill(html,
    '<p class="product-detail__sub" data-subtitle></p>',
    `<p class="product-detail__sub" data-subtitle>${escapeHtml(p.subtitle_zh)}</p>`, 'the product subtitle');

  html = fill(html,
    '<div class="product-detail__price" data-price></div>',
    `<div class="product-detail__price" data-price><span class="currency">HK$</span>${p.price_hkd}</div>`,
    'the price');

  html = fill(html,
    `<a href="#" target="_blank" rel="noopener"`,
    `<a href="${escapeHtml(p.hktv_url)}" target="_blank" rel="noopener"`, 'the buy link');

  html = fill(html,
    '<div class="product-detail__specs" data-specs></div>',
    `<div class="product-detail__specs" data-specs>${specsHtml(p)}</div>`, 'the specification list');

  html = fill(html,
    '<p data-desc></p>',
    `<p data-desc>${escapeHtml(p.description_zh)}</p>`, 'the product description');

  html = fill(html,
    '<div class="reviews-grid" data-reviews></div>',
    `<div class="reviews-grid" data-reviews>${reviews.map(reviewHtml).join('')}
        </div>`, 'the reviews');

  html = fill(html,
    '<div class="product-grid" data-related></div>',
    `<div class="product-grid" data-related>${relatedHtml(p, all)}
        </div>`, 'the related products');

  /* A note at the top of the file, so nobody hand-edits a generated page. */
  html = fill(html, '<!DOCTYPE html>',
    `<!DOCTYPE html>
<!-- GENERATED FILE — do not edit by hand.
     Run: node scripts/gen-product-pages.mjs
     Source: product.html + assets/js/data.js -->`, 'the doctype');

  return { file, html };
}

/* ---------- main ---------- */

async function main() {
  const site = await loadSite();
  if (!site.url) throw new Error('[gen-product-pages] assets/data/site.json has no "url"');
  /* The files in this repo are a mix of CRLF and LF — match on LF. */
  const template = (await readFile(TEMPLATE, 'utf8')).replace(/\r\n/g, '\n');

  for (const p of products) {
    const { file, html } = buildPage(template, p, products, site.url);
    await writeFile(path.join(ROOT, file), html, 'utf8');
    console.log(`[gen-product-pages] wrote ${file}`);
  }
  console.log(`[gen-product-pages] ${products.length} product page(s) written.`);
}

main().catch((err) => {
  console.error(`\n[gen-product-pages] ${err.message}\n`);
  process.exit(1);
});
