/* ===========================================================
   scripts/lib/sitemap.mjs — what the sitemap should say.

   The sitemap is written to disk by scripts/update-sitemap.mjs,
   but the words in it are worked out here, so that a test can ask
   "is the file on disk the same as what the script would write?"
   without writing anything.

   The date of a page is the day it was last changed, according to
   git — so the file on disk and the file the script would write
   can only differ if somebody edited it by hand.
   =========================================================== */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { imagesFor } from './images.mjs';
import { alternates, pageUrl } from './langs.mjs';
import { pageList } from './pages.mjs';
import { ROOT } from './site.mjs';

const run = promisify(execFile);

/** XML needs these five characters written out. */
function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** The day a file was last changed, according to git. */
export async function changedOn(file) {
  try {
    const { stdout } = await run('git', ['log', '-1', '--format=%cs', '--', file], { cwd: ROOT });
    const date = stdout.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  } catch (e) {
    return null;
  }
}

/** The newest of several dates — or today, if git cannot say. */
export async function lastmodOf(files) {
  const dates = (await Promise.all(files.map(changedOn))).filter(Boolean);
  if (!dates.length) return new Date().toISOString().slice(0, 10);
  return dates.sort().pop();
}

/** The sitemap, as text. */
export function render(list, base) {
  const entries = list.map((entry) => {
    const loc = pageUrl(base, entry.lang, entry.path);
    /* The other two languages of this very page, and the Chinese
       one as the default. */
    const links = alternates(base, entry.path)
      .map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>`)
      .join('\n');
    /* The pictures on this page, so that they can be found on their
       own and not only through the page they sit on. */
    const pictures = (entry.images || [])
      .map((image) => `    <image:image>
      <image:loc>${escapeXml(`${base}${image.path}`)}</image:loc>
      <image:title>${escapeXml(image.title)}</image:title>
    </image:image>`)
      .join('\n');
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
${links}
${pictures}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`;
}

/** The sitemap the site should be serving, with today's dates. */
export async function sitemapFor(base) {
  const list = pageList();
  for (const entry of list) {
    entry.lastmod = entry.updated || await lastmodOf(entry.files);
    entry.images = await imagesFor(entry.path, entry.lang);
  }
  return { text: render(list, base), list };
}
