/* ===========================================================
   scripts/lib/images.mjs — the pictures each page shows.

   A sitemap may name the pictures that belong to a page. Google
   reads that list as "these are the pictures on this page", which
   is how a product shot reaches the image results instead of
   only the page it happens to sit on. A brand whose pictures are
   never named is a brand that shows up in Google Images only by
   accident.

   The titles are the pictures' own descriptions, written in the
   page's own language — the same words the picture carries in its
   alt attribute, so a crawler is told the same thing twice and
   the two can never disagree.

   Reads the news feed from disk; touches nothing else.
   =========================================================== */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { i18n, productUrl, products } from '../../assets/js/data.js';
import { GUIDES, GUIDE_HUB, guideOgImagePath } from './guides.mjs';
import { ROOT } from './site.mjs';

/* The picture every page carries, and the logo. */
const OG_IMAGE = 'assets/images/og-image.png';
const LOGO = 'assets/images/brand/t-zero-logo.png';
const BANNER = 'assets/images/banners/carousel/Tzero_website_banner-1600.jpg';

/* The two pictures the About page flips between. */
const ABOUT_IMAGES = [
  { path: 'assets/images/products/hyaluronic-acid.jpg', alt: 'about.brand.img1alt' },
  { path: 'assets/images/products/lubricant-comparison.jpg', alt: 'about.brand.img2alt' },
];

/** The brand's name in one language. */
function brandName(lang) {
  return i18n[lang]['seo.brand.name'];
}

/** A product's own picture description, in one language. */
function productAlt(product, lang) {
  return product[`image_alt_${lang}`] || product.image_alt_zh || brandName(lang);
}

/** The posts the news pages show. */
async function newsPosts() {
  const raw = await readFile(path.join(ROOT, 'assets/data/news.json'), 'utf8');
  const data = JSON.parse(raw);
  return Array.isArray(data.posts) ? data.posts : [];
}

/**
 * The pictures one page shows.
 *
 * `path` is the page's path inside the site root — '' for the home
 * page. `lang` is the language the page is in.
 */
export async function imagesFor(path, lang) {
  const brand = brandName(lang);

  /* The sharing picture of this page. The guides have one of their
     own — their own heading, in their own language — and every other
     page keeps the brand picture. */
  const guide = GUIDES.find((g) => g.path === path);
  const isHub = path === GUIDE_HUB.path;
  const sharing = guide || isHub
    ? {
        path: guideOgImagePath(path, lang),
        title: `${brand} ${guide ? (guide.short[lang] || guide.short.zh) : ''}`.trim(),
      }
    : { path: OG_IMAGE, title: brand };

  const images = [sharing];

  /* The home page: the banner, the logo, and the four products in
     the featured grid. */
  if (path === '') {
    images.push({ path: LOGO, title: brand });
    images.push({ path: BANNER, title: brand });
    for (const product of products) {
      images.push({ path: product.image, title: productAlt(product, lang) });
    }
    return images;
  }

  /* The products page: all four products. */
  if (path === 'products.html') {
    for (const product of products) {
      images.push({ path: product.image, title: productAlt(product, lang) });
    }
    return images;
  }

  /* A product page: that product, and nothing else. */
  const product = products.find((p) => productUrl(p.id) === path);
  if (product) {
    images.push({ path: product.image, title: productAlt(product, lang) });
    return images;
  }

  /* The About page: the two infographics it flips between, and the
     four products it compares. */
  if (path === 'about.html') {
    for (const image of ABOUT_IMAGES) {
      images.push({ path: image.path, title: i18n[lang][image.alt] || brand });
    }
    for (const p of products) {
      images.push({ path: p.image, title: productAlt(p, lang) });
    }
    return images;
  }

  /* A guide page: the picture the guide is about, and the picture
     the guide is shared under — the one with its own heading on it,
     which is what a search engine and a chat app both show. */
  if (guide) {
    images.push({ path: guide.image, title: `${brand} ${guide.short[lang] || guide.short.zh}` });
    return images;
  }

  /* The list of the guides: the sharing picture of that page. */
  if (isHub) {
    return images;
  }

  /* The news page: the pictures the posts carry. */
  if (path === 'news.html') {
    for (const post of await newsPosts()) {
      if (!post.image || !post.image.startsWith('assets/')) continue;
      images.push({ path: post.image, title: post[`title_${lang}`] || post.title || brand });
    }
    return images;
  }

  /* Contact and terms: the one picture every page carries. */
  return images;
}
