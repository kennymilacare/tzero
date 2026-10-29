/* ===========================================================
   i18n.js — language switcher bound to data-i18n attributes.
   Supports zh, en, ja. Falls back to zh, then to en, then key.
   =========================================================== */

import { i18n } from './data.js?v=22';

const STORAGE_KEY = 'tzero.lang';
const DEFAULT_LANG = 'zh';
const SUPPORTED = ['zh', 'en', 'ja'];
const NEXT_LANG = { zh: 'en', en: 'ja', ja: 'zh' };

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

function getStoredLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(v) ? v : DEFAULT_LANG;
  } catch (e) {
    return DEFAULT_LANG;
  }
}

function setStoredLang(lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
}

/* Sync the URL hash to reflect the active language, e.g. #lang=en.
   Only writes if it would actually change (avoids history spam). */
function syncUrlHash(lang) {
  if (typeof window === 'undefined' || !window.history) return;
  const want = '#lang=' + lang;
  if (window.location.hash === want) return;
  try {
    history.replaceState(null, '', window.location.pathname + window.location.search + want);
  } catch (e) { /* ignore */ }
}

/* Read #lang=… from the URL on initial load. Returns null if absent. */
function getHashLang() {
  if (typeof window === 'undefined') return null;
  const m = /#lang=([a-z]{2})/i.exec(window.location.hash || '');
  if (!m) return null;
  return SUPPORTED.includes(m[1]) ? m[1] : null;
}

let currentLang = getStoredLang() || getHashLang() || DEFAULT_LANG;

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

export function setLang(lang) {
  if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
  if (lang === currentLang) return;
  currentLang = lang;
  setStoredLang(lang);
  syncUrlHash(lang);
  applyToDOM();
  document.dispatchEvent(new CustomEvent('lang:change', { detail: { lang } }));
}

/* Cycle to the next supported language. */
export function cycleLang() {
  setLang(NEXT_LANG[currentLang] || DEFAULT_LANG);
}

/* Auto-init: bind language toggle buttons and apply current lang. */
export function initI18n() {
  // If the URL has a #lang=… override, sync storage + hash once on init.
  const hashLang = getHashLang();
  if (hashLang && hashLang !== currentLang) {
    currentLang = hashLang;
    setStoredLang(hashLang);
  } else {
    syncUrlHash(currentLang);
  }
  applyToDOM();
  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.addEventListener('click', cycleLang);
  });
  // React to back/forward navigation that changes the hash.
  window.addEventListener('hashchange', () => {
    const l = getHashLang();
    if (l && l !== currentLang) setLang(l);
  });
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
