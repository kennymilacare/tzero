/* ===========================================================
   The checks for the Google Analytics 4 tag.

   The measurement id lives in assets/data/site.json and is written
   into every page by scripts/set-ga4.mjs. These tests are what
   stop a page from being left out, and the id from being written
   one way in the data file and another way in the pages.

   Run: node --test scripts/lib/ga4.test.mjs
   =========================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { ga4IdIn, GA4_END, GA4_START } from './ga4.mjs';
import { ROOT, SITE_FILE } from './site.mjs';

/** Every page the site publishes. */
async function sitePages() {
  const files = await readdir(ROOT);
  const out = files.filter((f) => f.endsWith('.html'));
  for (const dir of ['en', 'ja']) {
    const inner = await readdir(path.join(ROOT, dir)).catch(() => []);
    for (const f of inner) {
      if (f.endsWith('.html')) out.push(`${dir}/${f}`);
    }
  }
  return out;
}

test('every page carries the same measurement id', async () => {
  const site = JSON.parse(await readFile(SITE_FILE, 'utf8'));
  const id = String(site.ga4 || '');

  for (const file of await sitePages()) {
    const html = await readFile(path.join(ROOT, file), 'utf8');
    const found = ga4IdIn(html);
    assert.equal(found, id,
      `${file}: carries ${found || 'no measurement id'}, and site.json says ${id || 'none'}`);
  }
});

test('every page has one block, and it is the same block', async () => {
  for (const file of await sitePages()) {
    const html = await readFile(path.join(ROOT, file), 'utf8');
    const starts = html.split(GA4_START).length - 1;
    const ends = html.split(GA4_END).length - 1;
    assert.equal(starts, 1, `${file}: ${starts} GA4 blocks`);
    assert.equal(ends, 1, `${file}: ${ends} GA4 blocks`);
  }
});

test('the tag sits under the Tag Manager, so they share the data layer', async () => {
  for (const file of await sitePages()) {
    const html = await readFile(path.join(ROOT, file), 'utf8');
    const gtm = html.indexOf('gtm.js?id=GTM-PP683QV4');
    const ga4 = html.indexOf(GA4_START);
    assert.ok(gtm >= 0, `${file}: no Tag Manager`);
    assert.ok(ga4 > gtm, `${file}: the Analytics tag is not under the Tag Manager`);
  }
});
