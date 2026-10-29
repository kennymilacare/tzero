/* ===========================================================
   ig.mjs — reading an Instagram post link.

   No network, no filesystem: the pure half of scripts/ig-fetch.mjs,
   so the fiddly parts can be unit-tested (scripts/lib/ig.test.mjs).
   =========================================================== */

/* Instagram's shortcode alphabet — base64 with - and _ instead of + and /. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * The post code out of any Instagram post URL.
 *
 * Two shapes exist:
 *   instagram.com/p/<code>/              — a share link, no account name
 *   instagram.com/<account>/p/<code>/    — a named link
 *
 * Both are handled; the account name is not needed.
 */
export function shortcodeOf(url) {
  const m = String(url || '')
    .match(/instagram\.com\/(?:[^/?#]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

/** The media id behind a post code, as a BigInt. */
function mediaIdBigInt(shortcode) {
  let id = 0n;
  for (const c of String(shortcode || '')) {
    const v = ALPHABET.indexOf(c);
    if (v < 0) return null;
    id = id * 64n + BigInt(v);
  }
  return id === 0n ? null : id;
}

/**
 * The post's date, taken from its shortcode.
 *
 * An Instagram media id is a snowflake: the top bits are a millisecond
 * timestamp, offset by Instagram's own epoch. The shortcode is that id
 * in base64. The embed page does not show the date, so this is where it
 * comes from — and it is exact, not an estimate.
 *
 * Returns 'YYYY-MM-DD', or null if the code does not look like one.
 */
export function dateFromShortcode(shortcode) {
  const id = mediaIdBigInt(shortcode);
  if (id === null) return null;

  const ms = Number(id >> 23n) + 1314220021721;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime()) || d.getUTCFullYear() < 2010) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * The media id behind a post code, as a string.
 *
 * Instagram's own web endpoints address a post by this id rather than
 * by its code. Returns null when the code is not a post code.
 */
export function mediaIdOf(shortcode) {
  const id = mediaIdBigInt(shortcode);
  return id === null ? null : id.toString();
}

/** The canonical post URL for an account and a code. */
export function postUrl(username, shortcode) {
  return `https://www.instagram.com/${username}/p/${shortcode}/`;
}

/**
 * Strip the account name off the top of an embed's text.
 *
 * Instagram's "captioned" embed prints the account name on its own line
 * above the caption, separated by a blank line. Left in, that line
 * becomes the headline and the card reads "tzerojp".
 *
 * Two signals, because Instagram changes its markup from time to time:
 * the name the embed reports, and the shape of the line itself — a bare
 * handle on its own, followed by a blank line. A caption that merely
 * starts with one word ("Hello") is left alone: it has no blank line
 * after it.
 */
export function cleanCaption(text, account) {
  const lines = String(text || '').split(/\r?\n/);
  const name = String(account || '').trim();
  const first = (lines[0] || '').trim();

  const looksLikeHandle = /^[A-Za-z0-9._]{2,30}$/.test(first);
  const followedByBlank = lines.length >= 3 && !lines[1].trim();

  if (name && first === name) lines.shift();
  else if (looksLikeHandle && followedByBlank) lines.shift();

  return lines.join('\n').trim();
}

/**
 * Pull the post links out of command-line arguments and text files.
 *
 *   ig-fetch.mjs https://…  https://…
 *   ig-fetch.mjs --file urls.txt
 *   ig-fetch.mjs --login
 *
 * `--login` is a mode, not a link: it opens Instagram so you can sign
 * in, which the script needs for posts marked age-restricted.
 */
export function parseArgs(argv) {
  const urls = [];
  const files = [];
  let login = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') {
      if (argv[i + 1]) files.push(argv[++i]);
      continue;
    }
    if (a === '--login') { login = true; continue; }
    for (const m of String(a).matchAll(/https?:\/\/\S+/g)) urls.push(m[0]);
  }
  return { urls, files, login };
}
