/* ===========================================================
   scripts/lib/feed.mjs — pure helpers for the Facebook feed.

   No network, no filesystem: everything here can be unit-tested
   without credentials. scripts/sync-facebook.mjs does the I/O.
   =========================================================== */

/* Emoji + variation selectors + ZWJ. Stripped from auto-derived titles
   so a headline like "新裝上市 🎉" reads as "新裝上市". */
const EMOJI_RE =
  /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{200D}\u{20E3}\u{1F1E6}-\u{1F1FF}]/gu;

export const TITLE_MAX = 24;
export const EXCERPT_MAX = 110;

/**
 * Derive a headline from a Facebook post body.
 * Uses the first non-empty line, minus emoji and a leading hashtag.
 * Returns '' when there is nothing usable — the frontend then falls
 * back to the generic "Latest Facebook post" label.
 */
export function deriveTitle(message) {
  if (!message) return '';
  const firstLine = (message.split(/\r?\n/).map((s) => s.trim()).find(Boolean)) || '';
  let s = firstLine.replace(EMOJI_RE, '').replace(/\s+/g, ' ').trim();
  // Hashtags are noise in a headline. Instagram puts them at the end of the
  // caption, Facebook often at the start — drop them wherever they sit.
  s = s.replace(/(^|\s)#\S+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (s.length > TITLE_MAX) s = s.slice(0, TITLE_MAX - 1).trimEnd() + '…';
  return s;
}

/**
 * Derive a card summary from a Facebook post body.
 * Drops the line that became the title, bare links, and collapses
 * whitespace, so the card shows readable prose.
 */
export function deriveExcerpt(message, title) {
  if (!message) return '';
  const lines = message.split(/\r?\n/);
  // If the first line became the title, don't repeat it in the excerpt.
  // Compare the *derived* title: deriving strips emoji and a leading
  // hashtag, so the raw first line rarely equals the title verbatim
  // ("新裝上市 🎉" derives to "新裝上市").
  if (lines.length > 1 && deriveTitle(lines[0]) === title) lines.shift();

  let body = lines.join(' ');
  body = body.replace(/https?:\/\/\S+/g, '');           // drop bare links
  body = body.replace(/\s+/g, ' ').trim();              // then collapse whitespace
  if (!body) body = message.replace(/\s+/g, ' ').trim();
  if (body.length > EXCERPT_MAX) body = body.slice(0, EXCERPT_MAX - 1).trimEnd() + '…';
  return body;
}

/**
 * Pick the best image for a post, from the several shapes the Graph API
 * returns them in. Returns null when the post has no usable image.
 */
export function pickImage(post) {
  const candidates = [];
  if (post.full_picture) candidates.push(post.full_picture);

  const att = post.attachments && post.attachments.data && post.attachments.data[0];
  if (att) {
    if (att.media && att.media.image) candidates.push(att.media.image);
    const sub = att.subattachments && att.subattachments.data && att.subattachments.data[0];
    if (sub && sub.image) candidates.push(sub.image);
  }
  if (post.media && post.media.image) candidates.push(post.media.image);

  return candidates.find((u) => typeof u === 'string' && u.startsWith('http')) || null;
}

/**
 * Merge the hand-written overrides in news.local.json onto a post.
 * Everything except the `hidden` flag is copied verbatim, so
 * title_en / excerpt_ja / follow / pinned all work.
 */
export function applyOverride(post, override) {
  if (!override) return post;
  const out = { ...post };
  for (const [key, value] of Object.entries(override)) {
    if (key === 'hidden') continue;
    out[key] = value;
  }
  return out;
}

/**
 * Curated posts from news.local.json — posts the brand wrote by hand
 * that are not Facebook posts at all. They must survive every sync,
 * so they are re-added after the feed is pulled.
 */
export function curatedPosts(overrides, pageUrl) {
  const out = [];
  for (const [id, override] of Object.entries(overrides)) {
    if (!override || override.hidden) continue;
    if (!override.title_zh && !override.message) continue;
    out.push(
      applyOverride(
        {
          id,
          permalink: `${pageUrl}/posts/${id}`,
          datePublished: '',
          // The base fields hold the Chinese source; _en / _ja are the
          // optional hand-written translations.
          title: override.title_zh || '',
          message: override.message || '',
          excerpt: override.excerpt_zh || '',
          image: '',
          source: 'Facebook',
        },
        override
      )
    );
  }
  return out;
}

/**
 * Re-add pinned posts that have scrolled past the feed limit.
 *
 * The Graph API only returns the last N posts, so an old-but-important post
 * would vanish from the site on the next sync. A post marked "pinned": true
 * in news.local.json is kept by restoring the copy from the previous
 * news.json instead.
 */
export function mergePinnedPosts(posts, previous, overrides) {
  const byId = new Map(posts.map((p) => [p.id, p]));
  for (const [id, override] of Object.entries(overrides || {})) {
    if (!override || !override.pinned) continue;
    if (byId.has(id)) continue;
    const old = (previous || []).find((p) => p.id === id);
    if (!old) continue;
    byId.set(id, applyOverride(old, override));
  }
  return [...byId.values()];
}

/**
 * The remote image for an Instagram media item.
 *
 * Instagram returns media_url for photos and a thumbnail under media for
 * videos and reels. Both expire, so the file is downloaded and committed
 * rather than hotlinked.
 */
export function instagramImageUrl(media) {
  if (!media) return null;
  if (media.media_type === 'VIDEO' || media.media_type === 'REELS') {
    const thumb = (media.media && media.media.thumbnail_url) || media.thumbnail_url;
    return typeof thumb === 'string' && thumb.startsWith('http') ? thumb : null;
  }
  return typeof media.media_url === 'string' && media.media_url.startsWith('http') ? media.media_url : null;
}

/**
 * Map an Instagram Graph API media item onto the same shape as a Facebook
 * post, so the renderer does not need to know where a card came from.
 *
 * Instagram captions carry the same "#tag first line" habit as Facebook
 * posts, so the title / excerpt derivation is shared.
 */
export function mapInstagramMedia(media, { username } = {}) {
  const id = String(media.id);
  const caption = (media.caption || '').trim();
  const title = deriveTitle(caption);
  const excerpt = deriveExcerpt(caption, title);
  return {
    id: `ig-${id}`,
    permalink: media.permalink || (username ? `https://www.instagram.com/${username}/p/${id}/` : ''),
    datePublished: (media.timestamp || '').slice(0, 10),
    title,
    message: caption,
    excerpt,
    image: '',
    imageUrl: instagramImageUrl(media),
    source: 'Instagram',
  };
}

/** Newest first. */
export function sortByDate(posts) {
  return posts.sort((a, b) => (b.datePublished || '').localeCompare(a.datePublished || ''));
}
