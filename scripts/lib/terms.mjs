/* ===========================================================
   scripts/lib/terms.mjs — the legal page, in three languages.

   The terms page is the one page whose body is a long piece of
   writing rather than a set of labels. It used to be Chinese
   only, written straight into the markup, so the English and
   Japanese versions of the page were the same Chinese words.

   Now the writing lives in assets/data/terms.json, once for
   each language, and this file puts the right one into the page:

       terms.html      the Chinese
       en/terms.html   the English
       ja/terms.html   the Japanese

   The three are written from the same structure, so a change to
   one of them is a change to all of them — the headings, the
   paragraphs and the bullet points always line up.
   =========================================================== */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { attrsOf, elements, scan } from './html.mjs';
import { ROOT } from './site.mjs';

const FILE = path.join(ROOT, 'assets', 'data', 'terms.json');

/** The legal writing, in all three languages. */
export async function loadTerms() {
  return JSON.parse(await readFile(FILE, 'utf8'));
}

/* ---------- writing the page ---------- */

/** The three boxes at the top of the article — date, who runs it, how to reach them. */
function renderMeta(meta) {
  const items = meta
    .map((m) => [
      '          <div>',
      `            <strong>${m.label}</strong>`,
      `            ${m.value}`,
      '          </div>',
    ].join('\n'))
    .join('\n');
  return `        <div class="legal-meta">\n${items}\n        </div>`;
}

/** One block of the article: a heading, a paragraph or a list. */
function renderBlock(block) {
  if (block.tag === 'ul') {
    const items = block.items.map((i) => `          <li>${i}</li>`).join('\n');
    return `        <ul>\n${items}\n        </ul>`;
  }
  const cls = block.class ? ` class="${block.class}"` : '';
  const style = block.class === 'muted'
    ? ' style="margin-top: var(--space-7); font-size: var(--fs-xs);"'
    : '';
  return `        <${block.tag}${cls}${style}>${block.html}</${block.tag}>`;
}

/** What goes inside <article class="legal-prose">. */
export function renderArticle(terms) {
  const blocks = terms.blocks.map(renderBlock);
  return [renderMeta(terms.meta), ...blocks].join('\n');
}

/* ---------- putting it into the page ---------- */

/**
 * The span of the first element that matches.
 *
 * `test` is given the tag and its attributes; it says whether
 * this is the element we are looking for.
 */
function findElement(html, test) {
  const tags = scan(html);
  const spans = elements(html, tags);
  for (const tag of tags) {
    if (tag.closing) continue;
    if (!test(tag, attrsOf(tag))) continue;
    const span = spans.get(tag.start);
    if (span) return span;
  }
  return null;
}

/** Put new words inside the element that matches. */
function replaceInner(html, test, inner) {
  const span = findElement(html, test);
  if (!span) return html;
  return html.slice(0, span.contentStart) + inner + html.slice(span.contentEnd);
}

/**
 * Put one language's legal writing into a page.
 *
 * The heading at the top, the line under it and the article
 * itself are all replaced, so the page reads as one document in
 * one language.
 */
export function applyTerms(html, lang, terms) {
  const t = terms[lang];
  if (!t) throw new Error(`terms.json has no "${lang}"`);

  let out = replaceInner(html, (tag) => tag.name === 'h1', t.h1);
  out = replaceInner(
    out,
    (tag, attrs) => tag.name === 'p' && attrs.class === 'page-hero__lead',
    `\n        ${t.lead}\n      `,
  );
  out = replaceInner(
    out,
    (tag, attrs) => tag.name === 'article' && String(attrs.class || '').includes('legal-prose'),
    `\n${renderArticle(t)}\n      `,
  );
  return out;
}
