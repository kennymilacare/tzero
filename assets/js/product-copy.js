/* ===========================================================
   product-copy.js — the words a product page is titled and
   described with.

   A product page is written once at build time and its title is
   rewritten by the browser when the page loads. If the two used
   different wording, the tab a visitor sees would not match what
   a crawler reads — and the three languages would drift apart.

   So the wording lives here, once, and both the browser
   (assets/js/product.js) and the build script
   (scripts/gen-product-pages.mjs) use it.

   Nothing in here touches the page: it is pure text, so it runs
   the same in the browser and in Node.
   =========================================================== */

import { i18n } from './data.js?v=28';

/** The words for a key, in a language, with the same fallbacks the browser uses. */
function word(lang, key) {
  const cur = i18n[lang];
  if (cur && cur[key] != null) return cur[key];
  if (i18n.zh && i18n.zh[key] != null) return i18n.zh[key];
  if (i18n.en && i18n.en[key] != null) return i18n.en[key];
  return '';
}

/** Put the values into the placeholders of a template. */
function fill(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m));
}

/** A field of the product in a language, falling back the same way. */
function field(product, name, lang) {
  const v = product[`${name}_${lang}`];
  if (v != null && v !== '') return v;
  if (product[`${name}_zh`] != null && product[`${name}_zh`] !== '') return product[`${name}_zh`];
  if (product[`${name}_en`] != null && product[`${name}_en`] !== '') return product[`${name}_en`];
  return '';
}

/** The title of a product page. */
export function productTitle(product, lang = 'zh') {
  const name = field(product, 'name', lang);
  const subtitle = field(product, 'subtitle', lang);
  return `${name} — ${subtitle} | ${word(lang, 'seo.brand.name')}`;
}

/**
 * The description of a product page.
 *
 * A product page carries two pieces of writing about the product:
 * the long description that the page itself shows, and a shorter
 * summary for the meta description and the structured data. The
 * summary is the one that is written to say what the page is — a
 * search engine shows a page's description in the results, and
 * reads the same words again in the structured data.
 *
 * A product with no summary written falls back to the long
 * description and the sentence that goes with it.
 */
export function productDescription(product, lang = 'zh') {
  const summary = field(product, 'summary', lang);
  if (summary) return summary;

  return fill(word(lang, 'product.detail.summary'), {
    description: field(product, 'description', lang),
    subtitle: field(product, 'subtitle', lang),
    pieces: String(product.pieces),
    price: String(product.price_hkd),
  });
}

/* The words people search for. Search engines ignore this tag, but
   it costs nothing to have it say the right thing. */
const KEYWORDS = {
  zh: { brand: '第九感', common: ['玻尿酸安全套', '安全套', 'condom', 'hyaluronic', '香港', '24小時落單'] },
  en: { brand: 'NINTH SENSE', common: ['hyaluronic condom', 'condom', 'hyaluronic', 'Hong Kong', '24-hour ordering'] },
  ja: { brand: '第九感', common: ['ハイアロンコンドーム', 'コンドーム', 'hyaluronic', '香港', '24時間受付'] },
};

/** The keywords of a product page. */
export function productKeywords(product, lang = 'zh') {
  const extra = [];
  if (product.thickness_mm) extra.push(lang === 'zh' ? '超薄' : lang === 'ja' ? '薄型' : 'ultra thin');
  if (product.type === 'textured') extra.push(lang === 'zh' ? '顆粒' : lang === 'ja' ? 'スタッド' : 'textured');
  if (product.type === 'functional') extra.push(lang === 'zh' ? '潤滑' : lang === 'ja' ? '潤滑' : 'lubricated');

  const words = KEYWORDS[lang] || KEYWORDS.zh;

  return [
    'T-ZERO',
    words.brand,
    field(product, 'name', lang),
    product.series,
    ...words.common,
    ...extra,
  ].filter(Boolean).join(', ');
}
