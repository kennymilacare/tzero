/* ===========================================================
   scripts/lib/langpage.mjs — one page, in one language.

   This is the machinery that takes a finished Chinese page and
   makes the English and Japanese versions of it:

     · the page says what language it is in
     · the words are put in, so a crawler reads them without
       running any JavaScript
     · the canonical link and the alternate links say which
       languages the page is in
     · the addresses of the files are right for the folder the
       page now lives in

   Everything here is pure: it takes a page in and gives a page
   back, and it writes nothing to disk.
   =========================================================== */

import { i18n } from '../../assets/js/data.js';
import { attrsOf, elements, escapeText, replaceLinks, resolveI18n, scan } from './html.mjs';
import { HTML_LANG, LANG_DIR, NEXT_LANG, NEXT_LABEL, PAGES, TOGGLE_ARIA, linkBlock, langUrlsJson, pageUrl, relativePath } from './langs.mjs';

/* ---------- the parts that say what language this is ---------- */

/** The <html> tag, saying what language the page is in and where
    the other two versions live. */
export function htmlTag(siteUrl, lang, path) {
  const urls = langUrlsJson(siteUrl, path);
  return `<html lang="${HTML_LANG[lang]}" data-lang="${lang}" data-lang-urls='${urls}'>`;
}

/**
 * The language toggle.
 *
 * It used to be a button that swapped the words on the page. It
 * is a link now, to the same page in the next language — so a
 * link that is shared shows the same language to everyone.
 */
export function languageToggle(lang, path) {
  const to = NEXT_LANG[lang];
  const href = relativePath(lang, to, path);
  const aria = TOGGLE_ARIA[lang];
  return `<a class="lang-toggle" href="${href}" hreflang="${HTML_LANG[to]}" lang="${HTML_LANG[to]}" data-lang-toggle aria-label="${aria}" title="${aria}">${NEXT_LABEL[lang]}</a>`;
}

/* The old button, or the link that replaced it. */
const TOGGLE_RE = /<(button|a)\b[^>]*\bclass="lang-toggle"[^>]*>[\s\S]*?<\/\1>/g;

/** Put the language on the page and point the toggle at it. */
export function finishHead(html, { siteUrl, lang, path }) {
  let out = html.replace(/<html\b[^>]*>/, htmlTag(siteUrl, lang, path));
  out = out.replace(TOGGLE_RE, languageToggle(lang, path));
  return out;
}

/* ---------- the parts that move ---------- */

/**
 * The pages one folder down need one more step to reach the
 * assets, and the modules inside them are named from the page.
 */
export function assetPaths(html, lang) {
  if (!LANG_DIR[lang]) return html;
  return html
    .replace(/(src|href)="assets\//g, '$1="../assets/')
    .replace(/'\.\/assets\//g, "'../assets/");
}

/* ---------- the structured data ---------- */

/**
 * Point the structured data at this page in this language.
 *
 * Only the addresses of the site's own pages move. The shop, the
 * website and the images stay where they are — they are not this
 * page, they are the business.
 */
export function localiseGraph(graph, siteUrl, lang) {
  const map = new Map();
  for (const page of PAGES) {
    map.set(pageUrl(siteUrl, 'zh', page.path), pageUrl(siteUrl, lang, page.path));
  }

  const fix = (value, type, key) => {
    if (Array.isArray(value)) return value.map((v) => fix(v, type, key));
    if (value && typeof value === 'object') {
      const own = value['@type'];
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = fix(v, own, k);
      return out;
    }
    if (typeof value !== 'string') return value;
    if (key === '@id') return value;
    if ((type === 'WebSite' || type === 'LocalBusiness') && key === 'url') return value;
    return map.has(value) ? map.get(value) : value;
  };

  return fix(graph, null, null);
}

/**
 * The pages that carry nothing but a breadcrumb and a line about
 * themselves: about, contact, terms. What they say about
 * themselves is already in the page — its title and its
 * description — so it is read from there rather than written out
 * a second time.
 */
export function plainGraph({ siteUrl, lang, path, title, description, type, crumb = null }) {
  const page = pageUrl(siteUrl, lang, path);
  const node = {
    '@type': type,
    '@id': `${page}#webpage`,
    url: page,
    name: title,
    isPartOf: { '@id': `${siteUrl}/#site` },
    inLanguage: HTML_LANG[lang],
  };
  if (description) node.description = description;
  /* The contact page is about the shop, so it points at the shop. */
  if (type === 'ContactPage') node.mainEntity = { '@id': `${siteUrl}/#org` };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t(lang, 'nav.home'), item: pageUrl(siteUrl, lang, '') },
          { '@type': 'ListItem', position: 2, name: crumb || title, item: page },
        ],
      },
      node,
    ],
  };
}

/** The words for a key, in a language. */
export function t(lang, key) {
  const cur = i18n[lang];
  if (cur && cur[key] != null) return cur[key];
  const zh = i18n.zh;
  if (zh && zh[key] != null) return zh[key];
  const en = i18n.en;
  if (en && en[key] != null) return en[key];
  return key;
}

/* ---------- the whole page ---------- */

/**
 * Replace what is inside the FAQ box with another set of questions.
 */
export function replaceFaq(html, block) {
  const tags = scan(html);
  const spans = elements(html, tags);
  const box = tags.find((tag) => !tag.closing && 'data-faq' in attrsOf(tag));
  if (!box) return html;
  const span = spans.get(box.start);
  if (!span) return html;
  return html.slice(0, span.contentStart) + '\n' + block + html.slice(span.contentEnd);
}

/**
 * Make one page out of a page, in one language.
 *
 * `title`, `description` and `jsonLd` are left alone when they are
 * null — that is how the Chinese pages keep the words they were
 * written with.
 */
export function translatePage(html, {
  siteUrl,
  lang,
  path,
  dict = i18n[lang],
  title = null,
  description = null,
  jsonLd = null,
  faq = null,
  strip = false,
  dropKeywords = false,
}) {
  let out = html;

  /* The words. This happens before the structured data is written,
     so that the words in the page and the words in the data
     cannot disagree. */
  out = resolveI18n(out, dict, { strip, skipJson: true });

  /* The head. */
  if (title != null) {
    out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeText(title)}</title>`);
  }
  if (description != null) {
    out = out.replace(/<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${escapeText(description)}">`);
  }
  if (dropKeywords) {
    out = out.replace(/\s*<meta name="keywords" content="[^"]*">/, '');
  }

  const brand = t(lang, 'seo.brand.name');
  out = out.replace(/<meta property="og:site_name" content="[^"]*">/,
    `<meta property="og:site_name" content="${escapeText(brand)}">`);
  out = out.replace(/<meta name="author" content="[^"]*">/,
    `<meta name="author" content="${escapeText(brand)}">`);
  out = out.replace(/<meta property="og:image:alt" content="[^"]*">/,
    `<meta property="og:image:alt" content="${escapeText(`${brand} — ${t(lang, 'seo.brand.desc')}`)}">`);

  out = replaceLinks(out, linkBlock(siteUrl, lang, path));
  out = out.replace(/<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${pageUrl(siteUrl, lang, path)}">`);

  /* The structured data. */
  if (jsonLd != null) {
    const json = JSON.stringify(jsonLd, null, 2).replace(/<\//g, '<\\/');
    out = out.replace(/(<script type="application\/ld\+json"[^>]*>)[\s\S]*?(<\/script>)/,
      (m, open, close) => `${open}\n${json}\n${close}`);
  }

  /* The questions. */
  if (faq != null) out = replaceFaq(out, faq);

  /* Where the page is, and how to get to the other language. */
  out = finishHead(out, { siteUrl, lang, path });

  /* The files are one folder down now. */
  out = assetPaths(out, lang);

  return out;
}
