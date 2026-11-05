/* ===========================================================
   The checks that keep the Japanese honest.

   The Japanese on this site is written by a machine, and a
   machine writes Japanese with a slip now and then: a Korean
   syllable where a Japanese one belongs, a Cyrillic letter in
   the middle of a sentence, a character that did not survive
   the journey. The result looks almost right — which is exactly
   why it has to be caught by a script and not by the eye.

   The guides have their own check (scripts/lib/guide.test.mjs).
   This one covers the whole site: every published page in every
   language, and the Japanese words that live in the data file.

   Run: node --test scripts/lib/japanese.test.mjs
   =========================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { i18n } from '../../assets/js/data.js';
import { GUIDES } from './guides.mjs';
import { LANGS, PAGES, pageFile } from './langs.mjs';
import { ROOT } from './site.mjs';

/* The writing systems that must not turn up where they do not
   belong. Japanese uses kanji, which look like Chinese, so kanji
   on its own is not a mistake — but Hangul and Cyrillic in a
   Japanese sentence always are. */
const HANGUL = /[ᄀ-ᇿ㄰-㆏ꥠ-꥿가-힯]/;
const CYRILLIC = /[Ѐ-ӿԀ-ԯ]/;
/* The sign of a character that was cut in half somewhere. */
const BROKEN = /�/;

/* The Chinese forms of characters — the ones modern Japanese does
   not use at all. Japanese and Chinese share most of their kanji,
   so a Chinese word written with the Chinese form of the character
   slips through: 工藝 for 工芸, 該 for 该, 溫 for 温. The eye
   reads it as Japanese and moves on; a script does not.

   Only the forms Japanese never uses are listed here. Characters
   that are ordinary Japanese (較 in 比較, 該 in 該当する, 個 in
   10個入り, 擇 in 選択, 龍 in 九龍) are deliberately absent. */
const CHINESE_FORM = new Set([
  '产', '價', '醫', '檢', '專', '內', '們', '說', '這', '麼', '樣', '對',
  '賣', '錢', '惠', '驗', '證', '學', '讓', '從', '經', '給', '幫', '發', '關',
  '錄', '訊', '總', '濟', '戶', '儲', '匯', '輛', '窗', '樓', '廚', '廳', '藥',
  '鋪', '產', '實', '轉', '傳', '邊', '訂', '註', '譯', '讀', '變', '讚', '豐',
  '貓', '賠', '賺', '贊', '贏', '趕', '輔', '輕', '遙', '邁', '鄉', '鄰', '釋',
  '銳', '鐵', '閒', '閱', '闆', '闊', '隨', '雙', '雜', '雞', '靈', '靜', '顆',
  '顏', '飄', '髮', '鬥', '鬧', '鴻', '鵝', '麥', '黃', '黴', '黨', '齊', '齒',
  '龜', '續', '覺', '觀', '嗎', '呢', '呀', '哦', '啦', '嘛', '喲', '咯', '咩',
  '嘞', '兒', '澤', '賴', '覽', '樂', '遲', '擇', '單', '滯', '觸', '圖', '聽',
  '德', '腦', '拜', '廢', '濱', '佛', '辨', '滿', '譽', '搖', '齡', '曆', '歷',
  '鍊', '灣', '獸', '兩', '縣', '歸', '舊', '舉', '峽', '圈', '效', '廣', '劑',
  '權', '險', '鹽', '濕', '縱', '肅', '處', '聲', '增', '彈', '晝', '鑄', '稻',
  '蠻', '拂', '謠', '藝', '溫', '淨', '顯', '絕', '綠', '繼', '缺', '聯',
  '眾', '裝', '裡', '襯', '籃', '籌', '粵', '糧', '國', '辭',
  '來', '萬', '與', '劃', '厲', '參', '敘', '斷', '曬', '條', '歐', '歲', '氣',
  '沒', '獎', '獨', '當', '穩', '臺', '號', '羅', '倆', '壓', '壞', '妝',
  '寢', '將', '尋', '屆', '巖', '徵', '懷', '戀', '揀', '撿', '擺', '攝', '數',
  '會', '瀏', '爐', '爭', '牆', '疊', '盜', '睜', '矯', '礙', '禮', '竄', '綢',
  '繩', '纖', '臟', '蟲', '遞', '鍾', '霸', '韻', '鄒', '醞', '髒', '鬆', '鹹',
  '麵', '龐', '餘', '爾',
]);

/* ---------- helpers ---------- */

async function readPage(name) {
  const raw = await readFile(path.join(ROOT, name), 'utf8');
  return raw.replace(/\r\n/g, '\n');
}

/** Every page the site publishes, in every language. */
async function sitePages() {
  const out = [];
  for (const dir of ['', 'en', 'ja']) {
    const inner = await readdir(path.join(ROOT, dir)).catch(() => []);
    for (const name of inner) {
      if (name.endsWith('.html')) out.push(`${dir}/${name}`);
    }
  }
  return out.sort();
}

/* ---------- the pages ---------- */

test('no page has a character from another language in it', async () => {
  for (const file of await sitePages()) {
    const html = await readPage(file);

    for (const [name, pattern] of [['Hangul', HANGUL], ['Cyrillic', CYRILLIC], ['broken', BROKEN]]) {
      const hit = html.match(pattern);
      assert.equal(hit, null,
        `${file}: there is a ${name} character in it — "${hit && hit[0]}"`);
    }
  }
});

test('the Japanese pages are written in Japanese', async () => {
  /* A page that was never translated still reads perfectly well —
     it is Chinese, or English, and the eye may not catch it at a
     glance. What it will not have is kana, and kana are what make
     a Japanese sentence. */
  const KANA = /[぀-ゟ゠-ヿ]/;

  for (const page of PAGES) {
    const file = pageFile('ja', page.path);
    const html = await readPage(file);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, ' ');

    assert.ok(KANA.test(text), `ja/${page.path || 'index.html'}: there is no kana in it`);
  }
});

/* ---------- the words in the data file ---------- */

test('the Japanese in the data file is Japanese', () => {
  const strings = [];
  for (const [key, value] of Object.entries(i18n.ja)) {
    strings.push([`i18n.ja["${key}"]`, String(value)]);
  }

  for (const [where, text] of strings) {
    for (const [name, pattern] of [['Hangul', HANGUL], ['Cyrillic', CYRILLIC], ['broken', BROKEN]]) {
      const hit = text.match(pattern);
      assert.equal(hit, null,
        `${where}: there is a ${name} character in it — "${hit && hit[0]}"`);
    }
  }
});

/* ---------- the words that are Chinese ---------- */

/** Every string under a "ja" key, however deep it is. */
function japaneseWords(value, out = []) {
  if (value == null || typeof value === 'string') return out;
  if (Array.isArray(value)) {
    value.forEach((v) => japaneseWords(v, out));
    return out;
  }
  if (typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      if (key === 'ja' && typeof v === 'string') out.push(v);
      else japaneseWords(v, out);
    }
  }
  return out;
}

/** The Chinese characters in a piece of writing. */
function chineseIn(text) {
  const found = new Set();
  for (const ch of String(text)) {
    if (CHINESE_FORM.has(ch)) found.add(ch);
  }
  return [...found];
}

test('the Japanese words are not Chinese words', () => {
  /* The news list is the one place where Chinese is right. The posts
     are written in Chinese, the Japanese page shows them as they
     were posted, and the structured data says what the page says. */
  const skipped = new Set(['seo.jsonld.news']);

  const strings = [];
  for (const [key, value] of Object.entries(i18n.ja)) {
    if (skipped.has(key)) continue;
    strings.push([`i18n.ja["${key}"]`, String(value)]);
  }
  for (const guide of GUIDES) {
    japaneseWords(guide).forEach((s, i) => strings.push([`guide ${guide.slug}[${i}]`, s]));
  }

  for (const [where, text] of strings) {
    const found = chineseIn(text);
    assert.equal(found.length, 0,
      `${where}: "${found.join('", "')}" — a Chinese form of the character, where Japanese writes it differently`);
  }
});

test('the Japanese pages have no Chinese words in them', async () => {
  for (const page of PAGES) {
    const file = pageFile('ja', page.path);
    const html = await readPage(file);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, ' ');

    const found = chineseIn(text);
    assert.equal(found.length, 0,
      `ja/${page.path || 'index.html'}: "${found.join('", "')}" — a Chinese form of the character, where Japanese writes it differently`);
  }
});

/* ---------- the languages are all there ---------- */

test('every language has the same keys', () => {
  const keys = LANGS.map((lang) => Object.keys(i18n[lang]).sort().join('|'));
  for (const lang of LANGS) {
    assert.equal(Object.keys(i18n[lang]).sort().join('|'), keys[0],
      `${lang}: the keys are not the same as the other languages`);
  }
});
