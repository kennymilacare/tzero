/* ===========================================================
   paths.js — where the site's own files really are.

   The English and Japanese pages live one folder down (/en/,
   /ja/), so a relative path like "assets/images/x.jpg" would be
   looked for in /en/assets/... and not found. The same goes for
   "assets/data/news.json", which the news page fetches.

   This module works the site's own address out from where this
   file sits — assets/js/paths.js is always two folders below the
   root — so one relative path works on every page, and keeps
   working if the site is ever published under a sub-folder.

   Run: import { assetUrl } from './paths.js?v=2';
   =========================================================== */

/* The root of the site, wherever it is published. */
export const SITE_ROOT = new URL('../../', import.meta.url);

/**
 * The address of a file in the site.
 *
 * A path that already names a place on the internet — http://,
 * https://, //host, data: — is left exactly as it is. Everything
 * else is read as a path inside the site.
 */
export function assetUrl(p) {
  const s = String(p == null ? '' : p);
  if (!s) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('//')) return s;
  return new URL(s, SITE_ROOT).href;
}
