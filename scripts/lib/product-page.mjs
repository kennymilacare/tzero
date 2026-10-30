/* ===========================================================
   scripts/lib/product-page.mjs — one product, one page, in any
   of the three languages.

   Every product has a page of its own:

       product-ultra-thin.html
       product-studded.html
       product-extended.html
       product-extra-lub.html

   The Chinese ones are written by scripts/gen-product-pages.mjs
   and the English and Japanese ones by
   scripts/gen-lang-pages.mjs — and both use the builders here, so
   the three versions of a product cannot drift apart.

   The words come from assets/js/product-copy.js, which the
   browser uses as well, so the title a visitor sees in the tab
   is the title a crawler reads.

   Pure — it takes the template in and gives the page back.
   =========================================================== */

import { i18n } from '../../assets/js/data.js';
import { productTitle, productDescription, productKeywords } from '../../assets/js/product-copy.js';
import { escapeText, replaceLinks } from './html.mjs';
import { linkBlock, pageUrl } from './langs.mjs';

/* ---------- small helpers ---------- */

/** The words for a key, in a language, with the same fallbacks the browser uses. */
function t(lang, key) {
  const cur = i18n[lang];
  if (cur && cur[key] != null) return cur[key];
  const zh = i18n.zh;
  if (zh && zh[key] != null) return zh[key];
  const en = i18n.en;
  if (en && en[key] != null) return en[key];
  return key;
}

/** A field of something in a language, falling back the same way. */
function field(obj, name, lang) {
  const v = obj[`${name}_${lang}`];
  if (v != null && v !== '') return v;
  const zh = obj[`${name}_zh`];
  if (zh != null && zh !== '') return zh;
  const en = obj[`${name}_en`];
  if (en != null && en !== '') return en;
  return '';
}

/** Replace a snippet — and shout if the template ever stops matching. */
export function fill(text, needle, replacement, label) {
  if (!text.includes(needle)) {
    throw new Error(
      `[product-page] the template no longer contains the ${label}.\n` +
      `  looking for: ${JSON.stringify(needle.slice(0, 120))}\n` +
      '  product.html has changed — update this script to match.'
    );
  }
  return text.split(needle).join(replacement);
}

/* ---------- the pieces of the page ---------- */

/** The specification list, in the same shape product.js builds. */
export function specsHtml(p, lang) {
  const row = (label, value) => `
            <div class="row">
              <dt>${escapeText(label)}</dt>
              <dd>${escapeText(value)}</dd>
            </div>`;
  const pieces = t(lang, 'product.card.pieces');
  return `<dl>${row(t(lang, 'product.card.material'), p.material)}${p.thickness_mm ? row(t(lang, 'product.card.thickness'), `${p.thickness_mm} mm`) : ''}${row(pieces, `${p.pieces} ${pieces}`)}${row(t(lang, 'product.detail.brand'), p.brand)}${row(t(lang, 'product.detail.series'), p.series)}
          </dl>`;
}

const STAR = `<svg class="review-card__star is-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.95 6.27 6.85.78-5.13 4.74 1.45 6.78L12 17.7l-6.12 3.37 1.45-6.78L2.2 9.55l6.85-.78L12 2.5z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const STAR_OFF = STAR.replace(' is-on', '');

/** One review, in the same shape product.js builds. */
export function reviewHtml(r, lang) {
  const full = Math.max(0, Math.min(5, Math.round(r.rating)));
  const stars = Array.from({ length: 5 }, (_, i) => (i < full ? STAR : STAR_OFF)).join('');
  const name = field(r, 'name', lang);
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return `
            <article class="review-card">
              <div class="review-card__stars" role="img" aria-label="${r.rating} / 5">${stars}</div>
              <p class="review-card__body">${escapeText(field(r, 'body', lang))}</p>
              <div class="review-card__foot">
                <div class="review-card__avatar" aria-hidden="true">${escapeText(initial)}</div>
                <div class="review-card__meta">
                  <div class="review-card__name">${escapeText(name)}</div>
                  <div class="review-card__sub">${escapeText(field(r, 'location', lang))} · ${escapeText(field(r, 'date', lang))}</div>
                </div>
                ${r.verified ? `<span class="review-card__verified"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12 10 17 19 7"/></svg><span>${escapeText(t(lang, 'product.reviews.verified'))}</span></span>` : ''}
              </div>
            </article>`;
}

/** The other products, as links a crawler can follow. */
export function relatedHtml(p, all, lang, productUrl) {
  const related = all.filter((x) => x.id !== p.id && x.brand === p.brand).slice(0, 4);
  const filler = related.length < 4
    ? all.filter((x) => x.id !== p.id && !related.includes(x)).slice(0, 4 - related.length)
    : [];
  return [...related, ...filler].map((x) => `
            <a class="card-product" href="${productUrl(x.id)}">
              <div class="card-product__media">
                <div class="card-product__badges">
                  ${x.popular ? `<span class="badge badge--accent">${escapeText(t(lang, 'product.card.popular'))}</span>` : ''}
                </div>
                <img class="product-image" src="${x.image}" alt="${escapeText(field(x, 'image_alt', lang) || field(x, 'name', lang))}" loading="lazy" decoding="async">
              </div>
              <div class="card-product__brand">${escapeText(x.brand.toUpperCase())}</div>
              <h3 class="card-product__name">${escapeText(field(x, 'name', lang))}</h3>
              <p class="card-product__sub">${escapeText(field(x, 'subtitle', lang))}</p>
              <div class="card-product__bottom">
                <span class="card-product__price">
                  <span class="currency">${escapeText(t(lang, 'product.card.from'))}</span>${x.price_hkd}
                </span>
              </div>
            </a>`).join('');
}

/* ---------- structured data ---------- */

export function productJsonLd(p, siteUrl, page, lang, productUrl) {
  const reviews = Array.isArray(p.reviews) ? p.reviews : [];
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
    : null;

  const brand = t(lang, 'seo.brand.name');
  /* The name in another language, so a search in either finds it. */
  const alternateName = lang === 'en' ? p.name_zh : p.name_en;

  const product = {
    '@type': 'Product',
    '@id': `${page}#product`,
    name: field(p, 'name', lang),
    alternateName,
    description: field(p, 'description', lang),
    image: [`${siteUrl}${p.image.replace(/^\//, '')}`],
    sku: p.id,
    url: page,
    brand: { '@type': 'Brand', name: brand },
    offers: {
      '@type': 'Offer',
      url: p.hktv_url,
      priceCurrency: 'HKD',
      price: String(p.price_hkd),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: brand },
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
      author: { '@type': 'Person', name: field(r, 'name', lang) },
      datePublished: field(r, 'date', lang),
      reviewBody: field(r, 'body', lang),
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
          { '@type': 'ListItem', position: 1, name: t(lang, 'nav.home'), item: pageUrl(siteUrl, lang, '') },
          { '@type': 'ListItem', position: 2, name: t(lang, 'breadcrumb.products'), item: pageUrl(siteUrl, lang, 'products.html') },
          { '@type': 'ListItem', position: 3, name: field(p, 'name', lang), item: page },
        ],
      },
      product,
    ],
  };
}

/* ---------- build one page ---------- */

/**
 * The page for one product in one language.
 *
 * `template` is product.html — the page with the per-product bits
 * still empty. Everything that belongs to this product and this
 * language is filled in here.
 */
export function buildProductPage(template, p, all, {
  siteUrl,
  lang = 'zh',
  file,
  productUrl,
  note = '',
}) {
  const path = file;
  const page = pageUrl(siteUrl, lang, path);
  const title = productTitle(p, lang);
  const description = productDescription(p, lang);
  const keywords = productKeywords(p, lang);
  const reviews = Array.isArray(p.reviews) ? p.reviews : [];

  let html = template;

  /* --- the head --- */
  html = fill(html,
    '<title>產品詳情 · T-ZERO 第九感</title>',
    `<title>${escapeText(title)}</title>`, 'the title');

  html = fill(html,
    '<meta name="description" content="查看 T-ZERO 第九感玻尿酸安全套產品詳情:規格、成分、使用方法、顧客評價。日本工藝製造,即日送貨,保密包裝。">',
    `<meta name="description" content="${escapeText(description)}">`, 'the meta description');

  html = fill(html,
    '<meta name="keywords" content="T-ZERO, 第九感, 安全套, 玻尿酸安全套, 產品詳情, condom, hyaluronic, 香港, 潤滑, 超薄, 持久, 顆粒">',
    `<meta name="keywords" content="${escapeText(keywords)}">`, 'the keywords');

  /* The page used to say "do not index me" — it is a real page
     with a product on it, so it is welcome in the search results.
     The note about the old catch-all page goes with it. */
  html = fill(html,
    `  <!-- The old catch-all product page. Every product has a page of its own
       now (product-ultra-thin.html and friends), and the generator writes
       those from this file. This page stays out of the index — it is only
       the fallback for old links (product.html?id=…). -->
  <meta name="robots" content="noindex,follow">`,
    '  <meta name="robots" content="index,follow">', 'the robots meta');

  html = replaceLinks(html, linkBlock(siteUrl, lang, path));

  html = fill(html,
    '<meta property="og:title" content="產品詳情 · T-ZERO 第九感" data-i18n-attr="content" data-i18n="seo.og.title.product">',
    `<meta property="og:title" content="${escapeText(title)}">`, 'the og:title');

  html = fill(html,
    '<meta property="og:description" content="查看 T-ZERO 第九感玻尿酸安全套產品詳情:規格、成分、使用方法、顧客評價。日本工藝,即日送貨。" data-i18n-attr="content" data-i18n="seo.og.desc.product">',
    `<meta property="og:description" content="${escapeText(description)}">`, 'the og:description');

  html = fill(html,
    `<meta property="og:url" content="${siteUrl}product.html">`,
    `<meta property="og:url" content="${page}">`, 'the og:url');

  html = fill(html,
    '<meta name="twitter:title" content="產品詳情 · T-ZERO 第九感" data-i18n-attr="content" data-i18n="seo.og.title.product">',
    `<meta name="twitter:title" content="${escapeText(title)}">`, 'the twitter:title');

  html = fill(html,
    '<meta name="twitter:description" content="查看 T-ZERO 第九感玻尿酸安全套產品詳情:規格、成分、使用方法、顧客評價。日本工藝,即日送貨。" data-i18n-attr="content" data-i18n="seo.og.desc.product">',
    `<meta name="twitter:description" content="${escapeText(description)}">`, 'the twitter:description');

  /* The structured data goes in just before </head>. */
  html = fill(html, '</head>',
    `  <script type="application/ld+json" data-product-jsonld>\n${JSON.stringify(productJsonLd(p, siteUrl, page, lang, productUrl), null, 2).replace(/<\//g, '<\\/')}\n  </script>\n</head>`,
    'the </head> marker');

  /* --- the body --- */
  html = fill(html, '<body>', `<body data-product-id="${escapeText(p.id)}">`, 'the <body> tag');

  html = fill(html,
    '<div class="product-detail__image" data-image></div>',
    `<div class="product-detail__image" data-image><img class="product-image" src="${p.image}" alt="${escapeText(field(p, 'image_alt', lang) || field(p, 'name', lang))}" width="600" height="600" fetchpriority="high" decoding="async"></div>`,
    'the product image');

  html = fill(html,
    '<div class="card-product__brand" data-brand></div>',
    `<div class="card-product__brand" data-brand>${escapeText(p.brand.toUpperCase())}</div>`, 'the brand');

  html = fill(html,
    '<h1 data-title>產品詳情</h1>',
    `<h1 data-title>${escapeText(field(p, 'name', lang))}</h1>`, 'the product title');

  html = fill(html,
    '<p class="product-detail__sub" data-subtitle></p>',
    `<p class="product-detail__sub" data-subtitle>${escapeText(field(p, 'subtitle', lang))}</p>`, 'the product subtitle');

  html = fill(html,
    '<div class="product-detail__price" data-price></div>',
    `<div class="product-detail__price" data-price><span class="currency">HK$</span>${p.price_hkd}</div>`,
    'the price');

  html = fill(html,
    `<a href="#" target="_blank" rel="noopener"`,
    `<a href="${escapeText(p.hktv_url)}" target="_blank" rel="noopener"`, 'the buy link');

  html = fill(html,
    '<div class="product-detail__specs" data-specs></div>',
    `<div class="product-detail__specs" data-specs>${specsHtml(p, lang)}</div>`, 'the specification list');

  html = fill(html,
    '<p data-desc></p>',
    `<p data-desc>${escapeText(field(p, 'description', lang))}</p>`, 'the product description');

  html = fill(html,
    '<div class="reviews-grid" data-reviews></div>',
    `<div class="reviews-grid" data-reviews>${reviews.map((r) => reviewHtml(r, lang)).join('')}
        </div>`, 'the reviews');

  html = fill(html,
    '<div class="product-grid" data-related></div>',
    `<div class="product-grid" data-related>${relatedHtml(p, all, lang, productUrl)}
        </div>`, 'the related products');

  /* A note at the top of the file, so nobody hand-edits a generated page. */
  html = fill(html, '<!DOCTYPE html>',
    `<!DOCTYPE html>
<!-- GENERATED FILE — do not edit by hand.
     Run: ${note}
     Source: product.html + assets/js/data.js -->`, 'the doctype');

  return { file: path, html };
}
