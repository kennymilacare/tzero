# T-ZERO 第九感 · 香港玻尿酸安全套品牌

A static, single-brand condom product website (T-ZERO 第九感) inspired by the editorial layout style of [aquabeat.hk](https://www.aquabeat.hk/).
Built with plain **HTML / CSS / JavaScript** — no build step, no framework, no dependencies beyond the Inter font.

## Features

- **Traditional Chinese + English + 日本語** with a cycling 3-way in-header language switcher (persists across reloads)
- **Homepage** — hero, featured product grid (4 items), brand story, FAQ accordion, contact form, newsletter footer
- **Catalog** (`products.html`) — full 4-product grid with type filters and sort dropdown
- **Product detail** (`product.html?id=…`) — generated from the same data module, links out to HKTVmall
- **About** + **404** — supporting pages
- **News** (`news.html`) — the Facebook + Instagram feed, auto-synced from the Page (see below)
- **HKTVmall integration** — every product card has a "Buy on HKTVmall" button that opens the external listing
- **Watsons retail badge** — the footer carries the Watsons logo and a "全線屈臣氏有售" line
- **Mobile-first** responsive layout — collapsible hamburger menu, 2-column product grid on mobile

## File Structure

```
.
├── index.html             # Home (hero + featured + FAQ + contact + footer)
├── products.html          # Full catalog with brand/type/sort
├── product.html           # Product detail (driven by ?id=)
├── about.html             # About + brand values + brand story
├── news.html              # Latest news (renders the Facebook feed)
├── contact.html           # Contact form + cards + map placeholder
├── terms.html             # Privacy policy + terms
├── 404.html               # Not-found page
├── assets/
│   ├── css/
│   │   ├── base.css       # Variables, reset, typography
│   │   ├── layout.css     # Header, footer, grids, hero
│   │   ├── components.css # Buttons, cards, badges, accordion, forms
│   │   └── pages.css      # Page-specific overrides
│   ├── data/
│   │   ├── site.json      # The Facebook Page + Instagram profile — the only place the handles live
│   │   ├── news.json      # Generated — the Facebook / Instagram feed the site renders
│   │   ├── manual.json    # Hand-written — paste posts here for the manual route
│   │   └── news.local.json# Hand-written — translations, curated posts
│   ├── js/
│   │   ├── data.js        # Products, FAQs, brands, translations
│   │   ├── i18n.js        # Language switcher
│   │   ├── main.js        # Header, mobile nav, reveal, newsletter
│   │   ├── news.js        # Renders the Facebook feed into the page
│   │   ├── products.js    # Catalog render/filter/sort
│   │   ├── product.js     # Detail-page render
│   │   ├── product-svg.js # SVG product mockup generator
│   │   ├── carousel.js    # Hero carousel
│   │   ├── splash.js      # Opening splash
│   │   ├── bubbles.js     # Homepage background bubbles
│   │   └── contact.js     # Form validation
│   └── images/            # banners, brand, couples, hero, icons, products
├── scripts/
│   ├── sync-facebook.mjs  # Pulls the Facebook + Instagram feed, writes news.json
│   ├── manual-post.mjs    # Turns assets/data/manual.json into the feed — no token needed
│   ├── ig-fetch.mjs       # Reads an IG post link → caption, image and date
│   ├── sync-social-links.mjs # Rewrites every social link to match site.json
│   ├── lib/feed.mjs       # Pure helpers (unit-tested)
│   ├── lib/site.mjs       # Reads the accounts from site.json
│   ├── lib/feed.test.mjs  # Unit tests for the helpers
│   ├── lib/site.test.mjs  # Fails if any social link drifts from site.json
│   ├── sync.test.mjs      # End-to-end test — runs the real script against a mock Graph API
│   └── manual-post.test.mjs # End-to-end test for the manual route
├── docs/
│   ├── facebook-sync.md   # Facebook / Instagram / Graph API setup guide
│   └── manual-posts.md    # Updating the feed by hand — no token, no CI
└── .github/workflows/
    ├── sync-facebook.yml  # Scheduled feed sync
    └── deploy-pages.yml   # Publishes the repo to GitHub Pages on every push
```

## Running Locally

The site is fully static. Open `index.html` directly in a browser, or serve the folder with any static server:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Then visit <http://localhost:8080>.

## Adding / Editing Products

All product data lives in [`assets/js/data.js`](assets/js/data.js). Each product has bilingual fields, an HKTVmall URL, brand ID, type, and dimensions. Adding a new product is a single object push to the `products` array — the homepage, catalog, and detail pages all pick it up automatically.

```js
{
  id: 'okamoto-001',
  brand: 'okamoto',
  name_zh: '岡本 0.01 水性聚氨酯',
  name_en: 'Okamoto 0.01 Hydro PU',
  price_hkd: 98,
  hktv_url: 'https://www.hktvmall.com/...',
  type: 'ultra-thin',   // ultra-thin | classic | textured | functional | sized
  popular: true,
}
```

## Translation

Translation strings live in `assets/js/data.js` in the `i18n` export. To add a new string:

```html
<span data-i18n="my.key">預設中文</span>
```

```js
i18n.zh.my.key = '預設中文';
i18n.en.my.key = 'English default';
```

`i18n.js` walks the DOM at load and on language change, swapping every `data-i18n`, `data-i18n-placeholder`, and `data-i18n-aria` element.

## Social Feed (Facebook + Instagram)

The "最新動態" pages are driven by `assets/data/news.json`. There are two ways
to fill it, and you can mix them.

### The accounts

Both social accounts live in one file — `assets/data/site.json`:

```json
{
  "facebook": "https://www.facebook.com/Tzerohk",
  "instagram": "https://www.instagram.com/tzerojp"
}
```

Nothing else hardcodes a handle. The scripts read this file to build feed
links, and `node scripts/sync-social-links.mjs` rewrites the links in the
HTML and the JSON-LD to match. A test fails if any link drifts, so you can
never end up with the site pointing at an account that no longer exists.

```bash
# after editing site.json
node scripts/sync-social-links.mjs
```

### Manual — no token, no CI, no GitHub

Paste the caption into `assets/data/manual.json`, run one command:

```bash
node scripts/manual-post.mjs
```

The first line of `text` becomes the headline (emoji, hashtags and the 【】
brackets Instagram likes are stripped), the rest becomes the excerpt, and
the post is dated and linked. Images can be a local path or an `https://` URL
— a remote one is downloaded into the repo, because Facebook's CDN links are
signed and expire.

If you only have the post link, `scripts/ig-fetch.mjs` reads the caption,
image and date for you:

```bash
node scripts/ig-fetch.mjs https://www.instagram.com/p/<code>/ && node scripts/manual-post.mjs
```

It takes as many links as you like in one go. Instagram's pages need
JavaScript to render, so it drives a headless Chrome over the DevTools
Protocol — Node's built-in WebSocket, no npm packages. The date comes out
of the post's own code, so it is exact rather than guessed. Re-running it
on the same link refreshes that post's caption and image without
touching any wording you wrote by hand.

Instagram hides some posts behind an age restriction, and a condom brand
gets flagged more often than not. `node scripts/ig-fetch.mjs --login`
opens a visible Chrome window once so you can sign in; the session is
kept in `.ig-profile/` (gitignored — it holds cookies) and every later run
picks it up.

Full guide: [`docs/manual-posts.md`](docs/manual-posts.md).

### Automatic — GitHub Actions + Graph API

A scheduled job pulls the latest posts from the T-ZERO Facebook Page and the
Instagram Business account linked to it, downloads their images into the repo,
and commits the result — the site itself stays fully static, with no backend
and no build step.

```
Facebook Page ┐
              ├→ Graph API → assets/data/news.json → assets/js/news.js → page
Instagram ────┘
```

- `scripts/sync-facebook.mjs` — the sync job (Node 18+, no dependencies)
- `assets/data/news.json` — generated; the page reads this
- `assets/data/news.local.json` — hand-written; EN/JA copy, curated posts, `hidden`, `pinned`
- `assets/js/news.js` — renders the cards and updates the JSON-LD
- `docs/facebook-sync.md` — how to create the Meta App and get a token

The page keeps its built-in cards if `news.json` is missing or unreachable, so
the site never breaks because of the feed. Instagram cards get their own icon,
heading and "view post" wording, and their *follow* button points at the
Instagram profile rather than the Facebook Page.

`news.html` currently shows **Instagram posts only**. Each `[data-news-list]`
container filters with `data-news-source` (`instagram`, `facebook`, or
`facebook,instagram`); drop the attribute to show everything. Curated brand
cards (HKTVmall) ignore the filter and always appear.

Manual posts are written back into `news.local.json`, so the two routes
coexist: a post added by hand survives the automatic sync.

### Deploying

Two workflows run in sequence:

| Workflow | When | What it does |
|---|---|---|
| `sync-facebook.yml` | 09:00 & 21:00 HK time, or manually | Pulls the feed and commits `news.json` + images |
| `deploy-pages.yml` | On every push to `main`, and after each sync run | Publishes the repo as-is to GitHub Pages |

The deploy workflow also listens for `workflow_run`, because GitHub
deliberately does not start a workflow run for a push made with the
default `GITHUB_TOKEN` — which is exactly how the sync job commits.

Because there is no build step, "deploying" just means publishing the folder.
If the site is hosted on Netlify / Vercel / Cloudflare Pages instead, delete
`deploy-pages.yml` and connect that host to the repository.

**The automatic route still needs setup** — the repo has been initialised but
not pushed. Follow `docs/facebook-sync.md` §7 to push it, then add the secrets
(`FB_USER_TOKEN`, `FB_APP_ID`, `FB_APP_SECRET`, optionally `FB_PAGE_ID` /
`FB_PAGE_TOKEN`) and run the workflow once by hand.

If the app is owned by whoever administers the Page, Business Verification is
*not* required. It only becomes mandatory when the app serves assets the
developer account does not own — see `docs/facebook-sync.md` §2.

### Tests

```bash
node --test scripts/lib/feed.test.mjs scripts/lib/site.test.mjs scripts/lib/ig.test.mjs scripts/sync.test.mjs scripts/manual-post.test.mjs
```

`sync.test.mjs` starts a mock `graph.facebook.com` and runs the **real** sync
script against it — token exchange, feed pull, Instagram pull, image download,
overrides, pinning and pruning all get exercised with no credentials and no
internet access. `manual-post.test.mjs` does the same for the manual route.
`site.test.mjs` fails if any social link in the HTML or the JSON-LD drifts
from `assets/data/site.json`. `ig.test.mjs` covers the link and date
arithmetic behind `ig-fetch.mjs`.

> **Never put a Facebook token in client-side code.** This site is fully
> static, so anything in a front-end file is public. Tokens live only in
> GitHub Secrets — see `docs/facebook-sync.md` §6.

## Design System

| Token              | Value      |
| ------------------ | ---------- |
| `--bg`             | `#FAF7F2` (cream) |
| `--primary`        | `#0F6E78` (deep teal) |
| `--accent`         | `#FF8A7A` (soft coral) |
| `--ink`            | `#1A1F2C` |
| `--font-sans`      | Inter + system fallback (PingFang HK / Microsoft JhengHei) |

All tokens live in [`base.css`](assets/css/base.css). Adjust there to retheme the site globally.

## Verification (manual)

1. Hero, product grid, FAQ, contact form all visible on `index.html`.
2. EN/中 toggle swaps every `data-i18n` string, persists across reloads.
3. `products.html` filters update the grid; sort dropdown reorders items.
4. `product.html?id=tzero-ultra-thin` renders the correct product.
5. "Buy on HKTVmall" buttons open in a new tab with `rel="noopener"`.
6. Mobile viewport (≤768 px): nav collapses, grid becomes 2-col.
7. Contact form: empty fields show error; valid submission shows success toast.
8. Newsletter form: invalid email rejected; valid email shows success toast.
9. Footer shows the opening hours with "(公眾假期除外)" on its own line, in all three languages.
10. Footer shows the Watsons logo badge in the 購物 column.

## Out of Scope

- No real checkout / payment — purchases link to HKTVmall
- No CMS — content lives in `data.js` (and `news.local.json` for the feed)
- No copyrighted brand imagery — all product visuals are generated SVG mockups
- No analytics / cookies