/* The pure half of scripts/ig-fetch.mjs — the URL and date arithmetic
 * that decides what a post link means.
 *
 * Run: node --test scripts/lib/ig.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { cleanCaption, dateFromShortcode, mediaIdOf, parseArgs, postUrl, shortcodeOf } from './ig.mjs';

test('a share link still yields the post code', () => {
  assert.equal(shortcodeOf('https://www.instagram.com/p/De_a7-Yks0Z/?img_index=1'), 'De_a7-Yks0Z');
  assert.equal(shortcodeOf('https://www.instagram.com/p/De_a7-Yks0Z/'), 'De_a7-Yks0Z');
});

test('a named link yields the post code too', () => {
  assert.equal(shortcodeOf('https://www.instagram.com/tzerojp/p/De_a7-Yks0Z/'), 'De_a7-Yks0Z');
  assert.equal(shortcodeOf('https://www.instagram.com/tzerojp/reel/De_a7-Yks0Z/'), 'De_a7-Yks0Z');
});

test('a profile link is not a post', () => {
  assert.equal(shortcodeOf('https://www.instagram.com/tzerojp/'), null);
  assert.equal(shortcodeOf('https://example.com/p/De_a7-Yks0Z/'), null);
  assert.equal(shortcodeOf(''), null);
});

test('the post code carries the date', () => {
  // The post that seeded this file: published 2026-10-27, 16:24 Hong Kong time.
  assert.equal(dateFromShortcode('De_a7-Yks0Z'), '2026-10-27');
});

test('a code that is not a post code has no date', () => {
  assert.equal(dateFromShortcode(''), null);
  assert.equal(dateFromShortcode('not a code!'), null);
  assert.equal(dateFromShortcode('AAAA'), null); // 1969 — before Instagram
});

test('the media id behind a post code', () => {
  assert.equal(mediaIdOf('De_a7-Yks0Z'), '4017047863280454937');
  assert.equal(mediaIdOf(''), null);
  assert.equal(mediaIdOf('not a code!'), null);
});

test('postUrl builds the canonical link', () => {
  assert.equal(postUrl('tzerojp', 'De_a7-Yks0Z'), 'https://www.instagram.com/tzerojp/p/De_a7-Yks0Z/');
});

test('links are picked out of arguments and files', () => {
  const { urls, files } = parseArgs([
    'https://www.instagram.com/p/AAA/',
    'https://www.instagram.com/p/BBB/?img_index=2',
    '--file',
    'urls.txt',
  ]);
  assert.deepEqual(urls, [
    'https://www.instagram.com/p/AAA/',
    'https://www.instagram.com/p/BBB/?img_index=2',
  ]);
  assert.deepEqual(files, ['urls.txt']);
});

test('--login is a mode, not a link', () => {
  const { urls, files, login } = parseArgs(['--login']);
  assert.equal(login, true);
  assert.deepEqual(urls, []);
  assert.deepEqual(files, []);
  assert.equal(parseArgs(['https://x.test/p/A/']).login, false);
});

test('the account name is dropped off the top of the caption', () => {
  const raw = 'tzerojp\n\n【返工已經夠乾，拍拖想潤返啲 💧】\n\n覆唔完嘅訊息。';
  assert.equal(
    cleanCaption(raw, 'tzerojp'),
    '【返工已經夠乾，拍拖想潤返啲 💧】\n\n覆唔完嘅訊息。'
  );
});

test('the account name is dropped even when the embed does not name it', () => {
  const raw = 'tzerojp\n\n第一行\n第二行';
  assert.equal(cleanCaption(raw, ''), '第一行\n第二行');
});

test('a caption that starts with one word is left alone', () => {
  assert.equal(cleanCaption('Hello\n世界', ''), 'Hello\n世界');
  assert.equal(cleanCaption('Hello', ''), 'Hello');
});

test('a caption that opens with a handle mid-sentence is left alone', () => {
  const raw = '搵我哋 tzerojp 傾下';
  assert.equal(cleanCaption(raw, 'tzerojp'), raw);
});

test('an empty caption stays empty', () => {
  assert.equal(cleanCaption('', 'tzerojp'), '');
  assert.equal(cleanCaption(null, null), '');
});
