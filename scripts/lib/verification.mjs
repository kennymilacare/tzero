/* ===========================================================
   scripts/lib/verification.mjs — the verification block in a page.

   A search engine checks one thing to decide whether a site is
   yours: a meta tag on the home page. The token in it changes
   every time, and pasting it by hand is easy to get wrong.

   So the block is written from the token rather than typed in, and
   it is written the same way into all three home pages — the
   Chinese one, the English one and the Japanese one. They cannot
   disagree, because they all come from the same place.

   Pure — no filesystem, no network.
   =========================================================== */

export const GOOGLE_META = 'google-site-verification';
export const BING_META = 'msvalidate.01';

/** The home pages — the one place the token has to be. */
export const HOME_PAGES = ['index.html', 'en/index.html', 'ja/index.html'];

/**
 * The block, as it goes into the page.
 *
 * With no token it stays as a placeholder, so the page still says
 * where a token would go.
 */
export function blockFor(google, bing) {
  const lines = [];

  lines.push('  <!-- Search Console / Bing Webmaster verification.');
  if (google || bing) {
    lines.push('       Set by node scripts/set-verification.mjs. The token is public —');
    lines.push('       it is meant to be read by the search engine, not kept secret. -->');
    if (google) lines.push(`  <meta name="${GOOGLE_META}" content="${google}">`);
    if (bing) lines.push(`  <meta name="${BING_META}" content="${bing}">`);
  } else {
    lines.push('       Run node scripts/set-verification.mjs --google <token> to add the');
    lines.push('       Google token, and --bing <token> for Bing. See docs/seo.md. -->');
    lines.push(`  <!-- <meta name="${GOOGLE_META}" content="PASTE_TOKEN_HERE"> -->`);
    lines.push(`  <!-- <meta name="${BING_META}" content="PASTE_TOKEN_HERE"> -->`);
  }

  return lines;
}

/**
 * Put the block into a page, wherever the old one was.
 *
 * The note and the two meta tag lines are found and replaced as
 * one piece, so the page is never left with half of the old block
 * and half of the new one.
 */
export function setBlock(html, google, bing) {
  const lines = html.split('\n');

  const start = lines.findIndex((l) => l.includes('Search Console / Bing Webmaster verification.'));
  if (start < 0) throw new Error('the verification block is not in this page');

  /* The meta tag lines — commented or not — sit just after the
     note. There may be one of them or two, depending on which
     tokens are set, so all of them are taken. */
  const tags = [];
  for (let i = start + 1; i < Math.min(lines.length, start + 20); i++) {
    const l = lines[i];
    if (l.includes(`name="${GOOGLE_META}"`) || l.includes(`name="${BING_META}"`)) tags.push(i);
  }

  const last = tags.length ? tags[tags.length - 1] : start;
  const out = [...lines.slice(0, start), ...blockFor(google, bing), ...lines.slice(last + 1)];
  return out.join('\n');
}

/**
 * The token a page carries, if any.
 *
 * A tag inside a comment is not a tag — the placeholder is written
 * as a comment on purpose, so it must not be read as a token.
 */
export function tokenIn(html, name) {
  const clean = String(html).replace(/<!--[\s\S]*?-->/g, '');
  const m = clean.match(new RegExp(`<meta name="${name}" content="([^"]+)">`));
  return m ? m[1] : '';
}
