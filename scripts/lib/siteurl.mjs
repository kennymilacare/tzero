/* ===========================================================
   scripts/lib/siteurl.mjs — pure helpers for the site's own address.

   The site is static, so its own address is written literally into
   every page (canonical, hreflang, og:url, og:image), into
   sitemap.xml and into robots.txt. These helpers move all of them
   to a new base URL in one go; scripts/lib/siteurl.test.mjs then
   guards against one of them drifting.

   No network, no filesystem: everything here can be unit-tested.
   =========================================================== */

/**
 * Normalise what was typed into a base URL.
 *   "tzerohk.com"          → "https://tzerohk.com/"
 *   "https://x.com/blog"   → "https://x.com/blog/"
 *   "ftp://x.com"          → null
 */
export function normalizeBase(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  /* An explicit scheme that is not http(s) is a mistake, not a host. */
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) && !/^https?:\/\//i.test(raw)) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let u;
  try {
    u = new URL(withScheme);
  } catch (e) {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  let p = u.pathname || '/';
  if (!p.endsWith('/')) p += '/';
  return u.origin + p;
}

/**
 * The directory a page lives in, from its own URL.
 *   https://tzero.example.com/about.html            → https://tzero.example.com/
 *   https://tzero.example.com/                      → https://tzero.example.com/
 *   https://kennymilacare.github.io/tzero/news.html → https://kennymilacare.github.io/tzero/
 *
 * The last segment is dropped only when it looks like a file (it has
 * a dot) — a GitHub Pages project lives in a directory, and that
 * directory is part of its address.
 */
export function baseOf(pageUrl) {
  let u;
  try {
    u = new URL(pageUrl);
  } catch (e) {
    return null;
  }
  let p = u.pathname || '/';
  if (!p.endsWith('/')) {
    const last = p.slice(p.lastIndexOf('/') + 1);
    if (last.includes('.')) p = p.slice(0, p.lastIndexOf('/') + 1) || '/';
  }
  return u.origin + p;
}

/**
 * Point every URL that belongs to the old base at the new one.
 * Third-party links (Facebook, Instagram, HKTVmall) are left alone —
 * only this site's own address moves.
 */
export function rewriteText(text, oldBase, newBase) {
  const oldKey = String(oldBase || '').replace(/\/+$/, '');
  const newKey = String(newBase || '').replace(/\/+$/, '');
  if (!oldKey || !newKey || oldKey === newKey) return String(text || '');
  return String(text || '').split(oldKey).join(newKey);
}

/** The canonical URL declared in a page, or null. */
export function canonicalOf(html) {
  const m = String(html || '').match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1] : null;
}

/** The first <loc> in a sitemap, or null. */
export function firstLocOf(xml) {
  const m = String(xml || '').match(/<loc>([^<]+)<\/loc>/i);
  return m ? m[1] : null;
}

/** The sitemap address declared in robots.txt, or null. */
export function sitemapOf(robots) {
  const m = String(robots || '').match(/^\s*sitemap:\s*(\S+)/im);
  return m ? m[1] : null;
}
