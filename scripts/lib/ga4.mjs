/* ===========================================================
   scripts/lib/ga4.mjs — the Google Analytics 4 block in a page.

   The measurement id names the property; it does not open it, and
   it is not a secret — it is read by the search engine, on a
   public page, exactly like the Search Console token.

   The block sits under the Tag Manager block, because the two
   share one data layer: the Tag Manager block has already defined
   window.dataLayer and gtag(), so this one only has to load the
   tag and tell it what to measure.

   The id is written from the file rather than typed in, and it is
   written the same way into every page — so no page can be left
   out, and the pages cannot disagree with one another.

   Pure — no filesystem, no network.
   =========================================================== */

/** The markers the block sits between, so it can be found again. */
export const GA4_START = '<!-- GA4:START -->';
export const GA4_END = '<!-- GA4:END -->';

/** The pages the block is written into — the ones the generators
    then carry into the English and Japanese pages, and into the
    product and guide pages. */
export const SOURCE_PAGES = [
  'index.html',
  'news.html',
  'products.html',
  'product.html',
  'about.html',
  'contact.html',
  'terms.html',
  '404.html',
];

/**
 * The block, as it goes into the page.
 *
 * With no id it stays as a note, so the page still says where the
 * tag would go.
 */
export function ga4Block(id) {
  const lines = [];

  if (id) {
    lines.push('  <!-- Google Analytics 4. The measurement id is public: it names');
    lines.push('       the property, it does not open it. Set by');
    lines.push('       node scripts/set-ga4.mjs. -->');
    lines.push(`  <script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`);
    lines.push('  <script>');
    lines.push("    gtag('js', new Date());");
    lines.push(`    gtag('config', '${id}');`);
    lines.push('  </script>');
  } else {
    lines.push('  <!-- Google Analytics 4 — run node scripts/set-ga4.mjs G-XXXXXXXXXX to add it. -->');
  }

  return lines.join('\n');
}

/**
 * Put the block into a page, wherever the old one was.
 *
 * The markers are found and everything between them is replaced, so
 * running the script twice leaves the same page.
 */
export function setGa4(html, id) {
  const start = html.indexOf(GA4_START);
  const end = html.indexOf(GA4_END);
  if (start < 0 || end < 0) throw new Error('the page has no GA4 block');
  /* The indentation of the line the block begins on — the closing
     marker is put back with the same, so the page keeps its shape. */
  const lineStart = html.lastIndexOf('\n', start) + 1;
  const indent = html.slice(lineStart, start);
  return (
    html.slice(0, start) +
    GA4_START + '\n' +
    ga4Block(id) + '\n' +
    indent + GA4_END +
    html.slice(end + GA4_END.length)
  );
}

/**
 * The measurement id a page carries, if any.
 *
 * A tag inside a comment is not a tag — the note is written as a
 * comment on purpose, so it must not be read as an id.
 */
export function ga4IdIn(html) {
  const clean = String(html).replace(/<!--[\s\S]*?-->/g, '');
  const m = clean.match(/googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+)/);
  return m ? m[1] : '';
}
