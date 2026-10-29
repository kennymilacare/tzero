/* Unit tests for the pure feed helpers. No network, no credentials.
   Run: node --test scripts/lib/ */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyOverride,
  curatedPosts,
  deriveExcerpt,
  deriveTitle,
  pickImage,
  sortByDate,
  EXCERPT_MAX,
  TITLE_MAX,
} from './feed.mjs';

test('deriveTitle takes the first line and drops emoji', () => {
  assert.equal(deriveTitle('新裝上市 🎉\n第二行'), '新裝上市');
  assert.equal(deriveTitle('✨ Launch day ✨'), 'Launch day');
});

test('deriveTitle drops a leading hashtag', () => {
  assert.equal(deriveTitle('#Tzero 全新配方'), '全新配方');
});

test('deriveTitle drops trailing hashtags too', () => {
  // Instagram puts its hashtags at the end of the caption.
  assert.equal(deriveTitle('限時優惠 #Tzero #安全套'), '限時優惠');
  assert.equal(deriveTitle('#Tzero 限時優惠'), '限時優惠');
});

test('deriveExcerpt drops hashtags and bare links', () => {
  const text = '新裝上市 🎉\n全線產品換上全新包裝。\n#Tzero';
  const title = deriveTitle(text);
  assert.equal(title, '新裝上市');
  assert.equal(deriveExcerpt(text, title), '全線產品換上全新包裝。');
  assert.equal(deriveExcerpt('詳情 https://example.com/x #Tzero', '詳情'), '詳情');
});

test('deriveTitle returns empty when there is nothing usable', () => {
  assert.equal(deriveTitle(''), '');
  assert.equal(deriveTitle(null), '');
  assert.equal(deriveTitle('🎉🎉'), '');
});

test('deriveTitle truncates long first lines', () => {
  const long = '這是一段非常長的標題文字用來測試截斷功能是否正常運作';
  const out = deriveTitle(long);
  assert.equal(out.length, TITLE_MAX);
  assert.ok(out.endsWith('…'));
});

test('deriveExcerpt drops the line that became the title', () => {
  const msg = '正式登陸 HKTVmall\n全系列 4 款產品即日起上架,香港本地 1–2 個工作天送達。';
  assert.equal(deriveExcerpt(msg, '正式登陸 HKTVmall'), '全系列 4 款產品即日起上架,香港本地 1–2 個工作天送達。');
});

test('deriveExcerpt strips bare links', () => {
  assert.equal(deriveExcerpt('睇呢度 https://tzero.example.com/x 啦', ''), '睇呢度 啦');
});

test('deriveExcerpt truncates long bodies', () => {
  const out = deriveExcerpt('啊'.repeat(400), '');
  assert.equal(out.length, EXCERPT_MAX);
  assert.ok(out.endsWith('…'));
});

test('deriveExcerpt collapses newlines into spaces', () => {
  assert.equal(deriveExcerpt('一\n二\n三', ''), '一 二 三');
});

test('pickImage prefers full_picture, then attachments', () => {
  assert.equal(pickImage({ full_picture: 'https://a/1.jpg' }), 'https://a/1.jpg');
  assert.equal(
    pickImage({ attachments: { data: [{ media: { image: 'https://b/2.jpg' } }] } }),
    'https://b/2.jpg'
  );
  assert.equal(
    pickImage({ attachments: { data: [{ subattachments: { data: [{ image: 'https://c/3.jpg' }] } }] } }),
    'https://c/3.jpg'
  );
  assert.equal(pickImage({}), null);
  assert.equal(pickImage({ full_picture: '' }), null);
});

test('applyOverride copies every field except hidden', () => {
  const post = { id: '1', title: '原' };
  const out = applyOverride(post, { title_en: 'EN', hidden: true });
  assert.equal(out.title_en, 'EN');
  assert.equal(out.title, '原');
  assert.equal('hidden' in out, false);
  assert.equal(post.title_en, undefined, 'must not mutate the input');
});

test('curatedPosts keeps hand-written posts and drops hidden ones', () => {
  const overrides = {
    'curated-1': { title_zh: '登陸 HKTVmall', title_en: 'Now on HKTVmall' },
    'curated-2': { title_zh: '唔想見到' , hidden: true },
    'curated-3': { nothing: 'useful' },
  };
  const out = curatedPosts(overrides, 'https://www.facebook.com/Tzerohk');
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'curated-1');
  assert.equal(out[0].title_zh, '登陸 HKTVmall');
  assert.ok(out[0].permalink.startsWith('https://www.facebook.com/Tzerohk'));
});

test('sortByDate puts the newest post first', () => {
  const out = sortByDate([
    { id: 'a', datePublished: '2026-01-01' },
    { id: 'c', datePublished: '2026-12-01' },
    { id: 'b', datePublished: '2026-06-01' },
  ]);
  assert.deepEqual(out.map((p) => p.id), ['c', 'b', 'a']);
});
