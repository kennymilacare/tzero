/* The site's own address lives in assets/data/site.json. The first
   tests cover the arithmetic that moves it; the last one is the one
   that matters — no page, sitemap entry or robots.txt line may be
   left pointing at the old domain. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { baseOf, canonicalOf, firstLocOf, normalizeBase, rewriteText, sitemapOf } from './siteurl.mjs';
import { loadSite, ROOT } from './site.mjs';

test('what was typed becomes a base URL', () => {
  assert.equal(normalizeBase('tzerohk.com'), 'https://tzerohk.com/');
  assert.equal(normalizeBase('https://tzerohk.com'), 'https://tzerohk.com/');
  assert.equal(normalizeBase('https://tzerohk.com/blog'), 'https://tzerohk.com/blog/');
  assert.equal(normalizeBase('  https://x.com/  '), 'https://x.com/');
  assert.equal(normalizeBase(''), null);
  assert.equal(normalizeBase('ftp://x.com'), null);
});

test('the directory a page lives in comes from its URL', () => {
  assert.equal(baseOf('https://tzero.example.com/about.html'), 'https://tzero.example.com/');
  assert.equal(baseOf('https://tzero.example.com/'), 'https://tzero.example.com/');
  assert.equal(baseOf('https://kennymilacare.github.io/tzero/news.html'),
    'https://kennymilacare.github.io/tzero/');
  assert.equal(baseOf('not a url'), null);
});

test('only this site\'s own URLs move', () => {
  const html = '<link rel="canonical" href="https://old.com/about.html">' +
    '<a href="https://www.facebook.com/Tzerohk">fb</a>';
  const out = rewriteText(html, 'https://old.com/', 'https://new.com/');
  assert.match(out, /href="https:\/\/new\.com\/about\.html"/);
  assert.match(out, /facebook\.com\/Tzerohk/);
});

test('the trailing slash of the home page survives the move', () => {
  const out = rewriteText('https://old.com/', 'https://old.com/', 'https://new.com/');
  assert.equal(out, 'https://new.com/');
});

test('the address is read out of each kind of file', () => {
  assert.equal(canonicalOf('<link rel="canonical" href="https://x.com/a.html">'), 'https://x.com/a.html');
  assert.equal(canonicalOf('<p>no canonical here</p>'), null);
  assert.equal(firstLocOf('<urlset><url><loc>https://x.com/</loc></url></urlset>'), 'https://x.com/');
  assert.equal(sitemapOf('User-agent: *\nSitemap: https://x.com/sitemap.xml\n'), 'https://x.com/sitemap.xml');
  assert.equal(sitemapOf('nothing here'), null);
});

test('no page, sitemap or robots.txt is left on the old address', async () => {
  const site = await loadSite();
  assert.ok(site.url, 'site.json needs a "url"');

  const html = (await readdir(ROOT))
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(ROOT, f));

  const problems = [];
  const check = (rel, text, url) => {
    if (!url) return;
    if (!url.startsWith(site.url)) {
      problems.push(`${rel}: ${url} (expected it under ${site.url})`);
    }
  };

  for (const file of html) {
    const text = await readFile(file, 'utf8');
    check(path.relative(ROOT, file), text, canonicalOf(text));
  }

  const sitemap = await readFile(path.join(ROOT, 'sitemap.xml'), 'utf8');
  check('sitemap.xml', sitemap, firstLocOf(sitemap));

  const robots = await readFile(path.join(ROOT, 'robots.txt'), 'utf8');
  check('robots.txt', robots, sitemapOf(robots));

  assert.deepEqual(problems, [],
    `the site address drifted from assets/data/site.json:\n  ${problems.join('\n  ')}\n` +
    'Run: node scripts/set-site-url.mjs <the address in site.json>');
});
