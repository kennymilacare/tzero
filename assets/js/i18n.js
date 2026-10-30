/* ===========================================================
   i18n.js — the page's language.

   The language used to be a cookie: whichever one the visitor
   picked last, kept in localStorage and swapped into the page
   with JavaScript. A crawler has no cookie and never clicks the
   button, so it only ever saw the Chinese version of every page —
   and the English and Japanese versions could never be found.

   Now the address decides. Every page says what language it is
   in the markup:

       <html lang="en" data-lang="en">

   and the three versions of the site live at their own
   addresses:

       /            /products.html       Chinese
       /en/         /en/products.html    English
       /ja/         /ja/products.html    Japanese

   The strings are still applied at run time, so the words a
   visitor reads and the words a crawler reads are the same words.
   =========================================================== */

import { i18n } from './data.js?v=25';

const DEFAULT_LANG = 'zh';
const SUPPORTED = ['zh', 'en', 'ja'];

/* BCP-47 lang tags used on <html lang> and <meta>. */
const HTML_LANG = { zh: 'zh-HK', en: 'en', ja: 'ja-JP' };

/* Short label shown on the toggle button — points at the NEXT language. */
const NEXT_LABEL = { zh: 'EN', en: 'JA', ja: '中' };

/* Accessible description for the toggle. */
const TOGGLE_ARIA = {
  zh: '切換至 English',
  en: 'Switch to 日本語',
  ja: '日本語から繁體中文へ切替',
};

/**
 * The language the page is written in.
 *
 * The page says so itself: data-lang="en". The lang attribute is
 * the fallback for a page that has not been given the extra
 * attribute.
 */
function pageLang() {
  const el = document.documentElement;
  if (!el) return DEFAULT_LANG;
  const said = el.getAttribute('data-lang');
  if (SUPPORTED.includes(said)) return said;
  const tag = (el.getAttribute('lang') || '').toLowerCase();
  const byTag = SUPPORTED.find((l) => tag === l || tag.startsWith(`${l}-`));
  return byTag || DEFAULT_LANG;
}

let currentLang = pageLang();

/* Translate a key. Fallback chain: current → zh → en → key. */
export function t(key, lang = currentLang) {
  const cur = i18n[lang];
  if (cur && cur[key] != null) return cur[key];
  const zh = i18n[DEFAULT_LANG];
  if (zh && zh[key] != null) return zh[key];
  const en = i18n.en;
  if (en && en[key] != null) return en[key];
  return key;
}

/* Apply translations to the current DOM. */
function applyToDOM() {
  document.documentElement.lang = HTML_LANG[currentLang] || 'en';

  // data-i18n — text content
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val != null) el.textContent = val;
  });

  // data-i18n-placeholder — input placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = t(key);
    if (val != null) el.setAttribute('placeholder', val);
  });

  // data-i18n-aria — aria-label
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    const val = t(key);
    if (val != null) el.setAttribute('aria-label', val);
  });

  // data-i18n-attr="<attr-name>" + data-i18n="<key>" — set any attribute (e.g. content, href)
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const attr = el.getAttribute('data-i18n-attr');
    const key = el.getAttribute('data-i18n');
    if (!attr || !key) return;
    const val = t(key);
    if (val != null) el.setAttribute(attr, val);
  });

  // data-i18n-json="<key>" — replace <script type="application/ld+json"> textContent
  // (key value should be a stringified JSON object in data.js)
  document.querySelectorAll('[data-i18n-json]').forEach((el) => {
    const key = el.getAttribute('data-i18n-json');
    const val = t(key);
    if (val != null) el.textContent = val;
  });

  // data-i18n-html="<key>" — set innerHTML, for strings that contain inline
  // markup (<em>, <strong>, <br>). Only use with values authored in data.js;
  // never with anything derived from user input.
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    const val = t(key);
    if (val != null) el.innerHTML = val;
  });

  // Update language toggle button — points at the NEXT language
  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.textContent = NEXT_LABEL[currentLang] || 'EN';
    btn.setAttribute('aria-label', TOGGLE_ARIA[currentLang] || '');
    btn.setAttribute('title', TOGGLE_ARIA[currentLang] || '');
  });
}

/* Public API */
export function getLang() { return currentLang; }

/**
 * Read #lang=… from the URL. Returns null if absent.
 *
 * Old links were shared with a hash like #lang=en. The hash means
 * nothing to a crawler, so it now means "go to that language's
 * address" rather than "swap the words on this page".
 */
function getHashLang() {
  if (typeof window === 'undefined') return null;
  const m = /#lang=([a-z]{2})/i.exec(window.location.hash || '');
  if (!m) return null;
  return SUPPORTED.includes(m[1]) ? m[1] : null;
}

/** Where each language's version of this page lives. */
function langUrls() {
  const raw = document.documentElement.getAttribute('data-lang-urls');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    return null;
  }
}

/* Auto-init: apply the page's language and honour an old #lang=… link. */
export function initI18n() {
  /* An old shared link may still carry #lang=xx. It used to mean
     "show me this language"; now it means "go to this language's
     address", so what the visitor lands on can be shared again. */
  const wanted = getHashLang();
  if (wanted && wanted !== currentLang) {
    const urls = langUrls();
    const to = urls && urls[wanted];
    if (to) {
      window.location.replace(to);
      return;
    }
  }

  applyToDOM();

  /* The language button is a link to the other language's address
     now, so there is nothing to intercept — the browser does it. */
}

/* Pick a localised field on an object.
   Tries `<keyBase>_<currentLang>` first, then zh, then en, then keyBase itself. */
export function pickByLang(obj, keyBase) {
  const order = [currentLang, 'zh', 'en'];
  for (const lang of order) {
    const v = obj[`${keyBase}_${lang}`];
    if (v != null && v !== '') return v;
  }
  return obj[keyBase] ?? '';
}

/* Same as pickByLang but prefers an explicit suffix list (e.g. _zh, _en, _ja). */
export function pickZhOrEn(obj, suffix = 'name') {
  return pickByLang(obj, suffix);
}
