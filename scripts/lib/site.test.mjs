/* Every social link on the site must point at the account named in
   assets/data/site.json. The site is static, so a link that drifts
   from that file stays wrong until somebody notices — this test is
   what notices. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { loadSite, usernameOf, ROOT } from './site.mjs';

async function siteFiles() {
  const html = (await readdir(ROOT))
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(ROOT, f));
  return [...html, path.join(ROOT, 'assets', 'js', 'data.js'), path.join(ROOT, 'assets', 'js', 'news.js')];
}

test('every social link matches assets/data/site.json', async () => {
  const site = await loadSite();
  const fb = usernameOf(site.facebook);
  const ig = usernameOf(site.instagram);
  assert.ok(fb, 'site.json needs a facebook URL');
  assert.ok(ig, 'site.json needs an instagram URL');

  const problems = [];

  for (const file of await siteFiles()) {
    const text = await readFile(file, 'utf8');
    const rel = path.relative(ROOT, file);

    for (const m of text.matchAll(/https?:\/\/(?:www\.)?facebook\.com\/([A-Za-z0-9._-]+)/gi)) {
      if (m[1] !== fb) problems.push(`${rel}: facebook handle "${m[1]}" (expected "${fb}")`);
    }
    for (const m of text.matchAll(/https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._-]+)/gi)) {
      if (m[1] !== ig) problems.push(`${rel}: instagram handle "${m[1]}" (expected "${ig}")`);
    }
    for (const m of text.matchAll(/Instagram\s*·\s*@([A-Za-z0-9._-]+)/g)) {
      if (m[1] !== ig) problems.push(`${rel}: label "@${m[1]}" (expected "@${ig}")`);
    }
  }

  assert.deepEqual(problems, [],
    `social links drifted from assets/data/site.json:\n  ${problems.join('\n  ')}\n` +
    'Run: node scripts/sync-social-links.mjs');
});

test('site.json holds reachable-looking URLs', async () => {
  const site = await loadSite();
  assert.match(site.facebook, /^https:\/\/(www\.)?facebook\.com\/[^/]+$/);
  assert.match(site.instagram, /^https:\/\/(www\.)?instagram\.com\/[^/]+$/);
});
