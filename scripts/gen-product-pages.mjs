/* ===========================================================
   gen-product-pages.mjs — one real page per product.

   Why this exists
   ---------------
   The site used to serve every product from product.html?id=… .
   All four URLs then carried the same canonical link, so a
   crawler had no way to tell that they were four different
   products — it would pick one and drop the rest.

   Now each product has its own file:

       product-extra-lub.html
       product-extended.html
       product-studded.html
       product-ultra-thin.html

   Each file carries its own title, description, canonical,
   Open Graph tags and Product structured data — written into
   the HTML, not swapped in by JavaScript — so the page is
   complete before a single script runs.

   These are the Chinese pages. The English and Japanese ones
   are written by scripts/gen-lang-pages.mjs, and both use the
   builders in scripts/lib/product-page.mjs, so the three
   versions of a product cannot drift apart.

   product.html stays as the template AND as the fallback for
   old links (product.html?id=…). The generator reads it, fills
   in the per-product bits and writes the four files.

   Run:  node scripts/gen-product-pages.mjs
   =========================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { products, productUrl } from '../assets/js/data.js';
import { translatePage } from './lib/langpage.mjs';
import { buildProductPage } from './lib/product-page.mjs';
import { loadSite, ROOT } from './lib/site.mjs';

const TEMPLATE = path.join(ROOT, 'product.html');

async function main() {
  const site = await loadSite();
  if (!site.url) throw new Error('[gen-product-pages] assets/data/site.json has no "url"');
  /* The files in this repo are a mix of CRLF and LF — match on LF. */
  const template = (await readFile(TEMPLATE, 'utf8')).replace(/\r\n/g, '\n');

  for (const p of products) {
    const file = productUrl(p.id);
    const built = buildProductPage(template, p, products, {
      siteUrl: site.url,
      lang: 'zh',
      file,
      productUrl,
      note: 'node scripts/gen-product-pages.mjs',
    });

    /* The language, the link to the other languages, and the
       Chinese words written into the file — the same treatment
       the other pages get from gen-lang-pages.mjs. */
    const html = translatePage(built.html, {
      siteUrl: site.url,
      lang: 'zh',
      path: file,
    });

    await writeFile(path.join(ROOT, file), html, 'utf8');
    console.log(`[gen-product-pages] wrote ${file}`);
  }
  console.log(`[gen-product-pages] ${products.length} product page(s) written.`);
}

main().catch((err) => {
  console.error(`\n[gen-product-pages] ${err.message}\n`);
  process.exit(1);
});
