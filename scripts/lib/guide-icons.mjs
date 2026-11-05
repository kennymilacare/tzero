/* ===========================================================
   scripts/lib/guide-icons.mjs — the little pictures of the guides.

   A list of six things to read is easier to scan when each of
   them has a mark of its own. The mark says what the guide is
   about before a word is read: a ruler for the size chart, a
   droplet for the hyaluronic one.

   The drawings are inline SVG in the same hand as the icons
   already on the site — a 24 × 24 box, drawn in strokes rather
   than filled, in whatever colour the text around them is. That
   way they need no file of their own, no extra request, and they
   grow and shrink with the words they sit beside.

   The shape of each one is decided by the guide it belongs to;
   the drawing itself never changes.
   =========================================================== */

/**
 * The pictures, by the guide they belong to.
 *
 * Each is the inside of a 24 × 24 box. The key is the guide's
 * slug, so a guide and its picture can never be parted.
 */
export const GUIDE_ICONS = {
  /* 尺碼 — a rule, with the marks you measure against. */
  size: [
    '<rect x="2.5" y="7.5" width="19" height="9" rx="2"/>',
    '<path d="M6.5 7.5v3M10.5 7.5v4.5M14.5 7.5v3M18.5 7.5v4.5"/>',
  ],

  /* 厚度 — the film seen edge on: two surfaces, and the gap between. */
  thickness: [
    '<path d="M3.5 9h17M3.5 15h17"/>',
    '<path d="M8.5 9v6M15.5 9v6"/>',
  ],

  /* 材質 — the layers a condom is made of. */
  material: [
    '<path d="M12 3.2 3.5 7.6 12 12l8.5-4.4L12 3.2Z"/>',
    '<path d="m3.5 13 8.5 4.4 8.5-4.4"/>',
  ],

  /* 紋路 — the surface, and the raised points on it. */
  texture: [
    '<rect x="3" y="3" width="18" height="18" rx="5"/>',
    '<circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>',
    '<circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/>',
    '<circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" stroke="none"/>',
    '<circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" stroke="none"/>',
  ],

  /* 第一次購買 — a shopping bag. */
  'first-time': [
    '<path d="M5.2 8h13.6l-1 12.2H6.2L5.2 8Z"/>',
    '<path d="M9 8.5V6.2a3 3 0 0 1 6 0v2.3"/>',
  ],

  /* 玻尿酸 — a drop. */
  hyaluronic: [
    '<path d="M12 3.4c3.4 3.6 5.6 6.6 5.6 9.4A5.6 5.6 0 0 1 12 18.4a5.6 5.6 0 0 1-5.6-5.6c0-2.8 2.2-5.8 5.6-9.4Z"/>',
  ],

  /* The list of them all. */
  list: [
    '<path d="M9.5 6.5h11M9.5 12h11M9.5 17.5h11"/>',
    '<path d="M4.6 6.5h.01M4.6 12h.01M4.6 17.5h.01"/>',
  ],
};

/** The icon for a guide, by its slug. The list icon if there is none. */
export function iconFor(slug) {
  return GUIDE_ICONS[slug] || GUIDE_ICONS.list;
}

/**
 * One icon, as the markup that shows it.
 *
 * `className` says where it is going, so the page can size it
 * differently in different places without another rule for each.
 * The picture is decoration — the words beside it say the same
 * thing — so it is hidden from a screen reader.
 */
export function iconSvg(slug, { className = 'guide__icon' } = {}) {
  return [
    `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor"`,
    ` stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`,
    iconFor(slug).join(''),
    '</svg>',
  ].join('');
}
