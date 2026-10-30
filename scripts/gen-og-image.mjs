#!/usr/bin/env node
/* ===========================================================
   gen-og-image.mjs — render the Open Graph image.

   Why this exists
   ---------------
   Facebook, X, LinkedIn, WhatsApp and WeChat do not accept an
   SVG as og:image. Until now every page pointed at og-image.svg,
   so a link to the site shared with no picture at all.

   This renders that same SVG into a 1200x630 PNG — the size every
   platform asks for — using a headless Chrome, which is already
   a dependency of the site (ig-fetch.mjs uses it too).

   Run:  node scripts/gen-og-image.mjs
   =========================================================== */

import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { stat } from 'node:fs/promises';
import path from 'node:path';

import { findChrome } from './lib/chrome.mjs';
import { ROOT } from './lib/site.mjs';

const SVG = path.join(ROOT, 'assets', 'images', 'og-image.svg');
const PNG = path.join(ROOT, 'assets', 'images', 'og-image.png');
const WIDTH = 1200;
const HEIGHT = 630;

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

async function main() {
  const chrome = findChrome();
  if (!chrome) {
    console.error('\n[gen-og-image] Chrome not found. Install Google Chrome, or set CHROME_PATH.\n');
    process.exit(1);
  }

  await run(chrome, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${WIDTH},${HEIGHT}`,
    `--screenshot=${PNG}`,
    pathToFileURL(SVG).href,
  ]);

  const { size } = await stat(PNG);
  console.log(`[gen-og-image] wrote assets/images/og-image.png (${WIDTH}x${HEIGHT}, ${Math.round(size / 1024)} KB)`);
}

main().catch((err) => {
  console.error(`\n[gen-og-image] ${err.message}\n`);
  process.exit(1);
});
