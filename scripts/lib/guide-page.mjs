/* ===========================================================
   scripts/lib/guide-page.mjs — one guide, one page, in any of
   the three languages.

   A guide is a page like any other: it has a heading, some
   writing, a table or two, a few questions, and links to the
   products it talks about. This turns the words in
   scripts/lib/guides/ into that page, and into the structured
   data that describes it.

   The writing is set in one column, top to bottom. A guide is
   read, not scanned — the answer to a question is usually a
   paragraph, and a paragraph cut in half and put beside a
   heading is harder to read than the same paragraph on its own.

   Pure — it takes the words in and gives the page back.
   =========================================================== */

import { products, productUrl } from '../../assets/js/data.js';
import { escapeAttr, escapeText } from './html.mjs';
import { GUIDES, GUIDE_HUB, GUIDE_UI, guideByPath, guideOgImageUrl } from './guides.mjs';
import { HTML_LANG, pageUrl } from './langs.mjs';
import { t } from './langpage.mjs';

/* ---------- the words inside a sentence ---------- */

/**
 * The two pieces of inline markup the guides use:
 *
 *     **bold**            →  <strong>bold</strong>
 *     [label](page.html)  →  <a href="page.html">label</a>
 *
 * The text is escaped first, so that a stray & or < in a guide
 * cannot break the page.
 */
export function inline(text) {
  const escaped = escapeText(String(text ?? ''));
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_m, label, href) => `<a href="${href.replace(/"/g, '%22')}">${label}</a>`);
}

/**
 * The same words with the markup taken out.
 *
 * The structured data cannot hold markup — it holds plain text,
 * so a link becomes just its label.
 */
export function plain(text) {
  return String(text ?? '')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .trim();
}

/** The words of a field in one language. */
function pick(field, lang) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lang] ?? field.zh ?? '';
}

/** The name of the page a link points at. */
function relatedLabel(path, lang) {
  const product = products.find((p) => productUrl(p.id) === path);
  if (product) return product[`name_${lang}`] || product.name_zh || path;
  const guide = guideByPath(path);
  if (guide) return pick(guide.short, lang);
  return path;
}

/* ---------- the pieces of the page ---------- */

/** One block of writing. */
function blockHtml(block, lang) {
  if (block.t === 'p') {
    return `          <p>${inline(pick(block.text, lang))}</p>`;
  }

  if (block.t === 'ul' || block.t === 'ol') {
    const items = block.items
      .map((item) => `            <li>${inline(pick(item, lang))}</li>`)
      .join('\n');
    return `          <${block.t}>\n${items}\n          </${block.t}>`;
  }

  if (block.t === 'note') {
    return [
      '          <aside class="guide__note">',
      `            <h3>${inline(pick(block.title, lang))}</h3>`,
      `            <p>${inline(pick(block.text, lang))}</p>`,
      '          </aside>',
    ].join('\n');
  }

  if (block.t === 'table') {
    const head = block.head
      .map((h) => `                <th scope="col">${inline(pick(h, lang))}</th>`)
      .join('\n');
    const rows = block.rows
      .map((row) => {
        const cells = row
          .map((c) => `                  <td>${inline(pick(c, lang))}</td>`)
          .join('\n');
        return `              <tr>\n${cells}\n              </tr>`;
      })
      .join('\n');
    return [
      '          <div class="guide__table-wrap">',
      '            <table class="guide__table">',
      '              <thead>',
      '                <tr>',
      head,
      '                </tr>',
      '              </thead>',
      '              <tbody>',
      rows,
      '              </tbody>',
      '            </table>',
      '          </div>',
    ].join('\n');
  }

  return '';
}

/* ---------- the whole page ---------- */

/**
 * The body of one guide page, in one language.
 *
 * The links are relative, so the same body works at the root and
 * one folder down — a link to a product page stays inside the
 * language the reader is in.
 *
 * `modified` is the day the words were last changed. It comes from
 * git, so it cannot go out of date — there is no date to forget to
 * update when the guide is rewritten.
 */
export function guideBody(guide, lang, modified) {
  const brand = t(lang, 'seo.brand.name');
  const short = pick(guide.short, lang);

  const crumbs = [
    '      <nav class="guide__crumbs" aria-label="' + escapeAttr(GUIDE_UI.guides[lang]) + '">',
    `        <a href="index.html">${escapeText(GUIDE_UI.home[lang])}</a>`,
    '        <span class="guide__crumbs-sep" aria-hidden="true">/</span>',
    `        <a href="${escapeAttr(GUIDE_HUB.path)}">${escapeText(GUIDE_UI.guides[lang])}</a>`,
    '        <span class="guide__crumbs-sep" aria-hidden="true">/</span>',
    `        <span aria-current="page">${escapeText(short)}</span>`,
    '      </nav>',
  ].join('\n');

  const toc = guide.sections
    .map((s) => `            <li><a href="#${s.id}">${escapeText(pick(s.h2, lang))}</a></li>`)
    .join('\n');

  const sections = guide.sections
    .map((section) => {
      const blocks = section.blocks
        .map((block) => blockHtml(block, lang))
        .filter(Boolean)
        .join('\n');
      return [
        `        <section class="guide__section" id="${section.id}">`,
        `          <h2>${escapeText(pick(section.h2, lang))}</h2>`,
        blocks,
        '        </section>',
      ].join('\n');
    })
    .join('\n');

  const faq = guide.faq
    .map((item) => [
      '          <details class="guide__faq-item">',
      `            <summary>${escapeText(pick(item.q, lang))}</summary>`,
      `            <div class="guide__faq-answer"><p>${inline(pick(item.a, lang))}</p></div>`,
      '          </details>',
    ].join('\n'))
    .join('\n');

  const related = guide.related
    .map((path) => `            <li><a href="${escapeAttr(path)}">${escapeText(relatedLabel(path, lang))}</a></li>`)
    .join('\n');

  const others = GUIDES
    .filter((g) => g.path !== guide.path)
    .map((g) => `            <li><a href="${escapeAttr(g.path)}">${escapeText(pick(g.short, lang))}</a></li>`)
    .join('\n');

  return `  <main>
    <section class="section guide">
      <div class="container">
${crumbs}

        <header class="guide__head">
          <span class="eyebrow">${escapeText(pick(guide.eyebrow, lang))}</span>
          <h1>${escapeText(pick(guide.h1, lang))}</h1>
          <p class="guide__lead">${inline(pick(guide.lead, lang))}</p>
          <div class="guide__meta">
            <figure class="guide__figure">
              <img src="${escapeAttr(guide.image)}" alt="${escapeAttr(`${brand} ${short}`)}" width="${guide.imageWidth || 600}" height="${guide.imageHeight || 600}" loading="lazy" decoding="async">
            </figure>
            <p class="guide__updated"><span>${escapeText(GUIDE_UI.updated[lang])}</span> <time datetime="${escapeAttr(modified)}">${escapeText(modified)}</time></p>
          </div>
        </header>

        <nav class="guide__toc" aria-label="${escapeAttr(GUIDE_UI.toc[lang])}">
          <span class="guide__toc-label">${escapeText(GUIDE_UI.toc[lang])}</span>
          <ol>
${toc}
          </ol>
        </nav>

        <div class="guide__prose">
${sections}
        </div>

        <section class="guide__faq" id="faq">
          <h2>${escapeText(GUIDE_UI.faq[lang])}</h2>
          <div class="guide__faq-list">
${faq}
          </div>
        </section>

        <section class="guide__related">
          <h2>${escapeText(GUIDE_UI.related[lang])}</h2>
          <ul>
${related}
          </ul>
        </section>

        <section class="guide__all">
          <h2>${escapeText(GUIDE_UI.all[lang])}</h2>
          <ul>
${others}
          </ul>
        </section>
      </div>
    </section>
  </main>`;
}

/* ---------- the page that lists them all ---------- */

/**
 * The body of the page that lists every guide.
 *
 * One card per guide: its title, its one-line summary, and a link.
 * The writing is one column, top to bottom, like the guides
 * themselves — a list of things to read is a list, not a grid of
 * boxes to squint at.
 */
export function hubBody(lang) {
  const items = GUIDES.map((g) => [
    '          <article class="guide-hub__item">',
    `            <h2><a href="${escapeAttr(g.path)}">${escapeText(pick(g.short, lang))}</a></h2>`,
    `            <p>${inline(pick(g.blurb, lang))}</p>`,
    '          </article>',
  ].join('\n')).join('\n');

  const crumbs = [
    '        <nav class="guide__crumbs" aria-label="' + escapeAttr(GUIDE_UI.guides[lang]) + '">',
    `          <a href="index.html">${escapeText(GUIDE_UI.home[lang])}</a>`,
    '          <span class="guide__crumbs-sep" aria-hidden="true">/</span>',
    `          <span aria-current="page">${escapeText(GUIDE_UI.guides[lang])}</span>`,
    '        </nav>',
  ].join('\n');

  return `  <main>
    <section class="section guide">
      <div class="container">
${crumbs}

        <header class="guide__head">
          <span class="eyebrow">${escapeText(GUIDE_UI.hubEyebrow[lang])}</span>
          <h1>${escapeText(GUIDE_UI.hubH1[lang])}</h1>
          <p class="guide__lead">${inline(GUIDE_UI.hubLead[lang])}</p>
        </header>

        <div class="guide-hub">
${items}
        </div>

        <p class="guide-hub__cta">
          <a class="btn btn--primary" href="products.html">${escapeText(GUIDE_UI.hubCta[lang])}</a>
        </p>
      </div>
    </section>
  </main>`;
}

/* ---------- the structured data ---------- */

/**
 * What the guide says about itself, in the form a crawler reads.
 *
 * A breadcrumb so the page sits in the site's shape, the page
 * itself, and the questions it answers — all three are true of
 * the page and none of them is written out twice.
 */
export function guideJsonLd(guide, lang, siteUrl, modified) {
  const page = pageUrl(siteUrl, lang, guide.path);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: GUIDE_UI.home[lang], item: pageUrl(siteUrl, lang, '') },
          { '@type': 'ListItem', position: 2, name: GUIDE_UI.guides[lang], item: pageUrl(siteUrl, lang, GUIDE_HUB.path) },
          { '@type': 'ListItem', position: 3, name: pick(guide.short, lang), item: page },
        ],
      },
      {
        '@type': 'WebPage',
        '@id': `${page}#webpage`,
        url: page,
        name: pick(guide.title, lang),
        description: pick(guide.description, lang),
        isPartOf: { '@id': `${siteUrl}#site` },
        publisher: { '@id': `${siteUrl}#org` },
        inLanguage: HTML_LANG[lang],
        datePublished: guide.published,
        dateModified: modified,
        /* The picture the guide is about, and the picture it is
           shared under — the same two the sitemap names. */
        image: [`${siteUrl}${guide.image}`, guideOgImageUrl(siteUrl, guide.path, lang)],
      },
      {
        '@type': 'FAQPage',
        mainEntity: guide.faq.map((item) => ({
          '@type': 'Question',
          name: plain(pick(item.q, lang)),
          acceptedAnswer: { '@type': 'Answer', text: plain(pick(item.a, lang)) },
        })),
      },
    ],
  };
}

/**
 * What the list of guides says about itself.
 *
 * A collection page, and a list of the five things in it — so that
 * a search engine knows the page is a list of guides and not
 * another guide, and knows what the list holds.
 */
export function hubJsonLd(lang, siteUrl, modified) {
  const page = pageUrl(siteUrl, lang, GUIDE_HUB.path);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: GUIDE_UI.home[lang], item: pageUrl(siteUrl, lang, '') },
          { '@type': 'ListItem', position: 2, name: GUIDE_UI.guides[lang], item: page },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${page}#webpage`,
        url: page,
        name: GUIDE_UI.hubTitle[lang],
        description: GUIDE_UI.hubDescription[lang],
        isPartOf: { '@id': `${siteUrl}#site` },
        publisher: { '@id': `${siteUrl}#org` },
        inLanguage: HTML_LANG[lang],
        datePublished: GUIDE_HUB.published,
        dateModified: modified,
        image: guideOgImageUrl(siteUrl, GUIDE_HUB.path, lang),
      },
      {
        '@type': 'ItemList',
        itemListElement: GUIDES.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: pick(g.short, lang),
          url: pageUrl(siteUrl, lang, g.path),
        })),
      },
    ],
  };
}
