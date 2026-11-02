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
import { escapeAttr, escapeText, fillByAttr, replaceLinks } from './html.mjs';
import { GUIDES, GUIDE_UI } from './guides.mjs';
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

/**
 * Replace a tag, found by what it is rather than by the words inside it.
 *
 * The wording in product.html changes from time to time — "即日送貨"
 * became "24小時落單", for one — and a generator that has to be told
 * about every wording change is a generator that breaks the next time
 * somebody edits a page by hand. So the head tags are looked for by
 * their name, and replaced whole.
 */
export function fillTag(html, pattern, replacement, label) {
  const re = new RegExp(pattern, 'i');
  const m = re.exec(html);
  if (!m) {
    throw new Error(
      `[product-page] the template no longer contains the ${label}.\n` +
      `  looking for: ${pattern}\n` +
      '  product.html has changed — update this script to match.'
    );
  }
  return html.slice(0, m.index) + replacement + html.slice(m.index + m[0].length);
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

/**
 * The catalogue, as it is written into the file.
 *
 * The products page used to be empty until JavaScript ran: the grid
 * was drawn by a script, so a crawler — which does not run scripts —
 * saw a page with a heading and nothing else, and the four product
 * names, the four prices and the four links to the product pages
 * were all missing from it.
 *
 * This is the same grid, written out in the file, in the language of
 * the page. The script still redraws it when the page loads (so the
 * filters work), but the words are there before anything runs.
 */
export function catalogueHtml(all, lang, productUrl) {
  return all.map((p) => `
            <a class="card-product" href="${productUrl(p.id)}">
              <div class="card-product__media">
                <div class="card-product__badges">
                  ${p.popular ? `<span class="badge badge--accent">${escapeText(t(lang, 'product.card.popular'))}</span>` : ''}
                </div>
                <img class="product-image" src="${p.image}" alt="${escapeText(field(p, 'image_alt', lang) || field(p, 'name', lang))}" loading="lazy" decoding="async">
              </div>
              <div class="card-product__brand">${escapeText(p.brand.toUpperCase())}</div>
              <h3 class="card-product__name">${escapeText(field(p, 'name', lang))}</h3>
              <p class="card-product__sub">${escapeText(field(p, 'subtitle', lang))}</p>
              <div class="card-product__specs">
                <span class="card-product__spec">
                  ${escapeText(t(lang, 'product.card.material'))}:
                  <strong>${escapeText(p.material)}</strong>
                </span>
                ${p.thickness_mm ? `<span class="card-product__spec">
                  ${escapeText(t(lang, 'product.card.thickness'))}:
                  <strong>${p.thickness_mm} mm</strong>
                </span>` : ''}
              </div>
              <div class="card-product__bottom">
                <span class="card-product__price">
                  <span class="currency">${escapeText(t(lang, 'product.card.from'))}</span>${p.price_hkd}
                </span>
                <span class="btn btn--primary btn--sm"
                      data-hktv="${escapeAttr(p.hktv_url)}"
                      onclick="event.preventDefault();event.stopPropagation();window.open('${escapeAttr(p.hktv_url)}','_blank','noopener')">
                  ${escapeText(t(lang, 'product.card.buy'))}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 17L17 7M7 7h10v10"/>
                  </svg>
                </span>
              </div>
            </a>`).join('\n');
}

/** How many products there are, in the words the page uses. */
export function countHtml(all, lang) {
  return `
            <span data-i18n="products.count">${escapeText(t(lang, 'products.count'))}</span>
            <strong>${all.length}</strong>
            <span>/</span>
            <strong>${all.length}</strong>`;
}

/**
 * The catalogue, written into the products page.
 *
 * The grid and the count are found by the attributes they carry, so
 * the same call works on the Chinese page and on its two copies.
 */
export function withCatalogue(html, all, lang, productUrl) {
  let out = fillByAttr(html, 'data-grid', catalogueHtml(all, lang, productUrl));
  out = fillByAttr(out, 'data-count', countHtml(all, lang));
  return out;
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

/**
 * The buying guides, as links.
 *
 * A visitor who has read the specification table still has a
 * question — usually "which size is mine", or "does the latex
 * matter". The guides answer those, and a link from the product
 * page to the guide is the shortest way there.
 */
export function guideLinksHtml(lang) {
  const heading = GUIDE_UI.guides[lang] || GUIDE_UI.guides.zh;
  const items = GUIDES.map((g) =>
    `            <li><a href="${g.path}">${escapeText(g.short[lang] || g.short.zh)}</a></li>`,
  ).join('\n');
  return `
            <h3>${escapeText(heading)}</h3>
            <ul>
${items}
            </ul>`;
}

/* ---------- structured data ---------- */

export function productJsonLd(p, siteUrl, page, lang, productUrl) {
  const brand = t(lang, 'seo.brand.name');
  /* The name in another language, so a search in either finds it. */
  const alternateName = lang === 'en' ? p.name_zh : p.name_en;

  /* The brand and the business are the same two things on every
     page of the site, so they are named by their address and not
     written out afresh each time. The brand is defined right here;
     the business is defined on the home page — where its address,
     its telephone number and its opening hours live — and is
     pointed at from here. A crawler follows the pointer and learns
     that these four products are sold by that one company. */
  const brandNode = {
    '@type': 'Brand',
    '@id': `${siteUrl}#brand`,
    name: brand,
    url: siteUrl,
    logo: `${siteUrl}assets/images/icons/android-chrome-512.png`,
  };
  const orgRef = { '@id': `${siteUrl}#org` };

  const product = {
    '@type': 'Product',
    '@id': `${page}#product`,
    name: field(p, 'name', lang),
    alternateName,
    description: field(p, 'description', lang),
    image: [`${siteUrl}${p.image.replace(/^\//, '')}`],
    sku: p.id,
    url: page,
    brand: { '@id': `${siteUrl}#brand` },
    publisher: orgRef,
    offers: {
      '@type': 'Offer',
      url: p.hktv_url,
      priceCurrency: 'HKD',
      price: String(p.price_hkd),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: orgRef,
    },
  };

  /* No aggregateRating and no review nodes here, on purpose.
     The only reviews this site had were written as examples, and
     marking them up as customer reviews — with names, dates and a
     "verified purchase" badge — is exactly what Google's structured
     data policy forbids. When genuine customer reviews exist, they can
     be marked up: put them in `reviews` in assets/js/data.js and add
     the two nodes back here. See docs/seo.md. */

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
      brandNode,
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

  let html = template;

  /* --- the head --- */
  html = fillTag(html,
    '<title>[^<]*</title>',
    `<title>${escapeText(title)}</title>`, 'the title');

  html = fillTag(html,
    '<meta\\s+name="description"[^>]*>',
    `<meta name="description" content="${escapeText(description)}">`, 'the meta description');

  html = fillTag(html,
    '<meta\\s+name="keywords"[^>]*>',
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

  html = fillTag(html,
    '<meta\\s+property="og:title"[^>]*>',
    `<meta property="og:title" content="${escapeText(title)}">`, 'the og:title');

  html = fillTag(html,
    '<meta\\s+property="og:description"[^>]*>',
    `<meta property="og:description" content="${escapeText(description)}">`, 'the og:description');

  html = fill(html,
    `<meta property="og:url" content="${siteUrl}product.html">`,
    `<meta property="og:url" content="${page}">`, 'the og:url');

  html = fillTag(html,
    '<meta\\s+name="twitter:title"[^>]*>',
    `<meta name="twitter:title" content="${escapeText(title)}">`, 'the twitter:title');

  html = fillTag(html,
    '<meta\\s+name="twitter:description"[^>]*>',
    `<meta name="twitter:description" content="${escapeText(description)}">`, 'the twitter:description');

  /* The structured data goes in just before </head>. */
  html = fill(html, '</head>',
    `  <script type="application/ld+json" data-product-jsonld>\n${JSON.stringify(productJsonLd(p, siteUrl, page, lang, productUrl), null, 2).replace(/<\//g, '<\\/')}\n  </script>\n</head>`,
    'the </head> marker');

  /* --- the body --- */
  html = fill(html, '<body>', `<body data-product-id="${escapeText(p.id)}">`, 'the <body> tag');

  /* The breadcrumb — the way back, written out where a visitor can
     see it and not only in the structured data. */
  html = fill(html,
    '<span class="crumbs__current" aria-current="page" data-crumb>產品詳情</span>',
    `<span class="crumbs__current" aria-current="page" data-crumb>${escapeText(field(p, 'name', lang))}</span>`,
    'the breadcrumb');

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
    '<div class="product-grid" data-related></div>',
    `<div class="product-grid" data-related>${relatedHtml(p, all, lang, productUrl)}
        </div>`, 'the related products');

  html = fill(html,
    '<div class="guide-links" data-guide-links></div>',
    `<div class="guide-links" data-guide-links>${guideLinksHtml(lang)}
        </div>`, 'the buying guide links');

  /* A note at the top of the file, so nobody hand-edits a generated page. */
  html = fill(html, '<!DOCTYPE html>',
    `<!DOCTYPE html>
<!-- GENERATED FILE — do not edit by hand.
     Run: ${note}
     Source: product.html + assets/js/data.js -->`, 'the doctype');

  return { file: path, html };
}
