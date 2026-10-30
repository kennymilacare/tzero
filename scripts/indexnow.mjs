#!/usr/bin/env node
/* ===========================================================
   indexnow.mjs — tell the search engines that can be told.

   The site is static and there is no account behind it, so there is
   no "submit this URL" button to press. IndexNow is the way out:
   it is a small POST to a public endpoint, it needs no login, and
   Bing and Yandex read it.

   This script writes the key file the search engine reads, and
   sends it the addresses that changed.

   Run: node scripts/indexnow.mjs             # what changed since the last commit
        node scripts/indexnow.mjs --all       # every address on the site
        node scripts/indexnow.mjs --write     # (re)write the key file
        node scripts/indexnow.mjs --dry-run   # show what would be sent
   =========================================================== */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';

import { allUrls, describeResponse, ENDPOINT, isSharedAsset, isValidKey, requestBody, urlsFor } from './lib/indexnow.mjs';
import { pageList } from './lib/pages.mjs';
import { loadSite, ROOT } from './lib/site.mjs';

const run = promisify(execFile);

const ARGS = process.argv.slice(2);
const ALL = ARGS.includes('--all');
const WRITE = ARGS.includes('--write');
const DRY = ARGS.includes('--dry-run');
const SHOW = ARGS.includes('--show');

/** The commit to compare against. */
function sinceRef() {
  const at = ARGS.indexOf('--since');
  if (at >= 0 && ARGS[at + 1]) return ARGS[at + 1];
  return 'HEAD~1';
}

/** The files that changed between two commits. */
async function changedFiles(ref) {
  try {
    const { stdout } = await run('git', ['diff', '--name-only', `${ref}..HEAD`], { cwd: ROOT });
    return stdout.split('\n').map((l) => l.trim()).filter(Boolean);
  } catch (e) {
    /* A shallow clone has no parent to compare against. That is not
       a reason to give up — it just means "everything". */
    return [];
  }
}

async function loadKey() {
  const file = path.join(ROOT, 'assets', 'data', 'indexnow.json');
  const raw = JSON.parse(await readFile(file, 'utf8'));
  return String(raw.key || '');
}

/** The key file has to be readable at the site root. */
async function writeKeyFile(key) {
  const names = await readdir(ROOT);
  const stale = names.filter((n) => /^[a-f0-9]{8,128}\.txt$/i.test(n) && n !== `${key}.txt`);

  for (const name of stale) {
    await unlink(path.join(ROOT, name));
    console.log(`[indexnow] removed the old key file ${name}`);
  }

  const file = path.join(ROOT, `${key}.txt`);
  await writeFile(file, key, 'utf8');
  console.log(`[indexnow] wrote ${key}.txt`);
}

async function main() {
  const site = await loadSite();
  if (!site.url) throw new Error('assets/data/site.json has no "url"');

  const key = await loadKey();
  if (!isValidKey(key)) {
    throw new Error(`assets/data/indexnow.json has no usable key ("${key}")`);
  }

  if (WRITE) {
    await writeKeyFile(key);
    if (!SHOW) return;
  }

  const list = pageList();

  /* A change to the stylesheet, the scripts or the images changes
     every page, so every address goes. Otherwise only the pages
     that show the changed file. */
  const changed = await changedFiles(sinceRef());
  const shared = changed.some(isSharedAsset);
  const urls = ALL || shared
    ? allUrls(list, site.url)
    : urlsFor(list, site.url, changed);

  if (SHOW) {
    console.log(`[indexnow] host        ${site.url}`);
    console.log(`[indexnow] key         ${key}`);
    console.log(`[indexnow] key file    https://${site.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}/${key}.txt`);
    console.log(`[indexnow] addresses   ${urls.length}`);
    for (const url of urls) console.log(`[indexnow]   ${url}`);
    return;
  }

  if (!urls.length) {
    console.log('[indexnow] nothing changed — nothing to send.');
    return;
  }

  const body = requestBody({ siteUrl: site.url, key, urlList: urls });

  if (DRY) {
    console.log('[indexnow] would send:');
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  console.log(`[indexnow] ${urls.length} address(es) sent — ${describeResponse(response.status, text)}`);
  for (const url of urls) console.log(`[indexnow]   ${url}`);

  if (!response.ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error(`\n[indexnow] ${e.stack || e.message}\n`);
  process.exit(1);
});
