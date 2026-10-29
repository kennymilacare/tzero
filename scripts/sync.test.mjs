/* End-to-end test for scripts/sync-facebook.mjs.
 *
 * No credentials and no internet: the script's FB_GRAPH_BASE is pointed at a
 * local server that answers like graph.facebook.com, so the whole run —
 * token exchange, feed pull, Instagram pull, image download, overrides,
 * pinning, pruning — is exercised for real.
 *
 * Run: node --test scripts/
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const WORK = path.join(ROOT, '.tmp-test');

const PAGE_ID = '12345';
const IG_ID = 'ig999';
const IMAGE_BYTES = await readFile(path.join(ROOT, 'assets/images/brand/watsons-logo.png'));

/* ---------- the mock Graph API ---------- */

function mockServer() {
  return createServer((req, res) => {
    // The port is only known once the server is listening, so build the
    // public base URL from the request itself.
    const base = `http://${req.headers.host}`;
    const url = new URL(req.url, base);
    const p = url.pathname;
    const json = (obj) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(obj));
    };

    if (p.startsWith('/img/')) {
      res.writeHead(200, { 'content-type': 'image/png' });
      return res.end(IMAGE_BYTES);
    }
    if (p.includes('/me/accounts')) {
      return json({
        data: [{ id: PAGE_ID, name: 'T-ZERO 第九感', access_token: 'page-token-from-user-token' }],
      });
    }
    if (p.endsWith('/feed')) {
      return json({
        data: [
          {
            id: 'fb-1',
            message: '新裝上市 🎉\n全線產品換上全新包裝。',
            permalink_url: 'https://www.facebook.com/Tzerohk/posts/fb-1',
            created_time: '2026-10-20T08:00:00+0800',
            full_picture: `${base}/img/fb1.png`,
          },
          {
            id: 'fb-2',
            message: '第二則貼文',
            permalink_url: 'https://www.facebook.com/Tzerohk/posts/fb-2',
            created_time: '2026-10-18T08:00:00+0800',
          },
          {
            id: 'fb-hidden',
            message: '應該被隱藏',
            created_time: '2026-10-19T08:00:00+0800',
          },
        ],
      });
    }
    if (p.endsWith('/media')) {
      return json({
        data: [
          {
            id: '17890000000000001',
            caption: '限時優惠 #Tzero\n即日起全線產品買一送一。',
            permalink: 'https://www.instagram.com/tzerohk/p/17890000000000001/',
            timestamp: '2026-10-21T10:00:00+0800',
            media_type: 'IMAGE',
            media_url: `${base}/img/ig1.png`,
          },
          {
            id: '17890000000000002',
            caption: '新系列預告',
            permalink: 'https://www.instagram.com/tzerohk/p/17890000000000002/',
            timestamp: '2026-10-19T10:00:00+0800',
            media_type: 'VIDEO',
            media: { thumbnail_url: `${base}/img/ig2.png` },
          },
        ],
      });
    }
    if (p.endsWith(`/${PAGE_ID}`)) {
      return json({
        id: PAGE_ID,
        instagram_business_account: { id: IG_ID, username: 'tzerohk' },
      });
    }
    json({ error: { code: 404, message: 'not mocked', type: 'GraphMethodException' } });
  });
}

/* ---------- run the script against the mock ---------- */

async function runSync(env = {}) {
  await rm(WORK, { recursive: true, force: true });
  await mkdir(path.join(WORK, 'assets/data'), { recursive: true });
  await cp(path.join(ROOT, 'scripts'), path.join(WORK, 'scripts'), { recursive: true });

  // Hand-written overrides: a curated post, a pinned post, a hidden post.
  await writeFile(
    path.join(WORK, 'assets/data/news.local.json'),
    JSON.stringify({
      posts: {
        'curated-1': { title_zh: '登陸 HKTVmall', title_en: 'Now on HKTVmall', datePublished: '2026-09-15' },
        'fb-2': { pinned: true, title_en: 'Pinned second post' },
        'fb-hidden': { hidden: true },
      },
    }),
    'utf8'
  );

  // The previous run's feed — holds the post that has scrolled past the limit.
  await writeFile(
    path.join(WORK, 'assets/data/news.json'),
    JSON.stringify({
      updatedAt: '2026-10-01T00:00:00.000Z',
      source: 'facebook',
      page: { id: PAGE_ID, url: 'https://www.facebook.com/Tzerohk' },
      posts: [
        {
          id: 'fb-old',
          permalink: 'https://www.facebook.com/Tzerohk/posts/fb-old',
          datePublished: '2026-08-01',
          title: '舊貼文',
          message: '舊貼文',
          excerpt: '舊貼文',
          image: 'assets/images/news/fb-old.png',
          source: 'Facebook',
        },
      ],
    }),
    'utf8'
  );

  const server = mockServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const child = spawn(process.execPath, [path.join(WORK, 'scripts/sync-facebook.mjs')], {
    env: {
      ...process.env,
      FB_GRAPH_BASE: base,
      FB_PAGE_ID: PAGE_ID,
      FB_USER_TOKEN: 'user-token',
      FB_POST_LIMIT: '8',
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => { stdout += d; });
  child.stderr.on('data', (d) => { stderr += d; });
  const code = await new Promise((resolve) => child.on('close', resolve));

  const out = code === 0 ? JSON.parse(await readFile(path.join(WORK, 'assets/data/news.json'), 'utf8')) : null;
  server.close();
  return { code, stdout, stderr, out, work: WORK };
}

test('the sync pulls Facebook and Instagram posts into news.json', async () => {
  const { code, stdout, stderr, out } = await runSync();
  assert.equal(code, 0, `script failed:\n${stdout}\n${stderr}`);
  assert.ok(out, 'news.json was not written');

  const ids = out.posts.map((p) => p.id);
  assert.ok(ids.includes('fb-1'), 'Facebook post missing');
  assert.ok(ids.includes('ig-17890000000000001'), 'Instagram post missing');
  assert.ok(ids.includes('ig-17890000000000002'), 'Instagram video post missing');
  assert.ok(ids.includes('curated-1'), 'curated post was dropped');
  assert.ok(!ids.includes('fb-hidden'), 'hidden post was not dropped');
});

test('posts are sorted newest first', async () => {
  const { out } = await runSync();
  const dates = out.posts.map((p) => p.datePublished);
  assert.deepEqual(dates, [...dates].sort().reverse());
});

test('a title and excerpt are derived from the caption', async () => {
  const { out } = await runSync();
  const fb = out.posts.find((p) => p.id === 'fb-1');
  assert.equal(fb.title, '新裝上市');
  assert.equal(fb.excerpt, '全線產品換上全新包裝。');

  const ig = out.posts.find((p) => p.id === 'ig-17890000000000001');
  assert.equal(ig.title, '限時優惠');
  assert.equal(ig.source, 'Instagram');
});

test('an Instagram card follows the profile, not the Facebook page', async () => {
  const { out } = await runSync();
  const ig = out.posts.find((p) => p.id === 'ig-17890000000000001');
  assert.equal(ig.followUrl, 'https://www.instagram.com/tzerohk/');
});

test('images are downloaded into the repo instead of hotlinked', async () => {
  const { out, work } = await runSync();
  const fb = out.posts.find((p) => p.id === 'fb-1');
  assert.equal(fb.image, 'assets/images/news/fb-1.png');
  assert.ok(fb.image.startsWith('assets/images/news/'), 'the image must be a local path');

  const bytes = await readFile(path.join(work, 'assets/images/news/fb-1.png'));
  assert.ok(bytes.length > 1024, 'the downloaded image is suspiciously small');

  // The Instagram video falls back to its thumbnail.
  const ig = out.posts.find((p) => p.id === 'ig-17890000000000002');
  assert.equal(ig.image, 'assets/images/news/ig-17890000000000002.png');
});

test('a pinned post that scrolled past the feed limit is kept', async () => {
  const { out } = await runSync();
  const ids = out.posts.map((p) => p.id);
  assert.ok(ids.includes('fb-2'), 'the pinned post disappeared');
  const pinned = out.posts.find((p) => p.id === 'fb-2');
  assert.equal(pinned.title_en, 'Pinned second post');
});

test('the page token is derived from the user token', async () => {
  const { stdout } = await runSync();
  assert.match(stdout, /page: T-ZERO 第九感/);
  assert.match(stdout, /instagram: @tzerohk/);
});

test('the script fails loudly when no token is set', async () => {
  const { code, stderr } = await runSync({ FB_USER_TOKEN: '', FB_PAGE_TOKEN: '' });
  assert.equal(code, 1);
  assert.match(stderr, /FB_PAGE_TOKEN|FB_USER_TOKEN/);
});

test.after(async () => {
  await rm(WORK, { recursive: true, force: true });
});
