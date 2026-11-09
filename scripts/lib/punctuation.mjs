/* ===========================================================
   scripts/lib/punctuation.mjs — one rule for the punctuation.

   The site is written in three languages and each of them has
   its own habits. What none of them has is a habit of mixing
   two of them inside one sentence: a Chinese line with a
   half-width comma in the middle of it, a full-width bracket
   next to a half-width one, a Japanese sentence with an
   English comma in it.

   The reader does not notice. The reader just feels that the
   page was assembled out of pieces and never quite settled.

   The rule, then:

     Chinese    full-width   , ; : ( ) ! ?   ->   ，；：（）！？
     Japanese   full-width   ( ) ! ?         ->   （）！？
                 a comma is a 、, not an English one
     English    half-width                       , ; : ( ) ! ?

   The separator between words that belong together is the
   same one everywhere: the middle dot. The site used both the
   dot and the katakana middle dot, sometimes in the same
   line; now there is one.

   Two things are not prose and are left exactly as they
   are: the clock (10:00) and the list of keywords in the meta
   tag. The thousands separator in a number (1,000) is a third.

   Everything else — the words, the numbers, the code, the
   URLs — is left alone as well.
   =========================================================== */

/* Hiragana and katakana. A string that has one of these is
   Japanese; Chinese has none.

   The katakana middle dot (\u30FB) is not in here: it is a mark that
   sits in the middle of the katakana block without being a letter.
   A Chinese line that uses it \u2014 \u300C\u6C34\u6EB6\u6027\u30FB\u6613\u6E05\u6D17\u300D \u2014 is Chinese,
   and the rule has to be able to see that. */
export const KANA = /[\u3041-\u309F\u30A0-\u30F6\u30FC-\u30FF\uFF66-\uFF9F]/;
/* Han characters: Chinese and Japanese both use them. The
   ranges are written out in numbers, because the blocks of
   characters around them hold the emoji as well — and an
   emoji is not a word. */
export const HAN = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;

/* The same characters, in a group, for the rule that has to know
   which one it found: a Chinese full stop after one of them. */
const HAN_GROUP = /([㐀-䶿一-鿿豈-﫿])\.[ \t]*/g;

/* The marks that only the Chinese and the Japanese write. A piece
   of writing that has one of them belongs to one of the two,
   whatever else is in it. */
const CJK_MARK = /[。、，；：！？（）「」『』〜～]/;

/** Does this piece of writing have Chinese or Japanese in it? */
function hasCJK(text) {
  return HAN.test(text) || KANA.test(text) || CJK_MARK.test(text);
}

/**
 * Which language a piece of writing is in.
 *
 * Kana settles it: a Japanese sentence has them and a Chinese
 * one has not. Without them, Han means Chinese and Latin means
 * English. Returns null for writing in none of the three.
 */
export function languageOf(text) {
  const s = String(text ?? '');
  if (!s) return null;
  if (KANA.test(s)) return 'ja';
  if (HAN.test(s)) return 'zh';
  if (/[A-Za-z]/.test(s)) return 'en';
  return null;
}

/* The marks, and what each language writes them as. */
const CHINESE = {
  ',': '，',
  ';': '；',
  ':': '：',
  '(': '（',
  ')': '）',
  '!': '！',
  '?': '？',
};

const JAPANESE = {
  ',': '、',
  '，': '、',
  ';': '；',
  ':': '：',
  '(': '（',
  ')': '）',
  '!': '！',
  '?': '？',
};

const ENGLISH = {
  '，': ',',
  '；': ';',
  '：': ':',
  '（': '(',
  '）': ')',
  '！': '!',
  '？': '?',
};

/* The map for one language. */
function tableFor(lang) {
  if (lang === 'zh') return CHINESE;
  if (lang === 'ja') return JAPANESE;
  return ENGLISH;
}

/* The English marks — what a mark looks like inside an English
   phrase, whichever language the page around it is written in. */
const HALF_MARK = {
  ',': ',', ';': ';', ':': ':', '(': '(', ')': ')', '!': '!', '?': '?',
  '，': ',', '；': ';', '：': ':', '（': '(', '）': ')', '！': '!', '？': '?',
  '、': ',',
};

/* A URL, an email address, a markdown link, or an HTML entity:
   none of them is prose. The link is kept whole, so that its
   brackets do not turn into full-width ones and stop being a
   link; the entity is kept whole, so that &amp; does not become
   &amp；. */
const URLISH = /(\[[^\]]*\]\([^)]*\)|https?:\/\/[^\s"'<>]*|&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);|[^\s"'<>@]+@[^\s"'<>@]+\.[^\s"'<>@]+)/g;
/* An HTML tag: its punctuation belongs to the markup. The
   brackets keep it in the split, so it can be put back. */
const TAG = /(<[^>]*>)/g;

/* A private-use mark that stands in for something held back. */
const HOLD = '';

/* Another private-use mark, for the code pieces of a template
   literal: they are put aside for a moment, and they must not be
   mistaken for the numbers held back above. */
const PART = '';

/**
 * Turn the punctuation of one piece of writing the right way up.
 *
 * The language is worked out from the writing itself, so the
 * caller does not have to know it. Text that is not in any of
 * the three languages comes back unchanged.
 *
 * A caller that already knows the language — the template
 * literal, whose pieces are all one language — says so.
 */
export function convertText(text, known) {
  const s = String(text ?? '');
  if (!s) return s;
  const lang = known || languageOf(s);
  if (!lang) return s;

  const table = tableFor(lang);
  /* Two passes: the tags first, because they are the most
     likely to hold a colon or a slash. */
  return s
    .split(TAG)
    .map((chunk, index) => {
      /* Odd chunks are the tags themselves — leave them alone. */
      if (index % 2 === 1) return chunk;
      return chunk
        .split(URLISH)
        .map((piece, pieceIndex) => {
          if (pieceIndex % 2 === 0) return convertPlain(piece, table, lang);
          /* A markdown link: the words inside it are prose, the
             brackets and the address are not. */
          const link = /^\[([^\]]*)\]\(([^)]*)\)$/.exec(piece);
          if (link) return `[${convertText(link[1], lang)}](${link[2]})`;
          return piece;
        })
        .join('');
    })
    .join('');
}

/** The marks inside ordinary prose, with the language's table. */
function convertPlain(text, table, lang) {
  /* The clock and the thousands separator are numbers, not prose:
     they keep the marks they have. */
  const held = [];
  const hold = (source, value) =>
    value.replace(new RegExp(source.source, 'g'), (m) => {
      held.push(m);
      return `${HOLD}${held.length - 1}${HOLD}`;
    });

  let out = hold(/\d:\d/, text);   /* 10:00 */
  out = hold(/\d,\d{3}/, out);     /* 1,000 */

  /* The marks themselves. A full-width mark carries its own
     space, so the ASCII space next to it goes away. */
  for (const [from, to] of Object.entries(table)) {
    out = replaceMark(out, from, to);
  }

  /* A space next to a full-width mark is the same space twice —
     unless a separator comes next, which keeps the space that
     holds it away from the mark before it. */
  out = out.replace(/ +([，；：！？（）、。…～])/g, '$1');
  out = out.replace(/([，；：！？（）、。…～]) +(?![·・])/g, '$1');

  /* The separator. Spaced, it holds two things apart, and it is
     the middle dot in every language. Unspaced, it is a compound
     marker: the katakana dot in Japanese, the middle dot in the
     other two. The wave dash is the Chinese one. */
  const dot = (m, before, after) =>
    before || after ? `${before}·${after}` : lang === 'ja' ? '・' : '·';
  out = out.replace(/(\s*)・(\s*)/g, dot);
  out = out.replace(/(\s*)·(\s*)/g, dot);
  if (lang === 'zh') out = out.replace(/〜/g, '～');

  /* The ellipsis: two characters, not three dots — and always two,
     so that running the rule over its own result changes nothing. */
  if (lang === 'en') out = out.replace(/(?:\.{3,}|…+)/g, '…');
  else out = out.replace(/(?:\.{3,}|…+)/g, '……');

  /* A full stop after a Chinese character is a Chinese full stop:
     第九感. 版權所有 → 第九感。版權所有 */
  if (lang !== 'en') out = out.replace(HAN_GROUP, '$1。');

  /* Whatever was held back goes back. */
  out = out.replace(new RegExp(`${HOLD}(\\d+)${HOLD}`, 'g'), (m, n) => held[Number(n)]);
  return out;
}

/** A character that has to be escaped inside a regular expression. */
function escapeRe(ch) {
  return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * One mark, put the way the writing around it wants it.
 *
 * A mark inside an English phrase — a word on one side and a word
 * on the other — keeps the English mark, even on a Chinese page:
 * the name of a street is an English name, and its commas are
 * English commas. Everywhere else the mark follows the language of
 * the page it is written in.
 */
function replaceMark(text, from, to) {
  return text.replace(new RegExp(escapeRe(from), 'g'), (mark, at, whole) => {
    if (isEnglishPhrase(whole, at)) return HALF_MARK[mark] ?? mark;
    return to;
  });
}

/**
 * Is the mark at this place inside an English phrase?
 *
 * A letter on one side and a letter on the other. A digit does not
 * count: 「HK$128,24小時」 is two Chinese clauses, not an English
 * phrase with a number in it.
 */
function isEnglishPhrase(text, at) {
  let left = at - 1;
  while (left >= 0 && /[ \t]/.test(text[left])) left--;
  let right = at + 1;
  while (right < text.length && /[ \t]/.test(text[right])) right++;
  if (left < 0 || right >= text.length) return false;
  return /[A-Za-z]/.test(text[left]) && /[A-Za-z]/.test(text[right]);
}

/* ---------- the files ---------- */

/**
 * The language of a whole page.
 *
 * The page says what it is in its <html lang="...">, and that is
 * the answer. A page whose markup does not say is worked out from
 * the writing in it.
 */
export function pageLanguage(src) {
  const declared = /<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i.exec(src);
  if (declared) {
    const tag = declared[1].toLowerCase();
    if (tag.startsWith('ja')) return 'ja';
    if (tag.startsWith('zh')) return 'zh';
    if (tag.startsWith('en')) return 'en';
  }
  const text = src
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  return languageOf(text);
}

/**
 * The language of one piece of writing inside a page.
 *
 * A piece that carries Chinese characters, Japanese kana or a
 * Chinese mark belongs to the page's language: the page is written
 * in one language, and a piece of it cannot be in another. This is
 * what tells 「月曜〜金曜」 on a Japanese page from the same marks on
 * a Chinese page — the characters are shared, the page is not.
 *
 * A piece with nothing but Latin letters in it is an English
 * phrase: a street address, a brand name, a product code. It keeps
 * the English marks even on a Chinese page.
 */
function chunkLanguage(chunk, pageLang) {
  if (hasCJK(chunk)) return pageLang || 'zh';
  if (/[A-Za-z]/.test(chunk)) return 'en';
  return pageLang || null;
}

/**
 * The punctuation of a whole HTML page.
 *
 * Two things are left alone: the contents of <script> and
 * <style> (the structured data is written by the generators, and
 * the styles are not prose), and the attributes that are not
 * prose — the links, the classes, the ids, the data- hooks.
 */
export function convertHtml(src, known) {
  const lang = known || pageLanguage(src);
  const TOKEN = /<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<[^>]+>|[^<]+/g;
  return src.replace(TOKEN, (token) => {
    if (token.startsWith('<!--')) return token;
    if (/^<(script|style)\b/i.test(token)) return token;
    if (token.startsWith('<')) return convertTag(token, lang);
    return convertText(token, chunkLanguage(token, lang));
  });
}

/* The attributes whose value is prose somebody reads. */
const PROSE_ATTRS = new Set(['content', 'title', 'alt', 'aria-label', 'placeholder']);

/** One tag: the prose attributes inside it. */
function convertTag(tag, known) {
  /* The list of keywords is a list, not a sentence: it is
     separated by commas and the commas are half-width. */
  if (/^<meta\b/i.test(tag) && /\bname\s*=\s*["']keywords["']/i.test(tag)) return tag;

  return tag.replace(
    /([:@A-Za-z_][-:\w.]*)(\s*=\s*)("([^"]*)"|'([^']*)')/g,
    (whole, name, eq, quoted, dq, sq) => {
      if (!PROSE_ATTRS.has(name.toLowerCase())) return whole;
      const value = dq !== undefined ? dq : sq;
      if (value === undefined) return whole;
      const quote = quoted[0];
      const converted = convertText(value, chunkLanguage(value, known));
      if (converted === value) return whole;
      return `${name}${eq}${quote}${converted}${quote}`;
    },
  );
}

/**
 * The punctuation of a JavaScript file.
 *
 * Only the string literals are touched. Comments, code, numbers
 * and the names of things are left exactly as they were, so the
 * file still parses the same way and still means the same thing.
 */
export function convertJs(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  /* The last character that was not space — it decides whether a
     slash opens a regular expression or is a division. */
  let last = '';

  while (i < n) {
    const ch = src[i];

    /* a comment */
    if (ch === '/' && src[i + 1] === '/') {
      const end = lineEnd(src, i);
      out += src.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      out += src.slice(i, stop);
      i = stop;
      continue;
    }
    /* a regular expression */
    if (ch === '/' && opensRegex(last)) {
      const end = regexEnd(src, i);
      out += src.slice(i, end);
      i = end;
      last = '/';
      continue;
    }
    /* a string */
    if (ch === '"' || ch === "'" || ch === '`') {
      const end = stringEnd(src, i);
      out += convertLiteral(src.slice(i, end));
      i = end;
      last = ch;
      continue;
    }

    out += ch;
    if (!/\s/.test(ch)) last = ch;
    i++;
  }
  return out;
}

/** Where a line comment stops. */
function lineEnd(src, from) {
  const j = src.indexOf('\n', from);
  return j === -1 ? src.length : j;
}

/** Whether a slash at this point opens a regular expression. */
function opensRegex(last) {
  if (!last) return true;
  return '(,=:[!&|?{};+-*%~^<>'.includes(last);
}

/** Where a regular expression stops. */
function regexEnd(src, from) {
  let i = from + 1;
  let inClass = false;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '[') inClass = true;
    else if (ch === ']') inClass = false;
    else if (ch === '/' && !inClass) return i + 1;
    else if (ch === '\n') return i;
    i++;
  }
  return src.length;
}

/**
 * Where a string literal stops.
 *
 * A template literal may hold ${...} pieces, which are code and
 * are copied over untouched.
 */
function stringEnd(src, from) {
  const quote = src[from];
  let i = from + 1;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\') { i += 2; continue; }
    if (quote === '`' && ch === '$' && src[i + 1] === '{') {
      i = expressionEnd(src, i + 2);
      continue;
    }
    if (ch === quote) return i + 1;
    if (quote !== '`' && ch === '\n') return i; /* an unterminated string */
    i++;
  }
  return src.length;
}

/** Where the ${...} of a template literal stops. */
function expressionEnd(src, from) {
  let depth = 1;
  let i = from;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { i = stringEnd(src, i); continue; }
    if (ch === '/' && src[i + 1] === '/') { i = lineEnd(src, i); continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return i + 1; }
    i++;
  }
  return src.length;
}

/**
 * One string literal, with its punctuation put right.
 *
 * The quotes and the escapes stay as they were; only the writing
 * between them is touched.
 */
function convertLiteral(raw) {
  const quote = raw[0];
  if (raw.length < 2) return raw;
  const body = raw.slice(1, -1);

  if (quote === '`') {
    /* A template literal: the ${...} pieces are code. */
    return quote + convertTemplateBody(body) + quote;
  }
  const converted = convertText(body);
  return quote + converted + quote;
}

/**
 * The body of a template literal.
 *
 * The ${...} pieces are code, not writing: a question mark and a
 * colon in there are operators, not punctuation. They are put
 * aside first, so that the markup around them stays whole and the
 * writing in it can still be told from the tags.
 *
 * What is left is either a piece of markup or a piece of plain
 * writing, and the two are told apart by looking for a tag.
 */
function convertTemplateBody(body) {
  const parts = [];
  let text = '';
  let i = 0;

  while (i < body.length) {
    if (body[i] === '\\') { text += body.slice(i, i + 2); i += 2; continue; }
    if (body[i] === '$' && body[i + 1] === '{') {
      const end = expressionEnd(body, i + 2);
      parts.push(convertExpression(body.slice(i, end)));
      text += `${PART}${parts.length - 1}${PART}`;
      i = end;
      continue;
    }
    text += body[i];
    i++;
  }

  const lang = languageOf(text);
  const isMarkup = /<[a-zA-Z!/]/.test(text);
  let out = isMarkup ? convertHtml(text, lang) : convertText(text, lang);

  /* Whatever was put aside goes back. */
  out = out.replace(new RegExp(`${PART}(\\d+)${PART}`, 'g'), (m, n) => parts[Number(n)]);
  return out;
}

/**
 * The code inside ${...}.
 *
 * The operators are the programmer's, and they are left alone. But a
 * template literal written inside that code may hold words — a
 * label, a piece of markup — and those want the punctuation of their
 * own language. So the nested literal is converted, and nothing else
 * is.
 */
function convertExpression(src) {
  let out = '';
  let i = 0;

  while (i < src.length) {
    const ch = src[i];
    /* A plain string in code is a name, a key, a path — not prose. */
    if (ch === '"' || ch === "'") {
      const end = stringEnd(src, i);
      out += src.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '`') {
      const end = stringEnd(src, i);
      out += convertLiteral(src.slice(i, end));
      i = end;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/**
 * The punctuation of a JSON file.
 *
 * A JSON file is nothing but strings, so the only thing to be
 * careful of is not to mistake the value of a key for the key
 * itself. Keys here are English; only the values are prose.
 *
 * A key that names a language — "zh", "en", "ja" — says what
 * language the words under it are in. A Japanese heading with no
 * kana in it — 「利用規約・細則」 — is Japanese because of the key
 * it sits under, not because of the words in it.
 */
export function convertJson(src) {
  /* Every string in the file, and where it starts and ends. */
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    if (src[i] === '"') {
      const end = jsonStringEnd(src, i);
      tokens.push({ start: i, end, body: src.slice(i + 1, end - 1) });
      i = end;
      continue;
    }
    i++;
  }

  /* A string is a key when a colon comes after it. */
  const isKey = (token) => {
    let j = token.end;
    while (j < src.length && /\s/.test(src[j])) j++;
    return src[j] === ':';
  };

  /* The language of each part of the file. */
  const spans = [];
  for (const token of tokens) {
    if (!isKey(token)) continue;
    if (token.body !== 'zh' && token.body !== 'en' && token.body !== 'ja') continue;
    spans.push({ start: token.start, lang: token.body });
  }

  /* The language at a place in the file: the last key that named
     one before it. */
  const langAt = (pos) => {
    let lang = null;
    for (const span of spans) {
      if (span.start >= pos) break;
      lang = span.lang;
    }
    return lang;
  };

  /* The values, converted and put back. The file is walked from the
     end, so that the places of the strings before them stay right. */
  let out = src;
  for (let t = tokens.length - 1; t >= 0; t--) {
    const token = tokens[t];
    if (isKey(token)) continue;
    const converted = convertText(token.body, langAt(token.start) || undefined);
    if (converted === token.body) continue;
    out = `${out.slice(0, token.start)}"${converted}"${out.slice(token.end)}`;
  }
  return out;
}

/** Where a JSON string stops. */
function jsonStringEnd(src, from) {
  let i = from + 1;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '"') return i + 1;
    i++;
  }
  return src.length;
}

/* ---------- the files the site reads as words ---------- */

/**
 * The copy, and how each file is written down.
 *
 * The sweep (scripts/fix-punctuation.mjs) and the test
 * (scripts/lib/punctuation.test.mjs) go over exactly these.
 *
 * The guide pages and assets/js/guides.js are not here: they are
 * written by scripts/gen-guide-pages.mjs out of scripts/lib/guides/,
 * and the generator puts the marks right by itself.
 *
 * The files that are not here are the ones the site does not read
 * as words: the developer notes (assets/data/manual.json,
 * site.json, indexnow.json) and the news feed, whose "message" is
 * the caption of an Instagram post exactly as it was posted.
 */
export const COPY_FILES = [
  /* the pages that are written by hand */
  ['index.html', 'html'],
  ['products.html', 'html'],
  ['about.html', 'html'],
  ['contact.html', 'html'],
  ['news.html', 'html'],
  ['terms.html', 'html'],
  ['404.html', 'html'],
  ['product.html', 'html'],
  /* the words that the pages are written from */
  ['assets/js/data.js', 'js'],
  ['assets/js/product-copy.js', 'js'],
  ['assets/js/main.js', 'js'],
  ['assets/js/product-svg.js', 'js'],
  ['assets/js/splash.js', 'js'],
  ['assets/js/i18n.js', 'js'],
  /* the buying guides */
  ['scripts/lib/guides.mjs', 'js'],
  ['scripts/lib/guides/size.mjs', 'js'],
  ['scripts/lib/guides/material.mjs', 'js'],
  ['scripts/lib/guides/texture.mjs', 'js'],
  ['scripts/lib/guides/thickness.mjs', 'js'],
  ['scripts/lib/guides/first-time.mjs', 'js'],
  ['scripts/lib/guides/hyaluronic.mjs', 'js'],
  ['scripts/lib/product-page.mjs', 'js'],
  ['scripts/sync-og-image.mjs', 'js'],
  /* the data files that are served to the browser */
  ['assets/data/terms.json', 'json'],
];
