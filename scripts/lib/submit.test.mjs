/* ===========================================================
   The checks that keep the site findable.

   Two things tell a search engine that a site exists and that it
   has changed:

     · the verification token, which says "this site is mine";
     · IndexNow, which says "these pages are new or different".

   Both are easy to break quietly. A key file that is not at the
   site root, or a token that is on one home page and not the other
   two, means the search engine quietly ignores the site and
   nobody is told why.

   Run: node --test scripts/lib/submit.test.mjs
   =========================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import { allUrls, hostOf, isSharedAsset, isValidKey, keyLocation, requestBody, urlsFor } from './indexnow.mjs';
import { pageList } from './pages.mjs';
import { BING_META, GOOGLE_META, HOME_PAGES, setBlock, tokenIn } from './verification.mjs';
import { loadSite, ROOT } from './site.mjs';

async function there(file) {
  return access(path.join(ROOT, file)).then(() => true, () => false);
}

async function readKey() {
  const raw = JSON.parse(await readFile(path.join(ROOT, 'assets', 'data', 'indexnow.json'), 'utf8'));
  return String(raw.key || '');
}

async function readVerification() {
  const raw = JSON.parse(await readFile(path.join(ROOT, 'assets', 'data', 'site.json'), 'utf8'));
  const v = raw.verification || {};
  return { google: String(v.google || ''), bing: String(v.bing || '') };
}

async function readPage(file) {
  return (await readFile(path.join(ROOT, file), 'utf8')).replace(/\r\n/g, '\n');
}

/* ---------- IndexNow ---------- */

test('the IndexNow key is one a search engine will accept', async () => {
  const key = await readKey();
  assert.ok(isValidKey(key), `the key "${key}" is not 8 to 128 hex characters`);
});

test('the key file, when it is there, holds the key', async () => {
  /* The file is built when the site is published, so it is not in the
     repository. When it is there — on a machine that has published
     the site — it has to hold the key, or IndexNow is refused. */
  const key = await readKey();
  const file = `${key}.txt`;

  if (!await there(file)) return;

  const text = (await readFile(path.join(ROOT, file), 'utf8')).trim();
  assert.equal(text, key, `${file} does not contain the key`);
});

test('the site is published with the key file, so IndexNow is not refused', async () => {
  /* The search engine fetches the key from the site root over HTTP.
     If the file is not there when the site goes out, every
     submission comes back refused. */
  const workflow = await readFile(path.join(ROOT, '.github', 'workflows', 'deploy-pages.yml'), 'utf8');

  const write = workflow.indexOf('indexnow.mjs --write');
  const publish = workflow.indexOf('Prepare the site');

  assert.ok(write >= 0, 'the deploy does not write the key file');
  assert.ok(publish >= 0, 'the deploy does not publish the site');
  assert.ok(write < publish, 'the key file is written after the site is published');
});

test('the key file is reachable at the address we tell the search engine', async () => {
  const site = await loadSite();
  const key = await readKey();

  assert.equal(hostOf(site.url), 'www.tzero-jp.com', 'the host is not what the key file is served from');
  assert.equal(keyLocation(site.url, key), `https://www.tzero-jp.com/${key}.txt`);
});

test('the request names the host, the key and the addresses', async () => {
  const site = await loadSite();
  const key = await readKey();
  const urls = allUrls(pageList(), site.url);

  const body = requestBody({ siteUrl: site.url, key, urlList: urls });

  assert.equal(body.host, 'www.tzero-jp.com');
  assert.equal(body.key, key);
  assert.equal(body.keyLocation, `https://www.tzero-jp.com/${key}.txt`);
  assert.equal(body.urlList.length, 30, 'the site has 30 addresses — 10 pages in 3 languages');
});

test('every address we send belongs to the site', async () => {
  const site = await loadSite();
  const urls = allUrls(pageList(), site.url);

  for (const url of urls) {
    assert.ok(url.startsWith(`${site.url.replace(/\/+$/, '')}/`), `${url} is not on this site`);
  }
});

test('a changed file brings the pages that show it', async () => {
  const site = await loadSite();
  const list = pageList();

  /* The feed is shown by the news pages and by the home page. */
  const news = urlsFor(list, site.url, ['assets/data/news.json']);
  assert.ok(news.includes(`${site.url}news.html`), 'the news page is not in the list');
  assert.ok(news.includes(`${site.url}en/news.html`), 'the English news page is not in the list');
  assert.ok(news.includes(`${site.url}ja/news.html`), 'the Japanese news page is not in the list');

  /* The catalogue is shown by the product pages and by the catalog. */
  const products = urlsFor(list, site.url, ['assets/js/data.js']);
  assert.ok(products.includes(`${site.url}products.html`), 'the catalog is not in the list');
  assert.ok(products.includes(`${site.url}en/product-ultra-thin.html`), 'the English product page is not in the list');
  assert.ok(!products.includes(`${site.url}about.html`), 'the about page does not show the catalogue');

  /* A page that did not change is not sent. */
  const about = urlsFor(list, site.url, ['about.html']);
  assert.deepEqual(about, [`${site.url}about.html`]);
});

test('a change to the stylesheet or the scripts changes every page', async () => {
  /* The stylesheet, the scripts and the images are on every page, so
     a change to any of them means every address has to be sent —
     not just the ones that happen to show the file. */
  for (const file of [
    'assets/css/layout.css',
    'assets/js/data.js',
    'assets/js/main.js',
    'assets/images/og-image.png',
    'assets/data/site.json',
  ]) {
    assert.ok(isSharedAsset(file), `${file} is on every page but is not treated as shared`);
  }

  for (const file of ['index.html', 'news.html', 'assets/data/news.json', 'docs/seo.md']) {
    assert.ok(!isSharedAsset(file), `${file} is not on every page but is treated as shared`);
  }
});

/* ---------- the verification token ---------- */

test('the three home pages carry the same verification token', async () => {
  const { google, bing } = await readVerification();

  for (const file of HOME_PAGES) {
    const html = await readPage(file);

    if (google) {
      assert.equal(
        tokenIn(html, GOOGLE_META), google,
        `${file}: the Google token is missing or different`,
      );
    }
    if (bing) {
      assert.equal(
        tokenIn(html, BING_META), bing,
        `${file}: the Bing token is missing or different`,
      );
    }
  }
});

test('a token that is set is not still sitting in the placeholder', async () => {
  const { google, bing } = await readVerification();
  if (!google && !bing) return;

  for (const file of HOME_PAGES) {
    const html = await readPage(file);
    assert.ok(
      !html.includes('PASTE_TOKEN_HERE'),
      `${file}: the placeholder is still there as well as the real token`,
    );
  }
});

test('a verification token is not a Facebook token', async () => {
  const { google, bing } = await readVerification();

  /* A verification token is not a secret — it is meant to be read by
     the search engine on a public page. The Facebook token and the
     app secret live in GitHub Secrets and nowhere else, and they do
     not look like this. */
  for (const token of [google, bing]) {
    if (!token) continue;
    assert.ok(
      !token.startsWith('EAA') && !/^[0-9]{15,}$/.test(token),
      'that looks like a Facebook token, not a verification token',
    );
  }
});

/* ---------- putting the token in ---------- */

test('the token goes into the page, and comes back out again', async () => {
  const html = await readPage('index.html');

  const withToken = setBlock(html, 'abc123DEF456ghi789JKL', '');
  assert.equal(tokenIn(withToken, GOOGLE_META), 'abc123DEF456ghi789JKL');
  assert.equal(tokenIn(withToken, BING_META), '');

  /* Taking it away leaves a placeholder again, and no trace of the
     token that was there. */
  const without = setBlock(withToken, '', '');
  assert.equal(tokenIn(without, GOOGLE_META), '');
  assert.ok(!without.includes('abc123DEF456ghi789JKL'), 'the token is still in the page');
  assert.ok(without.includes('PASTE_TOKEN_HERE'), 'the placeholder is gone too');
});

test('both tokens can be set at once', async () => {
  const html = await readPage('index.html');
  const both = setBlock(html, 'google-token', 'bing-token');

  assert.equal(tokenIn(both, GOOGLE_META), 'google-token');
  assert.equal(tokenIn(both, BING_META), 'bing-token');
});

test('writing the token twice gives the same page', async () => {
  const html = await readPage('index.html');
  const once = setBlock(html, 'a-token', 'b-token');
  const twice = setBlock(once, 'a-token', 'b-token');

  assert.equal(once, twice, 'the block changes when it is written again');
});

test('one token on its own does not lose the other', async () => {
  const html = await readPage('index.html');

  /* Google alone, then Bing alone, then both — the page has to end
     up carrying both. */
  const googleOnly = setBlock(html, 'g-token', '');
  const bingOnly = setBlock(html, '', 'b-token');
  const both = setBlock(googleOnly, 'g-token', 'b-token');

  assert.equal(tokenIn(bingOnly, BING_META), 'b-token');
  assert.equal(tokenIn(bingOnly, GOOGLE_META), '');
  assert.equal(tokenIn(both, GOOGLE_META), 'g-token');
  assert.equal(tokenIn(both, BING_META), 'b-token');
});
