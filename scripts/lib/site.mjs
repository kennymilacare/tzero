/* ===========================================================
   site.mjs — the site's social accounts, in one place.

   assets/data/site.json holds the canonical Facebook Page and
   Instagram profile URLs. Everything else (the scripts that build
   feed links, the HTML that links out, the JSON-LD) must agree
   with it — scripts/lib/site.test.mjs enforces that.

   Run `node scripts/sync-social-links.mjs` after changing
   site.json to bring the HTML and data.js back in line.
   =========================================================== */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeBase } from './siteurl.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..', '..');
export const SITE_FILE = path.join(ROOT, 'assets', 'data', 'site.json');

/**
 * Write a file — but only when its words have changed.
 *
 * A generator that rewrites every file on every run makes a mess
 * of two things. The working tree looks like everything changed
 * when nothing did, and the time a file was last written moves for
 * no reason — and the sitemap reads that time to say when a page
 * was last changed.
 *
 * So the file is read first, and written only when what is on disk
 * and what is in hand are not the same words. Returns true when it
 * wrote.
 */
export async function writeIfChanged(file, text) {
  const full = path.isAbsolute(file) ? file : path.join(ROOT, file);
  const current = await readFile(full, 'utf8').catch(() => null);
  if (current === text) return false;
  await writeFile(full, text, 'utf8');
  return true;
}

export async function loadSite() {
  const raw = JSON.parse(await readFile(SITE_FILE, 'utf8'));
  return {
    facebook: String(raw.facebook || '').replace(/\/+$/, ''),
    instagram: String(raw.instagram || '').replace(/\/+$/, ''),
    /* The site's own address — where it is published. */
    url: normalizeBase(raw.url) || '',
  };
}

/** The handle part of a URL: https://www.instagram.com/tzerojp -> tzerojp */
export function usernameOf(url) {
  const m = String(url || '').match(/^https?:\/\/[^/]+\/([^/?#]+)/i);
  return m ? m[1] : '';
}
