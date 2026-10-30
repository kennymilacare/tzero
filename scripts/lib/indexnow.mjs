/* ===========================================================
   scripts/lib/indexnow.mjs — the IndexNow request, in pure pieces.

   IndexNow is the one way to tell a search engine that a page has
   changed without an account, a login or an API key. Bing and
   Yandex read it; Google does not. It is the reason the new English
   and Japanese addresses can be pushed out the moment they go live,
   instead of waiting for a crawler to happen across them.

   The rules are short:

     · one key, a string of hex characters;
     · the key has to be readable at https://<host>/<key>.txt;
     · POST the addresses that changed to api.indexnow.org.

   Pure — the caller does the writing and the sending.
   =========================================================== */

import { pageUrl } from './langs.mjs';

export const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** A key is hex, between 8 and 128 characters. */
export function isValidKey(key) {
  return /^[a-f0-9]{8,128}$/i.test(String(key || ''));
}

/**
 * The host, on its own.
 *
 * IndexNow wants the host without the scheme and without a path —
 * "www.tzero-jp.com", not "https://www.tzero-jp.com/".
 */
export function hostOf(siteUrl) {
  const m = String(siteUrl || '').match(/^https?:\/\/([^/]+)/i);
  return m ? m[1] : '';
}

/** Where the key file lives, so the search engine can read it. */
export function keyLocation(siteUrl, key) {
  const host = hostOf(siteUrl);
  return host ? `https://${host}/${key}.txt` : '';
}

/**
 * The request body.
 *
 * `urlList` is the addresses that changed. An empty list is not
 * worth sending, so the caller checks first.
 */
export function requestBody({ siteUrl, key, urlList }) {
  return {
    host: hostOf(siteUrl),
    key,
    keyLocation: keyLocation(siteUrl, key),
    urlList,
  };
}

/**
 * The files every page depends on.
 *
 * The stylesheet, the scripts, the images — a change to any of them
 * changes every page on the site, so every address has to be sent.
 */
export function isSharedAsset(file) {
  return /^(assets\/css\/|assets\/js\/|assets\/images\/|assets\/data\/site\.json$)/.test(String(file || ''));
}

/**
 * The addresses of the pages that show a changed file.
 *
 * A file is written with the paths as the site sees them —
 * "index.html", "en/news.html", "assets/data/news.json".
 */
export function urlsFor(list, siteUrl, changedFiles) {
  const changed = new Set(changedFiles.map((f) => String(f).replace(/\\/g, '/')));

  const urls = [];
  for (const entry of list) {
    const touched = entry.files.some((f) => changed.has(f));
    if (!touched) continue;
    const url = pageUrl(siteUrl, entry.lang, entry.path);
    if (!urls.includes(url)) urls.push(url);
  }
  return urls;
}

/** Every address on the site. */
export function allUrls(list, siteUrl) {
  return list.map((entry) => pageUrl(siteUrl, entry.lang, entry.path));
}

/** What the search engine said, in words. */
export function describeResponse(status, body = '') {
  const text = String(body).trim();
  switch (status) {
    case 200: return 'OK — the addresses were accepted.';
    case 202: return 'Accepted — the key is still being checked.';
    case 400: return 'Bad request — the body was not what IndexNow expects.';
    case 403: return 'Forbidden — the key does not match the key file.';
    case 422: return 'Unprocessable — the addresses do not belong to this host, or the key file cannot be read.';
    case 429: return 'Too many requests — try again later.';
    default: return text ? `HTTP ${status} — ${text}` : `HTTP ${status}`;
  }
}
