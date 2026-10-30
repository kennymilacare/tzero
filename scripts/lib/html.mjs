/* ===========================================================
   scripts/lib/html.mjs — read and rewrite HTML as text.

   The language pages are made by taking a finished page and
   putting the other language's words in it. That means finding
   the element behind an attribute and replacing what is inside
   it — which a plain regular expression cannot do, because a
   <div> may hold other <div>s, and the first </div> is not the
   end of it.

   So this walks the markup properly: it knows which tags are
   empty, which hold text rather than markup, and how to find
   the tag that closes the one it is looking at.

   Pure text in, pure text out — no filesystem, no network.
   =========================================================== */

/* Tags that never have anything inside them. */
const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/* The attributes the i18n markers use. */
export const I18N_ATTRS = [
  'data-i18n', 'data-i18n-attr', 'data-i18n-aria',
  'data-i18n-placeholder', 'data-i18n-html', 'data-i18n-json',
];

/* ---------- escaping ---------- */

/** For text that goes between tags. */
export function escapeText(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** For a value that goes inside an attribute. */
export function escapeAttr(s) {
  return escapeText(s)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- reading the markup ---------- */

/**
 * Blank out the parts of the document that must not be read as
 * markup — comments, script bodies, style bodies — so that the
 * index of everything else stays exactly where it was.
 */
export function mask(html) {
  let out = html.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  out = out.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)/gi,
    (m, open, body, close) => open + body.replace(/[^\n]/g, ' ') + close);
  out = out.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi,
    (m, open, body, close) => open + body.replace(/[^\n]/g, ' ') + close);
  return out;
}

/**
 * Every tag in the document, in the order they appear.
 *
 * Each one knows where it starts, where it ends, what it is
 * called, and what its attributes say.
 */
export function scan(html) {
  const text = mask(html);
  const re = /<(\/)?([a-zA-Z][\w:.-]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/g;
  const tags = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[2].toLowerCase();
    let attrs = m[3];
    let selfClosing = false;
    if (/\/\s*$/.test(attrs)) {
      selfClosing = true;
      attrs = attrs.replace(/\/\s*$/, '');
    }
    tags.push({
      name,
      closing: Boolean(m[1]),
      selfClosing,
      start: m.index,
      openEnd: m.index + m[0].length,
      attrs,
      text: m[0],
    });
  }
  return tags;
}

/**
 * The attributes of one tag, as a plain object.
 * A repeated attribute keeps the first value, like a browser does.
 */
export function attrsOf(tag) {
  const out = {};
  const re = /([^\s=/<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(tag.attrs)) !== null) {
    const name = m[1].toLowerCase();
    if (name in out) continue;
    out[name] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return out;
}

/**
 * Where an element ends.
 *
 * Returns a map from the start of an opening tag to the span of
 * what is inside it. A tag that is never closed has no entry —
 * which is how the pages that used to be missing a </div> were
 * found in the first place.
 */
export function elements(html, tags = scan(html)) {
  const spans = new Map();
  const stack = [];

  for (const tag of tags) {
    if (tag.closing) {
      /* Find the nearest open tag of the same name. */
      let i = stack.length - 1;
      while (i >= 0 && stack[i].name !== tag.name) i--;
      if (i < 0) continue;
      const open = stack[i];
      stack.length = i;
      spans.set(open.start, {
        name: open.name,
        contentStart: open.openEnd,
        contentEnd: tag.start,
        closeStart: tag.start,
        closeEnd: tag.openEnd,
      });
    } else if (!VOID.has(tag.name) && !tag.selfClosing) {
      stack.push(tag);
    }
  }

  return spans;
}

/* ---------- changing one tag ---------- */

/** The tag name and attributes of a tag's text. */
function parseTagText(text) {
  const m = /^<([a-zA-Z][\w:.-]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/.exec(text);
  if (!m) return null;
  let attrs = m[2];
  const selfClosing = /\/\s*$/.test(attrs);
  if (selfClosing) attrs = attrs.replace(/\/\s*$/, '');
  return { name: m[1].toLowerCase(), attrs, selfClosing };
}

/** The tag as it would read if the attribute were set to `value`. */
export function withAttr(tagText, name, value) {
  const parsed = parseTagText(tagText);
  if (!parsed) return tagText;
  const encoded = escapeAttr(value);

  const re = /([^\s=/<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let out = '';
  let last = 0;
  let found = false;
  let m;
  while ((m = re.exec(parsed.attrs)) !== null) {
    if (found || m[1].toLowerCase() !== name.toLowerCase()) continue;
    out += parsed.attrs.slice(last, m.index) + `${name}="${encoded}"`;
    last = m.index + m[0].length;
    found = true;
  }
  out += parsed.attrs.slice(last);
  if (!found) out = ` ${name}="${encoded}"${out}`;

  return `<${parsed.name}${out}${parsed.selfClosing ? '/' : ''}>`;
}

/** The tag as it would read without the named attributes. */
export function withoutAttrs(tagText, names) {
  const parsed = parseTagText(tagText);
  if (!parsed) return tagText;
  const drop = new Set(names.map((n) => n.toLowerCase()));

  const re = /([^\s=/<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(parsed.attrs)) !== null) {
    if (!drop.has(m[1].toLowerCase())) continue;
    /* Take the space that joined it to the attribute before, so
       the tag does not end up with a gap where the attribute was. */
    out += parsed.attrs.slice(last, m.index).replace(/\s+$/, '');
    last = m.index + m[0].length;
  }
  out += parsed.attrs.slice(last).replace(/\s+$/, '');

  return `<${parsed.name}${out}${parsed.selfClosing ? '/' : ''}>`;
}

/* ---------- putting the words in ---------- */

/**
 * Replace the parts of the document marked with data-i18n, the
 * same way assets/js/i18n.js does when a page loads.
 *
 *   data-i18n="key"             → the text inside the element
 *   data-i18n-attr="name"       → that attribute of the element
 *   data-i18n-aria="key"        → its aria-label
 *   data-i18n-placeholder="key" → its placeholder
 *   data-i18n-html="key"        → the markup inside it
 *   data-i18n-json="key"        → the JSON inside the script
 *
 * With `strip`, the data-i18n attributes are taken out as well —
 * which is what a generated page wants: the words are already in
 * the file, so there is nothing left for the browser to do.
 *
 * `skipJson` leaves the data-i18n-json block alone. The Chinese
 * pages keep the block gen-jsonld.mjs wrote, in its own layout,
 * so the two generators do not fight over it.
 */
export function resolveI18n(html, dict, { strip = false, skipJson = false } = {}) {
  const tags = scan(html);
  const spans = elements(html, tags);
  const edits = [];

  const word = (key) => {
    if (!key) return null;
    const value = dict ? dict[key] : null;
    return value == null ? null : String(value);
  };

  for (const tag of tags) {
    if (tag.closing) continue;
    const attrs = attrsOf(tag);
    const hasMarker = I18N_ATTRS.some((n) => n in attrs);
    if (!hasMarker) continue;

    const span = spans.get(tag.start);
    const key = attrs['data-i18n'] || null;
    const attrName = attrs['data-i18n-attr'] || null;
    const ariaKey = attrs['data-i18n-aria'] || null;
    const phKey = attrs['data-i18n-placeholder'] || null;
    const htmlKey = attrs['data-i18n-html'] || null;
    const jsonKey = attrs['data-i18n-json'] || null;

    /* What the tag itself should say. */
    let text = tag.text;
    if (attrName && key) {
      const value = word(key);
      if (value != null) text = withAttr(text, attrName, value);
    }
    if (ariaKey) {
      const value = word(ariaKey);
      if (value != null) text = withAttr(text, 'aria-label', value);
    }
    if (phKey) {
      const value = word(phKey);
      if (value != null) text = withAttr(text, 'placeholder', value);
    }

    /* What goes inside it. */
    let inner = null;
    if (htmlKey) {
      const value = word(htmlKey);
      if (value != null) inner = value;
    }
    if (jsonKey && !skipJson) {
      const value = word(jsonKey);
      if (value != null) inner = value;
    }
    if (inner == null && key) {
      const value = word(key);
      if (value != null) inner = escapeText(value);
    }

    if (strip) text = withoutAttrs(text, I18N_ATTRS);

    if (text !== tag.text) {
      edits.push({ start: tag.start, end: tag.openEnd, text });
    }
    if (inner != null && span) {
      edits.push({ start: span.contentStart, end: span.contentEnd, text: inner });
    }
  }

  return applyEdits(html, edits);
}

/**
 * Replace the canonical link and the alternate links that follow
 * it — the block that says which languages this page is in.
 */
export function replaceLinks(html, block) {
  const re = /[ \t]*<link rel="canonical"[^>]*>(?:\s*<link rel="alternate"[^>]*>)*/;
  if (!re.test(html)) throw new Error('the page has no canonical link');
  return html.replace(re, block);
}

/** Put the edits back into the text, last one first so the
    indexes of the earlier ones stay right. */
export function applyEdits(html, edits) {
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let out = html;
  for (const edit of sorted) {
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  }
  return out;
}

/**
 * The text of the element that opens at `openStart`.
 * Used to read a page's own words back out.
 */
export function innerText(html, openStart) {
  const spans = elements(html);
  const span = spans.get(openStart);
  if (!span) return '';
  return html.slice(span.contentStart, span.contentEnd);
}
