/* ===========================================================
   The 404 page, checked the way a visitor meets it.

   GitHub Pages serves 404.html for any URL that does not exist.
   The browser then takes that URL as the base of every relative
   link on the page — so a page that names its files relatively
   sends the visitor to another missing page, every time. The
   stylesheet, the logo, the menu, all of it.

   This stands up a server that behaves the way GitHub Pages does,
   points a real browser at a missing path, and reads back both the
   rendered page and the list of files the page asked for. Every one
   of them has to exist.

   Run: node --test scripts/lib/notfound.test.mjs
   =========================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { findChrome } from './chrome.mjs';
import { ROOT } from './site.mjs';

const run = promisify(execFile);

/* The files the pages ask for, and what to say they are. */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'text/xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

/**
 * A server that behaves the way GitHub Pages does: the files are
 * served from the repository, and anything that is not there gets
 * 404.html with a 404 status.
 *
 * It also keeps a record of what was asked for, and how it was
 * answered — which is the thing worth checking.
 */
async function pagesLikeServer() {
  const asked = [];

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';

    const file = path.join(ROOT, rel);
    const inside = file.startsWith(ROOT) && rel !== '/404.html';

    if (inside) {
      try {
        const body = await readFile(file);
        const type = TYPES[path.extname(file)] || 'application/octet-stream';
        asked.push({ rel, status: 200 });
        res.writeHead(200, { 'content-type': type });
        res.end(body);
        return;
      } catch {
        /* not there — fall through to the 404 */
      }
    }

    asked.push({ rel, status: 404 });
    const body = await readFile(path.join(ROOT, '404.html'));
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  return {
    asked,
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/** Load a page in Chrome and hand back the DOM it rendered. */
async function render(chrome, url, profile) {
  const { stdout } = await run(chrome, [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profile}`,
    '--dump-dom',
    url,
  ], { maxBuffer: 40 * 1024 * 1024 });

  return stdout;
}

const CHROME = findChrome();

/* The page has to name its own base, or the browser will use the
   missing path as the base and every link on it will be missing
   too. And because the base may move to /en/ or /ja/ so that the
   visitor stays in their language, the files the page loads are
   named from the root — they are the same files in every language. */
test('the 404 page names its files from the root', async () => {
  const html = await readFile(path.join(ROOT, '404.html'), 'utf8');

  assert.match(html, /<base href="\/">/,
    'the 404 page does not set a base, so every relative link points at the missing path');

  const fromBeside = [...html.matchAll(/(?:href|src|srcset)="([^"]*)"/g)]
    .flatMap((m) => m[1].split(',').map((u) => u.trim().split(/\s+/)[0]))
    .filter((u) => u.startsWith('assets/'));

  assert.deepEqual(fromBeside, [],
    `the 404 page names these files from beside the page, but they live at the root: ${fromBeside.join(', ')}`);
});

test('the 404 page works when it is served for a missing path', {
  skip: CHROME ? false : 'Chrome is not installed, so the page cannot be rendered',
}, async () => {
  const server = await pagesLikeServer();
  const profile = await mkdtemp(path.join(tmpdir(), 'tzero-404-'));

  try {
    for (const [lang, folder, title] of [
      ['en', '/en/', 'Page not found'],
      ['ja', '/ja/', 'ページが見つかりません'],
      ['zh', '/', '找不到此頁'],
    ]) {
      server.asked.length = 0;

      /* A path that is not there, and not near anything either. */
      const url = `${server.origin}${folder}some/deep/missing/page.html`;
      const dom = await render(CHROME, url, profile);

      assert.match(dom, /<html[^>]*\blang="[^"]*"/,
        `${lang}: the 404 page has no language`);

      assert.match(dom, new RegExp(`<h1[^>]*>${title}</h1>`),
        `${lang}: the 404 page is not written in the language of the missing path`);

      /* The base moves with the language, so the links on the page
         lead back into it. */
      const base = dom.match(/<base href="([^"]*)"/)?.[1];
      assert.equal(base, folder === '/' ? '/' : folder,
        `${lang}: the base of the 404 page is ${base}, not ${folder}`);

      /* And the page asked for files that all exist. The one that
         answers 404 is the missing page itself — that is the point
         of it. */
      const broken = server.asked.filter((a) => a.status !== 200 && a.rel !== url.replace(server.origin, ''));
      assert.deepEqual(broken, [],
        `${lang}: the 404 page asked for files that are not there: ${broken.map((b) => b.rel).join(', ')}`);
    }
  } finally {
    await server.close();
    await rm(profile, { recursive: true, force: true });
  }
});
