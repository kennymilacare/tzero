/* ===========================================================
   photos.js — the photographs, in the sizes the pages show them.

   The photographs on this site were stored at the size a camera
   took them: the product shots are 2048 pixels square, and the
   studded one weighed 880 KB. The catalogue shows that picture
   300 pixels wide and the product page 600 — so a visitor on a
   phone downloaded a photograph six times the size of the screen
   it went on, and the catalogue alone asked for 2.1 MB.

   Every photograph now comes in three widths and two formats:

     -320  -640  -1200     the widths the pages use
     .webp               what almost every browser asks for; the
                         same picture is about a third of the
                         weight of the .jpg
     .jpg                the same three widths, for the browsers
                         that do not take WebP

   The <picture> element offers the WebP first and falls back to
   the .jpg; the srcset lets the browser take the copy that suits
   the screen it is on. The width and height on the picture are
   there so the page does not jump while it loads.

   The originals stay where they are. They are what the structured
   data points at, and what a link to the photograph should give.

   The copies are written by scripts/compress-photos.py and kept in
   the repository, so the site can be published without a browser
   to draw them.

   Run: import { photoPicture } from './photos.js?v=1';
   =========================================================== */

/** The widths every photograph is made in. */
export const PHOTO_WIDTHS = [320, 640, 1200];

/**
 * The number in the file name of the copies.
 *
 * When a photograph is re-encoded the name stays the same, so the
 * number is what tells a browser the picture has changed.
 */
export const PHOTO_VERSION = 1;

/**
 * Where the photographs live.
 *
 * Only these are photographs. The logos, the icons, the sharing
 * pictures and the banners are not, and are left as they are.
 */
const PHOTO_FOLDERS = [
  'assets/images/products/',
  'assets/images/news/',
  'assets/images/couples/',
];

/**
 * How wide the picture is on the page, for each place it appears.
 *
 * The browser uses this to work out which copy to fetch: it takes
 * the width of the space the picture will fill, multiplied by the
 * number of pixels per inch on that screen.
 */
export const SIZES = {
  /* A card in the catalogue: half the width on a tablet, a third
     on a desktop, a whole screen on a phone. */
  card: '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1100px) 33vw, 300px',
  /* The picture on a product's own page. */
  detail: '(max-width: 900px) 100vw, 600px',
  /* The picture on a news card. */
  news: '(max-width: 768px) 100vw, 500px',
  /* The little picture beside a guide's heading. */
  thumb: '128px',
  /* A picture that fills a column. */
  wide: '(max-width: 768px) 100vw, 560px',
};

/** Whether a path names a photograph that has the smaller copies. */
export function isPhoto(path) {
  const p = String(path || '');
  if (!/\.(jpg|jpeg)$/i.test(p)) return false;
  return PHOTO_FOLDERS.some((folder) => p.includes(folder));
}

/** The name of one copy of a photograph. */
export function photoCopy(path, width, format) {
  const base = String(path).replace(/\.(jpg|jpeg)$/i, '');
  return `${base}-${width}.${format}`;
}

/** The list of copies of one format, for a srcset. */
export function photoSrcset(path, format) {
  return PHOTO_WIDTHS.map((w) => `${photoCopy(path, w, format)}?v=${PHOTO_VERSION} ${w}w`).join(', ');
}

function srcset(path, format) {
  return photoSrcset(path, format);
}

/**
 * The markup for one photograph.
 *
 * A path that is not a photograph comes back as a plain <img>, so
 * a caller does not have to know which is which.
 *
 *   photoPicture('assets/images/products/tzero-ultra-thin.jpg', {
 *     alt: 'T-ZERO 超薄裝',
 *     className: 'product-image',
 *     sizes: SIZES.card,
 *   })
 */
export function photoPicture(path, {
  alt = '',
  className = '',
  sizes = SIZES.wide,
  width = 1200,
  height = 1200,
  loading = 'lazy',
  priority = false,
  fetchpriority = '',
  decoding = 'async',
  attrs = {},
} = {}) {
  const parts = [];
  if (className) parts.push(`class="${className}"`);
  parts.push(`alt="${alt}"`);
  parts.push(`width="${width}"`);
  parts.push(`height="${height}"`);
  parts.push(`loading="${loading}"`);
  if (fetchpriority) parts.push(`fetchpriority="${fetchpriority}"`);
  else if (priority) parts.push('fetchpriority="high"');
  parts.push(`decoding="${decoding}"`);
  /* Anything else the page wants on the picture — the translation
     hook on the alt text, for one. */
  for (const [name, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    parts.push(`${name}="${value}"`);
  }

  if (!isPhoto(path)) {
    return `<img src="${path}" ${parts.join(' ')}>`;
  }

  return `<picture>`
    + `<source type="image/webp" srcset="${srcset(path, 'webp')}" sizes="${sizes}">`
    + `<img src="${photoCopy(path, 1200, 'jpg')}?v=${PHOTO_VERSION}"`
    + ` srcset="${srcset(path, 'jpg')}" sizes="${sizes}" ${parts.join(' ')}>`
    + `</picture>`;
}
