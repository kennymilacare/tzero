#!/usr/bin/env node
/* ===========================================================
   sync-og-image.mjs — point every page at the Open Graph image.

   Facebook, X, LinkedIn, WhatsApp and WeChat do not accept an
   SVG as og:image. Until now every page pointed at og-image.svg,
   so a link to the site shared with no picture at all.

   This puts the rendered PNG (assets/images/og-image.png, made by
   gen-og-image.mjs) on every page, adds the size and type that
   the platforms like to see, and makes sure a page that has a
   Twitter card also has a Twitter image.

   Run: node scripts/sync-og-image.mjs
   =========================================================== */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { loadSite, ROOT } from './lib/site.mjs';

const IMAGE = 'assets/images/og-image.png';
const ALT = 'T-ZERO 第九感 — 日本玻尿酸安全套,即日送貨,保密包裝';
const INDENT = '  ';

/** The og:image line plus the size and type the platforms want. */
function ogBlock(url, indent) {
  return [
    `${indent}<meta property="og:image" content="${url}">`,
    `${indent}<meta property="og:image:width" content="1200">`,
    `${indent}<meta property="og:image:height" content="630">`,
    `${indent}<meta property="og:image:type" content="image/png">`,
    `${indent}<meta property="og:image:alt" content="${ALT}">`,
  ].join('\n');
}

function rewrite(text, url) {
  /* The files in this repo are a mix of CRLF and LF, so match against
     a normalised copy and put the original endings back afterwards. */
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lf = text.replace(/\r\n/g, '\n');
  let out = lf;

  /* The og:image line — replaced, along with anything that was
     sitting on the lines after it (an old width/height/type). */
  out = out.replace(
    /^[ \t]*<meta property="og:image"[^>]*>\n(?:[ \t]*<meta property="og:image:(?:width|height|type|alt)"[^>]*>\n)*/m,
    () => `${ogBlock(url, INDENT)}\n`,
  );

  /* The Twitter image, if the page has one. */
  if (/^[ \t]*<meta name="twitter:image"/m.test(out)) {
    out = out.replace(
      /^[ \t]*<meta name="twitter:image"[^>]*>/m,
      () => `${INDENT}<meta name="twitter:image" content="${url}">`,
    );
  } else if (/^[ \t]*<meta name="twitter:description"/m.test(out)) {
    /* The page has a Twitter card but no image — add one after the
       description, so a link shared on X is not a blank card. */
    out = out.replace(
      /^[ \t]*<meta name="twitter:description"[^>]*>\n/m,
      (m) => `${m}${INDENT}<meta name="twitter:image" content="${url}">\n`,
    );
  }

  return eol === '\r\n' ? out.replace(/\n/g, '\r\n') : out;
}

async function main() {
  const site = await loadSite();
  if (!site.url) {
    console.error('\n[sync-og-image] site.json has no "url".\n');
    process.exit(1);
  }
  const url = `${site.url}${IMAGE}`;

  const files = (await readdir(ROOT))
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(ROOT, f));

  let changed = 0;
  for (const file of files) {
    const before = await readFile(file, 'utf8');
    const after = rewrite(before, url);
    if (after === before) continue;
    await writeFile(file, after, 'utf8');
    changed++;
    console.log(`[sync-og-image] updated ${path.relative(ROOT, file)}`);
  }

  console.log(changed
    ? `[sync-og-image] ${changed} page(s) updated.`
    : '[sync-og-image] every page already points at the PNG.');
}

main().catch((e) => {
  console.error(`\n[sync-og-image] ${e.stack || e.message}\n`);
  process.exit(1);
});
