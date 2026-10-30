/* ===========================================================
   faq.js — the FAQ accordion.

   This file has no imports on purpose. The page uses it to draw the
   accordion, and scripts/gen-faq-html.mjs uses the same function to
   write the same markup into index.html — so the questions a crawler
   reads and the questions a visitor opens are the same ones.

   The caller hands over the list and a function that picks the
   language, because picking the language needs the i18n module and
   the build script must not pull the browser's state in with it.
   =========================================================== */

const PLUS_ICON = `<svg viewBox="0 0 16 17" xmlns="http://www.w3.org/2000/svg">
                  <path class="vbar" d="M8 3V14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path class="hbar" d="M2.5 8.5H13.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>`;

/* The text is written into the page, so &, < and > are escaped. */
function escapeHTML(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * The accordion markup for a list of questions.
 *
 * `pick` is called as pick(item, 'q') and pick(item, 'a') and returns
 * the text for the visitor's language.
 */
export function faqHTML(items, pick) {
  return items
    .map((item) => {
      const q = escapeHTML(pick(item, 'q'));
      const a = escapeHTML(pick(item, 'a'));
      return `
          <div class="accordion__item">
            <button class="accordion__btn" aria-expanded="false">
              <span class="accordion__q">${q}</span>
              <span class="accordion__icon" aria-hidden="true">${PLUS_ICON}
              </span>
            </button>
            <div class="accordion__panel"><div class="accordion__panel-inner">${a}</div></div>
          </div>`;
    })
    .join('');
}

/**
 * Draw the accordion and wire it up.
 *
 * The questions are already in the HTML — this replaces them with the
 * same markup in the visitor's language, and re-does that whenever the
 * language changes.
 */
export function initFaq(items, pick) {
  const box = document.querySelector('[data-faq]');
  if (!box) return;

  const render = () => {
    box.innerHTML = faqHTML(items, pick);
  };
  render();

  box.addEventListener('click', (e) => {
    const btn = e.target.closest('.accordion__btn');
    if (!btn) return;
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    const panel = btn.nextElementSibling;
    if (!open) panel.style.maxHeight = panel.scrollHeight + 'px';
    else panel.style.maxHeight = '0';
  });

  document.addEventListener('lang:change', render);
}
