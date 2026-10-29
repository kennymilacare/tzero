---
name: ui-review
description: Review UI changes in the T-ZERO 第九感 static site against the project's design rules and brand conventions. Use after editing HTML, CSS, or any component that affects layout, color, typography, or i18n. Trigger with /ui-review.
---

# UI Review — T-ZERO 第九感

Review UI work against the project's codified conventions. Read-only by default; flag violations, don't rewrite.

## When to run

- After any HTML / CSS / component edit
- After adding a new section, card, or page
- After copy changes that affect hero, headlines, or product cards
- Before declaring a feature done

## Brand tokens (must match)

Source of truth: `assets/css/base.css`. Never introduce new hex codes.

| Token             | Value      | Use                              |
| ----------------- | ---------- | -------------------------------- |
| `--bg`            | `#F8EFE0`  | Page canvas (warm cream)         |
| `--surface`       | `#FFFAF2`  | Cards, modals (warm white)       |
| `--surface-2`     | `#F2E5CC`  | Muted section bg (warm sand)     |
| `--ink`           | `#2B1F18`  | Headings, body (warm dark brown) |
| `--ink-soft`      | `#6E5944`  | Captions (warm taupe)            |
| `--ink-muted`     | `#A08872`  | Disabled / hint (warm tan)       |
| `--primary`       | `#B8553A`  | Terracotta — primary CTA, links  |
| `--primary-dark`  | `#953F26`  | Hover state                      |
| `--primary-soft`  | `#F5DDC8`  | Soft peach background            |
| `--accent`        | `#E58A4A`  | Warm honey — tags, focus         |
| `--accent-soft`   | `#FAE3CB`  | Soft amber                       |
| `--border`        | `#E8D9C0`  | Card / form borders              |
| `--border-strong` | `#C7B393`  | Stronger dividers                |
| `--success`       | `#3D8050`  | Toasts                           |
| `--warning`       | `#D49234`  | Warnings                         |
| `--danger`        | `#B8351E`  | Errors                           |

If a one-off color appears more than twice, promote it to a token.

## Typography

- **Latin**: Inter`, weights 400/500/600/700
- **CJK**: system stack — PingFang HK, Microsoft JhengHei
- Hero H1: `clamp(1.5rem, 3.5vw, 2.125rem)` — do not exceed 2.125rem on desktop
- Body: 16px / 1.6 line-height
- Eyebrow: 12-13px, uppercase / letter-spaced, `--ink-soft`

## Spacing rhythm

- Section vertical padding: 96px desktop, 56px mobile
- Container max-width: 1200px, 24px gutter
- Card padding: 24px
- Use spacing tokens (`--space-1`…`--space-9`), never raw px

## i18n rules

- Every user-facing string has `data-i18n` attribute
- Three languages: `zh-HK` (default), `en`, `ja-JP`
- localStorage key: `tzero.lang` (never `aura.*`)
- Never hardcode Chinese / English / English in JS-rendered content — use `data.js` `i18n` exports
- Hero H1 + subtitle use **full-width** Chinese punctuation: `，`, `：`, `｜`
- Brand eyebrow uses **uppercase** "T-ZERO"; H1 uses mixed-case "T-zero" (matches docx verbatim)

## Component conventions

- `.btn--primary` = teal, `.btn--outline` = bordered, `.btn--ghost` = text only
- Product card: SVG mockup, badge, name (zh), sub (en/JP), HKTVmall CTA
- Every external "Buy on HKTVmall" link uses `target="_blank" rel="noopener"`
- Header brand cluster: T-Zero logo PNG (56 / 64 / 72 px responsive), not text wordmark
- Footer brand: text "T-ZERO 第九感"

## Responsive checks

- 320px: no horizontal scroll, nav collapses
- 768px: 2-col grids flip to 2-col, hero stacks
- 960px: brand logo bumps to 72px
- 1200px: container caps at 1200px

## Review checklist

When reviewing changes, verify each item. Report findings as:

- ✅ pass — no action
- ⚠ warning — explain why
- ❌ fail — line number + fix

1. No new hex codes introduced (or promoted to a token)
2. Hero H1 ≤ 2.125rem on desktop
3. All new strings have `data-i18n` and entries in `data.js` for zh/en/ja-JP
4. Full-width punctuation in hero copy (`，` `：` `｜`)
6. Buttons use existing variants; no one-off styles
7. Spacing uses tokens, not raw px
8. Mobile viewport (375px): no overflow, nav collapses, hero readable
9. External links have `rel="noopener"`
10. Brand casing: eyebrow = "T-ZERO" (uppercase); hero copy = "T-zero" (mixed-case, matches docx)

## Do NOT do

- Don't auto-fix — report findings and wait for confirmation
- Don't change design tokens without explicit user approval
- Don't add new colors as one-offs
- Don't introduce build tools, frameworks, or CSS preprocessors