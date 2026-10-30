/* ===========================================================
   chrome.mjs — where is Chrome?

   Two scripts need it: ig-fetch.mjs (which drives a headless
   Chrome over the DevTools Protocol to read Instagram) and
   gen-og-image.mjs (which renders the Open Graph image).

   Set CHROME_PATH if the browser lives somewhere unusual.
   =========================================================== */

import { existsSync } from 'node:fs';

export const CHROME_PATHS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

/** The path to a usable Chrome, or null if there is none. */
export function findChrome() {
  for (const p of CHROME_PATHS) if (existsSync(p)) return p;
  return null;
}
