/* ===========================================================
   scripts/lib/spoken.mjs — the words of Cantonese speech.

   The site's Chinese is written Chinese: the way a shop would put
   it on a shelf, not the way it is spoken. These are the words
   that mark the difference — the particles and the fillers that
   only turn up when somebody talks rather than writes.

   Each entry is the spoken word and what to write instead, so a
   failure says what to reach for and not only that something is
   wrong.

   Two things in the repository are deliberately left out of the
   check: the raw captions of the social posts (those are the
   posts, in the voice they were posted in) and the maintainer's
   own notes in the JSON data files (those are notes to the
   maintainer, not copy for a visitor).
   =========================================================== */

export const SPOKEN = [
  ['嘅', '的'], ['唔', '不'], ['喺', '在'], ['咗', '了'], ['啱', '合適'],
  ['睇', '看'], ['揀', '選'], ['冇', '沒有'], ['嘢', '東西'], ['嚟', '來'],
  ['攞', '拿'], ['佢', '它'], ['哋', '他們'], ['乜', '什'], ['咩', '麼'],
  ['呢個', '這個'], ['嗰個', '那個'], ['呢啲', '這些'], ['嗰啲', '那些'],
  ['呢度', '這裡'], ['咁', '這麼'], ['吓', '一下'], ['靚', '漂亮'],
  ['搵', '找'], ['點解', '為什麼'], ['點樣', '如何'], ['唔使', '不需要'],
  ['唔好', '不要'], ['咁樣', '這樣'], ['嘥', '浪費'], ['唔錯', '不錯'],
  ['啦', '（語氣詞）'], ['咯', '（語氣詞）'], ['吖', '（語氣詞）'],
  ['喎', '（語氣詞）'], ['囉', '（語氣詞）'], ['㗎', '（語氣詞）'],
  ['嘞', '（語氣詞）'],
];

/**
 * The spoken words in a piece of Chinese, and what to write instead.
 *
 * Returns an empty list when the text is written Chinese — which is
 * what every piece of copy on this site should be.
 */
export function spokenIn(text) {
  const s = String(text ?? '');
  if (!s) return [];
  return SPOKEN
    .filter(([spoken]) => s.includes(spoken))
    .map(([spoken, written]) => ({ spoken, written }));
}
