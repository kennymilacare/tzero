/* ===========================================================
   The checks that keep the SEO work from drifting.

   Most of the site's SEO lives in two places that have to agree:
   the markup a crawler reads and the structured data a rich
   result is built from. These tests are what stop them from
   drifting apart — a question edited in one place and not the
   other, a product page that forgets its price, a sitemap that
   lists a URL the site no longer has.

   Run: node --test scripts/lib/seo.test.mjs
   =========================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { products, productUrl, faqs, i18n } from '../../assets/js/data.js';
import { faqBlock, faqPageNode } from './seo.mjs';
import { ROOT } from './site.mjs';

const SITE = 'https://www.tzero-jp.com';
const LANGS = ['zh', 'en', 'ja'];

/* The pages the site publishes. 404.html is checked apart — it is
   the one page that asks not to be indexed. */
async function sitePages() {
  const files = await readdir(ROOT);
  return files.filter((f) => f.endsWith('.html'));
}

async function readPage(name) {
  const raw = await readFile(path.join(ROOT, name), 'utf8');
  return raw.replace(/\r\n/g, '\n');
}

/* The structured data of a page, as an object. */
function jsonLdOf(html) {
  const m = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(m, 'the page has no JSON-LD block');
  return JSON.parse(m[1]);
}

/* ---------- the FAQ ---------- */

test('the questions are in the markup, so a crawler can read them', async () => {
  const html = await readPage('index.html');
  assert.ok(
    html.includes(faqBlock(faqs)),
    'index.html does not hold the current FAQ — run: node scripts/gen-faq-html.mjs',
  );
});

test('the FAQ in the structured data is the FAQ on the page', () => {
  for (const lang of LANGS) {
    const graph = JSON.parse(i18n[lang]['seo.jsonld.home'])['@graph'];
    const faq = graph.find((n) => n['@type'] === 'FAQPage');
    assert.ok(faq, `${lang}: no FAQPage in the structured data`);
    assert.deepEqual(
      faq,
      faqPageNode(faqs, lang),
      `${lang}: the FAQPage does not match the questions in data.js`,
    );
  }
});

/* ---------- the business ---------- */

test('the business is described with an address and opening hours', () => {
  for (const lang of LANGS) {
    const graph = JSON.parse(i18n[lang]['seo.jsonld.home'])['@graph'];
    const shop = graph.find((n) => n['@type'] === 'LocalBusiness');
    assert.ok(shop, `${lang}: the business is not described as a LocalBusiness`);
    assert.equal(shop.address.streetAddress, '5/F, D.J. Building, No.173 Hoi Bun Road');
    assert.equal(shop.address.addressLocality, 'Kwun Tong');
    assert.equal(shop.address.addressRegion, 'Kowloon');
    assert.equal(shop.address.addressCountry, 'HK');

    const hours = shop.openingHoursSpecification;
    assert.ok(hours && hours.length, `${lang}: no opening hours`);
    assert.deepEqual(hours[0].dayOfWeek, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    assert.equal(hours[0].opens, '10:00');
    assert.equal(hours[0].closes, '18:00');
  }
});

/* ---------- the news ---------- */

test('the news list uses the term schema.org defines', () => {
  for (const lang of LANGS) {
    const graph = JSON.parse(i18n[lang]['seo.jsonld.news'])['@graph'];
    const list = graph.find((n) => n['@type'] === 'ItemList');
    assert.ok(list, `${lang}: no ItemList in the news structured data`);
    assert.equal(
      list.itemListOrder,
      'https://schema.org/ItemListOrderDescending',
      `${lang}: itemListOrder is not a schema.org term`,
    );
    assert.equal(list.numberOfItems, list.itemListElement.length);
    for (const item of list.itemListElement) {
      assert.equal(item['@type'], 'ListItem', `${lang}: the list holds something that is not a ListItem`);
      assert.ok(item.name, `${lang}: a list entry has no name`);
      assert.ok(item.url, `${lang}: a list entry has no url`);
    }
  }
});

test('the news list describes the posts the site shows', async () => {
  const feed = JSON.parse(await readFile(path.join(ROOT, 'assets', 'data', 'news.json'), 'utf8'));
  const graph = JSON.parse(i18n.zh['seo.jsonld.news'])['@graph'];
  const list = graph.find((n) => n['@type'] === 'ItemList');
  const urls = list.itemListElement.map((i) => i.url);

  for (const post of feed.posts.slice(0, 8)) {
    if (!post.permalink) continue;
    assert.ok(urls.includes(post.permalink), `the news list is missing ${post.permalink}`);
  }
});

/* ---------- the product pages ---------- */

test('every product has a page of its own', async () => {
  for (const product of products) {
    const file = productUrl(product.id);
    const html = await readPage(file);

    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="${SITE}/${file.replace('.', '\\.')}">`),
      `${file}: the canonical link does not point at this page`,
    );
    assert.ok(
      html.includes(`<body data-product-id="${product.id}">`),
      `${file}: the page does not say which product it is`,
    );

    const data = jsonLdOf(html);
    const node = data['@graph'].find((n) => n['@type'] === 'Product');
    assert.ok(node, `${file}: no Product in the structured data`);
    assert.equal(node.sku, product.id);
    assert.equal(node.url, `${SITE}/${file}`);
    assert.equal(node.offers.price, String(product.price_hkd));
    assert.equal(node.offers.priceCurrency, 'HKD');
    assert.equal(node.offers.availability, 'https://schema.org/InStock');
    assert.ok(node.aggregateRating && node.aggregateRating.ratingValue);
    assert.ok(node.review && node.review.length);

    const crumbs = data['@graph'].find((n) => n['@type'] === 'BreadcrumbList');
    assert.ok(crumbs, `${file}: no breadcrumb`);
    assert.equal(crumbs.itemListElement[crumbs.itemListElement.length - 1].item, `${SITE}/${file}`);
  }
});

test('no page still links to the old product query string', async () => {
  for (const file of await sitePages()) {
    const html = await readPage(file);
    assert.doesNotMatch(html, /product\.html\?id=/, `${file}: still links to product.html?id=`);
  }
});

/* ---------- every page ---------- */

test('every page tells a crawler what it is', async () => {
  for (const file of await sitePages()) {
    const html = await readPage(file);

    assert.match(html, /<title>[^<]+<\/title>/, `${file}: no title`);
    assert.match(html, /<meta name="description" content="[^"]+">/, `${file}: no description`);
    assert.match(html, /<link rel="canonical" href="https:\/\/www\.tzero-jp\.com\/[^"]*">/, `${file}: no canonical link`);
    assert.match(
      html,
      /<meta property="og:image" content="https:\/\/www\.tzero-jp\.com\/assets\/images\/og-image\.png">/,
      `${file}: the sharing image is not the raster one`,
    );
    assert.match(html, /<meta property="og:image:width" content="1200">/, `${file}: the sharing image has no width`);
    assert.match(html, /<meta property="og:image:height" content="630">/, `${file}: the sharing image has no height`);
    assert.doesNotMatch(html, /og:image"[^>]*\.svg/, `${file}: the sharing image is an SVG — social platforms cannot read those`);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/, `${file}: no Twitter card`);
  }
});

test('the pages that ask not to be indexed say so', async () => {
  const html = await readPage('404.html');
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
});

/* ---------- the structured data a crawler reads ---------- */

test('the structured data is in the markup, not only in the script', async () => {
  for (const file of await sitePages()) {
    const html = await readPage(file);

    for (const m of html.matchAll(
      /<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g,
    )) {
      const attrs = m[1];
      const body = m[2].trim();
      const key = attrs.match(/data-i18n-json="([^"]+)"/)?.[1];

      assert.ok(body.length > 0, `${file}: the structured data block is empty — run: node scripts/gen-jsonld.mjs`);
      let data;
      try {
        data = JSON.parse(body);
      } catch (e) {
        assert.fail(`${file}: the structured data is not valid JSON — ${e.message}`);
      }
      assert.ok(data['@graph'] || data['@type'], `${file}: the structured data has no nodes`);
      if (key) {
        const graph = JSON.parse(i18n.zh[key])['@graph'];
        assert.deepEqual(
          data['@graph'],
          graph,
          `${file}: the structured data does not match data.js["${key}"]`,
        );
      }
    }
  }
});

test('every page a crawler is told to read has structured data', async () => {
  for (const file of await sitePages()) {
    if (NOT_IN_SITEMAP.includes(file)) continue;
    const html = await readPage(file);
    const m = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    assert.ok(m, `${file}: no structured data at all`);
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch (e) {
      assert.fail(`${file}: the structured data is not valid JSON — ${e.message}`);
    }
    const graph = data['@graph'] || [data];
    assert.ok(graph.length > 0, `${file}: the structured data is empty`);
  }
});

/* ---------- the markup itself ---------- */

test('every page opens and closes the same number of divs', async () => {
  for (const file of await sitePages()) {
    const html = await readPage(file);
    const tag = /<div\b[^>]*>|<\/div>/g;
    let depth = 0;
    let lowest = 0;
    let match;
    while ((match = tag.exec(html)) !== null) {
      if (match[0] === '</div>') depth--;
      else depth++;
      if (depth < lowest) lowest = depth;
    }
    assert.equal(depth, 0, `${file}: ${depth} div(s) are never closed`);
    assert.equal(lowest, 0, `${file}: a </div> has no matching <div>`);
  }
});

/* ---------- the sitemap ---------- */

/* The pages that are published but must not be indexed: the error page
   and the old catch-all product page, whose products each have a page
   of their own. */
const NOT_IN_SITEMAP = ['404.html', 'product.html'];

test('the sitemap lists every page, and only pages that exist', async () => {
  const xml = (await readFile(path.join(ROOT, 'sitemap.xml'), 'utf8')).replace(/\r\n/g, '\n');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  assert.ok(!locs.some((u) => u.includes('?')), 'the sitemap still lists query-string URLs');

  for (const file of await sitePages()) {
    if (NOT_IN_SITEMAP.includes(file)) continue;
    const url = file === 'index.html' ? `${SITE}/` : `${SITE}/${file}`;
    assert.ok(locs.includes(url), `${file} is not in the sitemap`);
  }

  for (const loc of locs) {
    const file = loc.replace(`${SITE}/`, '');
    if (file === '') continue;
    assert.ok(
      (await readdir(ROOT)).includes(file),
      `the sitemap lists ${loc}, which does not exist`,
    );
  }
});

test('the pages that ask not to be indexed are not in the sitemap', async () => {
  const xml = (await readFile(path.join(ROOT, 'sitemap.xml'), 'utf8')).replace(/\r\n/g, '\n');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  for (const file of NOT_IN_SITEMAP) {
    assert.ok(!locs.includes(`${SITE}/${file}`), `${file} is in the sitemap but asks not to be indexed`);
    const html = await readPage(file);
    assert.match(html, /<meta name="robots" content="noindex,follow">/, `${file}: no noindex`);
  }
});

test('every page in the sitemap says when it last changed', async () => {
  const xml = (await readFile(path.join(ROOT, 'sitemap.xml'), 'utf8')).replace(/\r\n/g, '\n');
  const dates = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  assert.ok(dates.length, 'the sitemap has no lastmod');
  for (const date of dates) {
    assert.match(date, /^\d{4}-\d{2}-\d{2}$/, `lastmod is not a date: ${date}`);
  }
});
