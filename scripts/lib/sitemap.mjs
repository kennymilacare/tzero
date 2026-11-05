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
import { stat } from 'node:fs/promises';
import path from 'node:path';
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

/** A moment, as a full ISO 8601 timestamp with the local offset. */
function localStamp(date) {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
  return `${date.toISOString().replace(/\.\d{3}Z$/, '')}${sign}${hours}:${minutes}`;
}

/** When a file was last written, for a file git cannot date.

    A page that has never been committed has no git date. Its time
    on disk is the next best answer — and because the generators do
    not rewrite a file whose words have not changed, that time stays
    the same from one run to the next. */
async function writtenAt(file) {
  try {
    const { mtime } = await stat(path.join(ROOT, file));
    return localStamp(mtime);
  } catch (e) {
    return null;
  }
}

/** When a file was last changed, according to git — a full ISO 8601
    timestamp, with the offset.

    Bing asks for one: the day on its own is valid, but too coarse to
    schedule a recrawl with, and Bing reads the sitemap to decide what
    to crawl next. */
export async function changedAt(file) {
  try {
    const { stdout } = await run('git', ['log', '-1', '--format=%cI', '--', file], { cwd: ROOT });
    const stamp = stdout.trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(stamp)) return stamp;
  } catch (e) {
    /* No git, or no history — the time on disk is the answer. */
  }
  return writtenAt(file);
}

/** The day a file was last changed, according to git. This is what a
    reader is shown, so it is a day and not a moment. */
export async function changedOn(file) {
  const stamp = await changedAt(file);
  return stamp ? stamp.slice(0, 10) : null;
}

/** The newest of several timestamps — or now, if git cannot say. */
export async function lastmodOf(files) {
  const stamps = (await Promise.all(files.map(changedAt))).filter(Boolean);
  if (!stamps.length) return new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');
  /* The offset is whatever the commit was made in, so the stamps are
     compared as instants and not as text. */
  return stamps.sort((a, b) => Date.parse(a) - Date.parse(b)).pop();
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
