/* End-to-end test for scripts/manual-post.mjs.
 *
 * No credentials, no internet: the script is run against a scratch copy of
 * the data folder, so the real feed is never touched.
 *
 * Run: node --test scripts/manual-post.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const WORK = path.join(ROOT, '.tmp-manual-test');

/**
 * Run the manual script in a scratch copy of the repo.
 * `manual` is the content of assets/data/manual.json; `local` the content of
 * assets/data/news.local.json.
 */
async function run(manual, local = { posts: {} }) {
  await rm(WORK, { recursive: true, force: true });
  await mkdir(path.join(WORK, 'assets/data'), { recursive: true });
  await mkdir(path.join(WORK, 'assets/images/news'), { recursive: true });
  await cp(path.join(ROOT, 'scripts'), path.join(WORK, 'scripts'), { recursive: true });
  // The script reads the site's accounts from site.json.
  await cp(path.join(ROOT, 'assets/data/site.json'), path.join(WORK, 'assets/data/site.json'));

  await writeFile(path.join(WORK, 'assets/data/manual.json'), JSON.stringify(manual, null, 2), 'utf8');
  await writeFile(path.join(WORK, 'assets/data/news.local.json'), JSON.stringify(local, null, 2), 'utf8');

  const child = spawn(process.execPath, [path.join(WORK, 'scripts/manual-post.mjs')], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => { stdout += d; });
  child.stderr.on('data', (d) => { stderr += d; });
  const code = await new Promise((resolve) => child.on('close', resolve));

  const out = await readFile(path.join(WORK, 'assets/data/news.json'), 'utf8');
  const localOut = await readFile(path.join(WORK, 'assets/data/news.local.json'), 'utf8');
  return {
    code,
    stdout,
    stderr,
    feed: JSON.parse(out),
    local: JSON.parse(localOut),
  };
}

const ONE_POST = {
  posts: [
    {
      date: '2026-10-28',
      text: '新裝上市 🎉\n全線產品換上全新包裝。\n#Tzero',
      url: 'https://www.facebook.com/Tzerohk/posts/1234567890',
      image: 'assets/images/banners/carousel/11.png',
    },
  ],
};

test('a pasted caption becomes a card with a derived title and excerpt', async () => {
  const { code, feed } = await run(ONE_POST);
  assert.equal(code, 0);
  assert.equal(feed.posts.length, 1);

  const post = feed.posts[0];
  assert.equal(post.title, '新裝上市');
  assert.equal(post.excerpt, '全線產品換上全新包裝。');
  assert.equal(post.datePublished, '2026-10-28');
  assert.equal(post.source, 'Facebook');
  assert.equal(post.permalink, 'https://www.facebook.com/Tzerohk/posts/1234567890');
});

test('the same URL always gets the same id, so re-running updates instead of duplicating', async () => {
  const first = await run(ONE_POST);
  const second = await run(ONE_POST);
  assert.equal(first.feed.posts[0].id, second.feed.posts[0].id);

  // A different URL is a different post.
  const other = await run({
    posts: [{ date: '2026-10-28', text: '另一則', url: 'https://www.facebook.com/Tzerohk/posts/999' }],
  });
  assert.notEqual(other.feed.posts[0].id, first.feed.posts[0].id);
});

test('an Instagram post follows the profile, not the post', async () => {
  const { feed } = await run({
    posts: [{
      date: '2026-10-24',
      text: '限時優惠',
      url: 'https://www.instagram.com/tzerohk/p/17890000000000001/',
      source: 'Instagram',
    }],
  });
  const post = feed.posts[0];
  assert.equal(post.source, 'Instagram');
  assert.equal(post.followUrl, 'https://www.instagram.com/tzerohk/');
});

test('curated posts are kept alongside the manual ones', async () => {
  const { feed } = await run(ONE_POST, {
    posts: {
      'curated-hktv-launch': { title_zh: '正式登陸 HKTVmall', source: 'HKTVmall', follow: false },
    },
  });
  assert.equal(feed.posts.length, 2);
  const ids = feed.posts.map((p) => p.id);
  assert.ok(ids.includes('curated-hktv-launch'), 'the curated post was dropped');
  assert.ok(ids.some((id) => id.startsWith('manual-')), 'the manual post is missing');
});

test('with no manual posts the feed is empty, so the built-in cards stay', async () => {
  const { feed, stdout } = await run({ posts: [] });
  assert.equal(feed.posts.length, 0);
  assert.match(stdout, /built-in cards/);
});

test('the posts are written back into news.local.json so a later sync keeps them', async () => {
  const { local } = await run(ONE_POST);
  const entry = Object.values(local.posts)[0];
  assert.equal(entry.title_zh, '新裝上市');
  assert.equal(entry.excerpt_zh, '全線產品換上全新包裝。');
  assert.equal(entry.pinned, true);
});

test('a post the user deletes really disappears', async () => {
  const first = await run(ONE_POST);
  const staleId = first.feed.posts[0].id;

  // Run again with the same overrides but an empty manual file.
  const second = await run({ posts: [] }, first.local);
  assert.equal(second.feed.posts.length, 0);
  assert.equal(second.local.posts[staleId], undefined);
});

test.after(async () => {
  await rm(WORK, { recursive: true, force: true });
});
