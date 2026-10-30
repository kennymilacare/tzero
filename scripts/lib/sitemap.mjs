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

import { alternates, pageUrl } from './langs.mjs';
import { pageList } from './pages.mjs';
import { ROOT } from './site.mjs';

const run = promisify(execFile);

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
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
${links}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
}

/** The sitemap the site should be serving, with today's dates. */
export async function sitemapFor(base) {
  const list = pageList();
  for (const entry of list) {
    entry.lastmod = await lastmodOf(entry.files);
  }
  return { text: render(list, base), list };
}
