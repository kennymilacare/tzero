/* ===========================================================
   The checks that keep the punctuation the same everywhere.

   The site is written in three languages: Traditional Chinese for
   Hong Kong, English, and Japanese. Each of them has its own
   habits — Chinese writes its commas full-width and its brackets
   full-width, English writes them narrow, Japanese writes a comma
   as 、 and its brackets full-width.

   What none of them has is a habit of mixing two of them inside
   one sentence. A Chinese line with a half-width comma in the
   middle of it, a full-width bracket next to a narrow one, a
   Japanese sentence with an English comma in it. The reader does
   not notice; the reader just feels that the page was assembled
   out of pieces.

   The rule itself is in scripts/lib/punctuation.mjs. This test
   says two things about it:

     1. it does what it says it does — the marks come out the
        right way round for each language, and the things that
        are not prose (the clock, the URL, the English name
        inside a Chinese sentence) are left alone;

     2. it is a fixed point — the copy that is on disk already
        satisfies it. A file that would still change is a file
        somebody has to sweep again, and one that is not swept
        is a file whose marks drift apart from the rest of the
        site.

   Run: node --test scripts/lib/punctuation.test.mjs
   =========================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import {
  convertText,
  convertHtml,
  convertJs,
  convertJson,
  languageOf,
  pageLanguage,
  COPY_FILES,
} from './punctuation.mjs';
import { ROOT } from './site.mjs';

const CONVERTERS = { html: convertHtml, js: convertJs, json: convertJson };

/** Every page the site serves, in every language. */
async function everyPage() {
  const files = [];
  for (const name of (await readdir(ROOT)).filter((n) => n.endsWith('.html'))) {
    files.push(name);
  }
  for (const dir of ['en', 'ja']) {
    const inner = await readdir(path.join(ROOT, dir)).catch(() => []);
    for (const name of inner.filter((n) => n.endsWith('.html'))) {
      files.push(`${dir}/${name}`);
    }
  }
  return files.sort();
}

/* ---------- the rule ---------- */

test('Chinese writes its marks full-width', () => {
  assert.equal(
    convertText('第九感,共有 4 款產品; 潤滑度: 100%; (日本製造) 你好嗎? 不!'),
    '第九感，共有 4 款產品；潤滑度：100%；（日本製造）你好嗎？不！',
  );
});

test('a Chinese full stop is a Chinese full stop', () => {
  assert.equal(convertText('第九感. 第九感'), '第九感。第九感');
});

test('Japanese writes a comma as 、 and its brackets full-width', () => {
  assert.equal(
    convertText('これは,4モデルです(日本製)。'),
    'これは、4モデルです（日本製）。',
  );
});

test('English writes its marks narrow', () => {
  assert.equal(
    convertText('Fourth, it is soft; and thin: yes (really)! ok?'),
    'Fourth, it is soft; and thin: yes (really)! ok?',
  );
});

test('the language is worked out from the writing itself', () => {
  assert.equal(languageOf('これは、4モデル'), 'ja');
  assert.equal(languageOf('第九感'), 'zh');
  assert.equal(languageOf('Fourth sense'), 'en');
  assert.equal(languageOf('12345'), null);
  /* The katakana middle dot is a mark, not a letter: a Chinese line
     that uses it is still Chinese. */
  assert.equal(languageOf('水溶性・易清洗'), 'zh');
});

test('a page is written in one language, and the page decides', () => {
  const zh = '<html lang="zh-HK"><body><p>水溶性・易清洗</p></body></html>';
  const ja = '<html lang="ja-JP"><body><p>月曜〜金曜：10:00</p></body></html>';
  assert.equal(convertHtml(zh), '<html lang="zh-HK"><body><p>水溶性·易清洗</p></body></html>');
  /* The Japanese page keeps the wave dash it was written with. */
  assert.equal(convertHtml(ja), ja);
});

test('a JSON file says what language each part of it is in', () => {
  const src = '{"ja": {"h1": "利用規約・細則"}, "zh": {"h1": "水溶性・易清洗"}}';
  assert.equal(convertJson(src), '{"ja": {"h1": "利用規約・細則"}, "zh": {"h1": "水溶性·易清洗"}}');
});

/* ---------- the things that are not prose ---------- */

test('the clock keeps its colon', () => {
  assert.equal(convertText('我們 10:00 開始,唔好遲到'), '我們 10:00 開始，唔好遲到');
});

test('a number keeps its thousands separator', () => {
  assert.equal(convertText('售價 1,000 元'), '售價 1,000 元');
});

test('a URL is left whole', () => {
  const url = 'https://www.tzero-jp.com/en/guides.html?a=1&b=2';
  assert.equal(convertText(`請睇 ${url}`), `請睇 ${url}`);
});

test('an English name inside a Chinese sentence keeps English marks', () => {
  assert.equal(
    convertText('T-ZERO 第九感 — D.J. Building, No.173 Hoi Bun Road, Kwun Tong'),
    'T-ZERO 第九感 — D.J. Building, No.173 Hoi Bun Road, Kwun Tong',
  );
});

test('a mark between a word and a Chinese character follows the page', () => {
  /* A letter on one side and a digit on the other is not an English
     phrase — 「HK$128,24小時」 is two Chinese clauses. */
  assert.equal(convertText('HK$128,24 小時落單'), 'HK$128，24 小時落單');
});

test('the ellipsis is two characters, and stays two', () => {
  assert.equal(convertText('第九感…'), '第九感……');
  assert.equal(convertText('第九感……'), '第九感……');
});

/* ---------- the copy on disk ---------- */

test('the copy on disk already satisfies the rule', async () => {
  const offenders = [];

  for (const [file, kind] of COPY_FILES) {
    const before = await readFile(path.join(ROOT, file), 'utf8');
    const after = CONVERTERS[kind](before);
    if (before === after) continue;

    const a = before.split('\n');
    const b = after.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] === b[i]) continue;
      offenders.push(`${file}:${i + 1}\n      - ${(a[i] ?? '').trim()}\n      + ${(b[i] ?? '').trim()}`);
    }
  }

  assert.equal(
    offenders.length,
    0,
    `the punctuation of these lines is not the way the rule says it should be — run node scripts/fix-punctuation.mjs --write:\n    ${offenders.join('\n    ')}`,
  );
});

test('the rule is a fixed point: running it twice changes nothing', async () => {
  for (const [file, kind] of COPY_FILES) {
    const before = await readFile(path.join(ROOT, file), 'utf8');
    const once = CONVERTERS[kind](before);
    const twice = CONVERTERS[kind](once);
    assert.equal(twice, once, `${file}: the rule does not settle — it keeps changing the file`);
  }
});

/* ---------- the pages ---------- */

test('a page knows its own language', async () => {
  const files = await everyPage();
  for (const file of files) {
    const html = await readFile(path.join(ROOT, file), 'utf8');
    const lang = pageLanguage(html);
    assert.ok(lang, `${file}: the page does not say what language it is in`);
    const dir = file.includes('/') ? file.split('/')[0] : '';
    if (dir === 'en') assert.equal(lang, 'en', `${file}: the page says it is in English`);
    if (dir === 'ja') assert.equal(lang, 'ja', `${file}: the page says it is in Japanese`);
  }
});

test('every page on the site already satisfies the rule', async () => {
  const offenders = [];

  for (const file of await everyPage()) {
    const before = await readFile(path.join(ROOT, file), 'utf8');
    const after = convertHtml(before);
    if (before === after) continue;

    const a = before.split('\n');
    const b = after.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] === b[i]) continue;
      offenders.push(`${file}:${i + 1}\n      - ${(a[i] ?? '').trim()}\n      + ${(b[i] ?? '').trim()}`);
    }
  }

  assert.equal(
    offenders.length,
    0,
    `the punctuation of these lines is not the way the rule says it should be — run node scripts/fix-punctuation.mjs --write:\n    ${offenders.join('\n    ')}`,
  );
});
