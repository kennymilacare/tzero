#!/usr/bin/env node
/* ===========================================================
   gen-guide-og-images.mjs — a sharing picture for each guide.

   Every page of the site pointed at the same picture: the brand
   mark, with "T-ZERO 第九感" on it. When a guide is shared — on
   WhatsApp, on Facebook, on LINE — that is what the reader sees:
   the same picture they have seen four hundred times, saying
   nothing about the guide.

   Now each guide has a picture of its own, in the language of the
   page it belongs to: the eyebrow ("選購指南 · 紋路"), the
   heading, and the address. Eighteen of them — five guides and
   the list of them, in three languages.

   The pictures are drawn by a headless Chrome from a small HTML
   page, the same way scripts/gen-og-image.mjs draws the brand
   picture. They are written into the repository, so the site does
   not need a browser to be published.

   Run:  node scripts/gen-guide-og-images.mjs
   =========================================================== */

import { spawn } from 'node:child_process';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { findChrome } from './lib/chrome.mjs';
import { escapeText } from './lib/html.mjs';
import { GUIDES, GUIDE_HUB, GUIDE_UI, guideOgImagePath } from './lib/guides.mjs';
import { LANGS } from './lib/langs.mjs';
import { loadSite, ROOT } from './lib/site.mjs';

const WIDTH = 1200;
const HEIGHT = 630;
const OUT = path.join(ROOT, 'assets', 'images', 'og');

/* The colours of the brand picture — the same ones the site
   uses, so the guide pictures and the brand picture look like
   they came from the same place. */
const CREAM = '#F7EDE8';
const INK = '#2B1F18';
const MUTED = '#6E5944';
const LILAC = '#B584C8';
const SKY = '#86ABCA';

/** Run Chrome and wait for it to finish. */
function run(chrome, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Chrome exited with code ${code}\n${err.trim()}`));
    });
  });
}

/**
 * How big the heading should be.
 *
 * A heading is written for a page, where it can be three lines
 * long. Here it has to fit in two, so the longer it is the
 * smaller it is drawn — otherwise the Japanese headings, which
 * are the longest, run off the bottom of the picture.
 */
function titleSize(text) {
  const n = [...text].length;
  if (n <= 16) return 72;
  if (n <= 24) return 62;
  if (n <= 34) return 54;
  if (n <= 46) return 46;
  return 40;
}

/**
 * One picture, as a page of HTML for Chrome to draw.
 *
 * The picture is one flat colour with a rule down the side, so
 * that the PNG it becomes is small — the pictures are downloaded
 * by every social platform that shows a preview, and eighteen of
 * them are a lot of downloading.
 */
function cardHtml({ brand, eyebrow, title, foot }) {
  const size = titleSize(title);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    background: ${CREAM};
    color: ${INK};
    font-family: 'Inter', 'Microsoft JhengHei', 'PingFang HK', 'Noto Sans CJK TC',
                 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
    padding: 58px 68px 54px 84px;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .rule { position: absolute; left: 0; top: 0; width: 16px; height: ${HEIGHT}px; background: ${LILAC}; }
  .top { display: flex; justify-content: space-between; align-items: baseline; gap: 24px; }
  .brand { font-size: 34px; font-weight: 800; letter-spacing: 0.03em; white-space: nowrap; }
  .brand b { color: ${LILAC}; font-weight: 900; font-style: italic; }
  .eyebrow {
    font-size: 22px; font-weight: 700; letter-spacing: 0.10em;
    color: ${MUTED}; text-align: right; white-space: nowrap;
  }
  h1 {
    margin-top: auto;
    font-size: ${size}px;
    font-weight: 800;
    line-height: 1.26;
    letter-spacing: 0.01em;
    max-width: 1020px;
  }
  .foot {
    margin-top: auto;
    padding-top: 30px;
    display: flex; justify-content: space-between; align-items: baseline; gap: 24px;
  }
  .url { font-size: 24px; font-weight: 700; letter-spacing: 0.08em; color: ${SKY}; }
  .tag { font-size: 24px; font-weight: 600; color: ${MUTED}; text-align: right; }
</style></head>
<body>
  <div class="rule"></div>
  <div class="top">
    <div class="brand"><b>T-</b>ZERO ${escapeText(brand.replace(/^T-ZERO\s*/i, ''))}</div>
    <div class="eyebrow">${escapeText(eyebrow)}</div>
  </div>
  <h1>${escapeText(title)}</h1>
  <div class="foot">
    <div class="url">www.tzero-jp.com</div>
    <div class="tag">${escapeText(foot)}</div>
  </div>
</body></html>`;
}

/** The picture of one page, and where it is written to. */
function pictureFor(brand, eyebrow, title, foot) {
  return cardHtml({ brand, eyebrow, title, foot });
}

async function main() {
  const chrome = findChrome();
  if (!chrome) {
    console.error('\n[gen-guide-og-images] Chrome not found. Install Google Chrome, or set CHROME_PATH.\n');
    process.exit(1);
  }

  await mkdir(OUT, { recursive: true });
  await mkdir(path.join(tmpdir(), 'tzero-og'), { recursive: true });

  const { i18n } = await import('../assets/js/data.js');
  let written = 0;

  /* The five guides, and the page that lists them. */
  const pages = [
    ...GUIDES.map((g) => ({
      path: g.path,
      eyebrow: g.eyebrow,
      title: g.h1,
    })),
    {
      path: GUIDE_HUB.path,
      eyebrow: GUIDE_UI.hubEyebrow,
      title: GUIDE_UI.hubH1,
    },
  ];

  for (const page of pages) {
    for (const lang of LANGS) {
      const brand = i18n[lang]['seo.brand.name'];
      const eyebrow = (page.eyebrow[lang] || page.eyebrow.zh);
      const title = (page.title[lang] || page.title.zh);

      const html = pictureFor(brand, eyebrow, title, 'T-ZERO ・ NINTH SENSE');
      const tmp = path.join(tmpdir(), 'tzero-og', `${path.basename(page.path, '.html')}-${lang}.html`);
      await writeFile(tmp, html, 'utf8');

      const relative = guideOgImagePath(page.path, lang);
      const out = path.join(ROOT, relative);
      await run(chrome, [
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        `--window-size=${WIDTH},${HEIGHT}`,
        `--screenshot=${out}`,
        pathToFileURL(tmp).href,
      ]);

      const { size } = await stat(out);
      console.log(`[gen-guide-og-images] wrote ${relative} (${Math.round(size / 1024)} KB)`);
      written++;
    }
  }

  console.log(`[gen-guide-og-images] ${written} picture(s) written.`);
}

main().catch((err) => {
  console.error(`\n[gen-guide-og-images] ${err.stack || err.message}\n`);
  process.exit(1);
});
