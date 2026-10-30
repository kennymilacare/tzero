# T-ZERO 第九感 · 香港玻尿酸安全套品牌

A static, single-brand condom product website (T-ZERO 第九感) inspired by the editorial layout style of [aquabeat.hk](https://www.aquabeat.hk/).
Built with plain **HTML / CSS / JavaScript** — no build step, no framework, no dependencies beyond the Inter font.

## Features

- **Traditional Chinese + English + 日本語** — each language has **its own URL** (`/`, `/en/`, `/ja/`), so a link you share always opens in the language you shared it in, and a crawler can actually reach the English and Japanese pages. The in-header switcher is a link to the same page in the next language. Every page's wording is written into the HTML at build time, not swapped in by JavaScript.
- **Homepage** — hero, featured product grid (4 items), brand story, FAQ accordion, contact form, newsletter footer
- **Catalog** (`products.html`) — full 4-product grid with type filters and sort dropdown
- **Product detail** — one real page per product (`product-ultra-thin.html`, `product-studded.html`, `product-extended.html`, `product-extra-lub.html`), each with its own canonical link and Product structured data; `product.html?id=…` stays as the legacy fallback for old links
- **About** + **404** — supporting pages
- **News** (`news.html`) — the Facebook + Instagram feed, auto-synced from the Page (see below)
- **HKTVmall integration** — every product card has a "Buy on HKTVmall" button that opens the external listing
- **Watsons retail badge** — the footer carries the Watsons logo and a "全線屈臣氏有售" line
- **Mobile-first** responsive layout — collapsible hamburger menu, 2-column product grid on mobile
- **SEO** — sitemap with automatic `lastmod`, structured data for the products, the FAQ, the news list and the business, one shared sharing image, a FAQ that is in the markup rather than drawn by JavaScript, and one URL per language with proper `hreflang`. See [`docs/seo.md`](docs/seo.md)

## File Structure

```
.
├── index.html             # Home (hero + featured + FAQ + contact + footer)
├── products.html          # Full catalog with brand/type/sort
├── product-ultra-thin.html# Product detail — 超薄
├── product-studded.html   # Product detail — 顆粒
├── product-extended.html  # Product detail — 持久
├── product-extra-lub.html # Product detail — 潤滑
├── product.html           # Legacy fallback for old product.html?id=… links (noindex)
├── about.html             # About + brand values + brand story
├── news.html              # Latest news (renders the Facebook feed)
├── contact.html           # Contact form + cards + map placeholder
├── terms.html             # Privacy policy + terms
├── 404.html               # Not-found page
├── sitemap.xml            # Generated — the pages a crawler should read
├── robots.txt             # Generated — points at the sitemap
├── 0e23179f….txt          # Built — the IndexNow key, at the site root where the search engine reads it
├── en/                    # Generated — the English version of every page
├── ja/                    # Generated — the Japanese version of every page
├── assets/
│   ├── css/
│   │   ├── base.css       # Variables, reset, typography
│   │   ├── layout.css     # Header, footer, grids, hero
│   │   ├── components.css # Buttons, cards, badges, accordion, forms
│   │   └── pages.css      # Page-specific overrides
│   ├── data/
│   │   ├── site.json      # The Facebook Page + Instagram profile + the site's own address
│   │   ├── news.json      # Generated — the Facebook / Instagram feed the site renders
│   │   ├── manual.json    # Hand-written — paste posts here for the manual route
│   │   ├── news.local.json# Hand-written — translations, curated posts
│   │   ├── terms.json     # The legal page, in three languages (build time only)
│   │   └── indexnow.json  # The IndexNow key — public, like a verification token
│   ├── js/
│   │   ├── data.js        # Products, FAQs, brands, translations
│   │   ├── i18n.js        # Language switcher
│   │   ├── paths.js       # Builds asset URLs that work from /en/ and /ja/ too
│   │   ├── main.js        # Header, mobile nav, reveal, newsletter
│   │   ├── news.js        # Renders the Facebook feed into the page
│   │   ├── products.js    # Catalog render/filter/sort
│   │   ├── product.js     # Detail-page render
│   │   ├── product-svg.js # SVG product mockup generator
│   │   ├── faq.js         # The FAQ accordion — shared by the page and the generators
│   │   ├── carousel.js    # Hero carousel
│   │   ├── splash.js      # Opening splash
│   │   ├── bubbles.js     # Homepage background bubbles
│   │   └── contact.js     # Form validation
│   └── images/            # banners, brand, couples, hero, icons, products, og-image.png
├── scripts/
│   ├── sync-facebook.mjs  # Pulls the Instagram feed, writes news.json
│   ├── manual-post.mjs    # Turns assets/data/manual.json into the feed — no token needed
│   ├── ig-fetch.mjs       # Reads an IG post link → caption, image and date
│   │                       # (--latest finds the newest posts by itself)
│   ├── sync-social-links.mjs # Rewrites every social link to match site.json
│   ├── set-site-url.mjs  # Moves the site to a new address — canonical, sitemap, robots
│   ├── gen-product-pages.mjs # Writes the four product pages
│   ├── gen-faq-html.mjs   # Writes the FAQ into index.html
│   ├── gen-jsonld.mjs     # Writes the structured data into the pages
│   ├── gen-lang-pages.mjs # Writes the English and Japanese version of every page
│   ├── gen-og-image.mjs   # Writes the sharing image
│   ├── sync-og-image.mjs  # Keeps the sharing image in step with the pages
│   ├── sync-news-jsonld.mjs # Writes the news ItemList into data.js
│   ├── update-sitemap.mjs # Writes sitemap.xml with the lastmod dates from git
│   ├── check-idempotent.mjs # Runs the generators twice and fails if the output changed
│   ├── indexnow.mjs       # Tells Bing and Yandex which pages changed
│   ├── set-verification.mjs # Puts the Search Console / Bing token in the home pages
│   ├── compress-images.py # Shrinks the images (--dry-run first!)
│   ├── lib/feed.mjs       # Pure helpers (unit-tested)
│   ├── lib/site.mjs       # Reads the accounts from site.json
│   ├── lib/siteurl.mjs    # Pure helpers for the site's own address
│   ├── lib/seo.mjs        # The FAQ block and the FAQPage node, one source for both
│   ├── lib/html.mjs       # Reads and rewrites HTML without a parser
│   ├── lib/langs.mjs      # The three languages, their URLs and the list of pages
│   ├── lib/langpage.mjs   # Builds one language page out of the Chinese one
│   ├── lib/terms.mjs      # The legal page, in three languages
│   ├── lib/pages.mjs      # Every page, and the files it shows
│   ├── lib/sitemap.mjs    # What the sitemap should say
│   ├── lib/indexnow.mjs   # The IndexNow request, in pure pieces
│   ├── lib/ig.mjs         # Pure helpers for the Instagram link and date arithmetic
│   ├── lib/chrome.mjs     # Drives a headless Chrome over the DevTools Protocol
│   ├── lib/feed.test.mjs  # Unit tests for the helpers
│   ├── lib/site.test.mjs  # Fails if any social link drifts from site.json
│   ├── lib/siteurl.test.mjs # Fails if any page drifts from the address in site.json
│   ├── lib/seo.test.mjs   # Fails if the markup and the structured data drift apart
│   ├── lib/ig.test.mjs    # Unit tests for the Instagram helpers
│   ├── lib/lang.test.mjs  # Fails if a language page is not really in that language
│   ├── lib/submit.test.mjs # Fails if a search engine could not find or trust the site
│   ├── sync.test.mjs      # End-to-end test — runs the real script against a mock Graph API
│   └── manual-post.test.mjs # End-to-end test for the manual route
├── docs/
│   ├── instagram-sync.md  # Instagram / Graph API setup guide
│   ├── manual-posts.md    # Updating the feed by hand — no token, no CI
│   └── seo.md             # What the SEO work is, and how to keep it
└── .github/workflows/
    ├── sync-instagram.yml # Graph API feed sync (schedule off — no token yet)
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

**Each language has its own URL.** The URL decides what you see — there is no
cookie and no auto-redirect, so a link you share always opens in the language
you shared it in.

| Language | URL |
|---|---|
| 繁體中文 | `/` |
| English | `/en/` |
| 日本語 | `/ja/` |

The Chinese pages are the hand-written source. The English and Japanese pages
are **generated** from them by `scripts/gen-lang-pages.mjs` — every page's
wording is written into the HTML at build time, so a crawler that never runs
JavaScript still reads the right language. Do not edit `en/` or `ja/` by hand;
the generator overwrites them.

Translation strings live in `assets/js/data.js` in the `i18n` export. To add a new string:

```html
<span data-i18n="my.key">預設中文</span>
```

```js
i18n.zh.my.key = '預設中文';
i18n.en.my.key = 'English default';
i18n.ja.my.key = 'デフォルト';
```

`i18n.js` walks the DOM at load and swaps every `data-i18n`,
`data-i18n-placeholder`, and `data-i18n-aria` element — that is what puts the
Chinese text in place on the Chinese pages. The generator does the same thing
at build time for the other two languages, so the two never disagree.

After changing any string, regenerate the other languages:

```bash
npm run gen:lang
```

The legal page (`terms.html`) is a long piece of writing rather than a set of
labels, so its three versions live in `assets/data/terms.json` and are
rendered by `scripts/lib/terms.mjs`.

`scripts/lib/lang.test.mjs` fails if a language page is not really in that
language, if a translation marker was left in a generated page, or if the
`hreflang` links do not point at three different addresses.

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

If you have already signed in, you do not have to paste links at all —
`--latest` reads the account's own profile page and picks up the newest
posts by itself, skipping the ones already stored:

```bash
node scripts/ig-fetch.mjs --latest && node scripts/manual-post.mjs
```

Instagram hides some posts behind an age restriction, and a condom brand
gets flagged more often than not. `node scripts/ig-fetch.mjs --login`
opens a visible Chrome window once so you can sign in; the session is
kept in `.ig-profile/` (gitignored — it holds cookies) and every later run
picks it up.

Full guide: [`docs/manual-posts.md`](docs/manual-posts.md).

### Automatic — GitHub Actions + Graph API (not enabled yet)

A scheduled job would pull the latest posts from the T-ZERO Instagram Business
account, download their images into the repo, and commit the result — the site
itself stays fully static, with no backend and no build step.

```
Instagram ─→ Graph API → assets/data/news.json → assets/js/news.js → page
```

- `scripts/sync-facebook.mjs` — the sync job (Node 18+, no dependencies)
- `assets/data/news.json` — generated; the page reads this
- `assets/data/news.local.json` — hand-written; EN/JA copy, curated posts, `hidden`, `pinned`
- `assets/js/news.js` — renders the cards and updates the JSON-LD
- `docs/instagram-sync.md` — how to create the Meta App and get a token

**This route is not switched on.** It needs a Meta App and a token, and
neither is set up — so the schedule in `sync-instagram.yml` is off and the
workflow can only be run by hand. Until then the feed is updated the other
way, with the saved Instagram session:

```bash
node scripts/ig-fetch.mjs --latest && node scripts/manual-post.mjs
```

That route cannot run in GitHub Actions: `.ig-profile/` holds session cookies
and this repository is public, so it can never be committed. A token in GitHub
Secrets has no such problem.

Only Instagram is synced. The Facebook Page's own posts are not fetched
(`FB_INCLUDE_FB=0`); the Page is still read, because that is how Meta links an
Instagram account to a Page. The Facebook link itself stays on the site as a
social button.

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
| `sync-instagram.yml` | Manually (the schedule is off — no token is set up) | Pulls the feed and commits `news.json` + images |
| `deploy-pages.yml` | On every push to `main`, and after each sync run | Publishes the repo as-is to GitHub Pages |

The deploy workflow also listens for `workflow_run`, because GitHub
deliberately does not start a workflow run for a push made with the
default `GITHUB_TOKEN` — which is exactly how the sync job commits.

Because there is no build step, "deploying" just means publishing the folder.
If the site is hosted on Netlify / Vercel / Cloudflare Pages instead, delete
`deploy-pages.yml` and connect that host to the repository.

**First time only:** in the repo, **Settings → Pages → Source → GitHub
Actions** (not "Deploy from a branch"), then Save. The first deploy runs on
the next push.

**The automatic route still needs its secrets.** The site is already deployed
at <https://www.tzero-jp.com/> — but the sync job cannot pull anything until
the secrets exist: add `FB_USER_TOKEN`, `FB_APP_ID`, `FB_APP_SECRET` (and
optionally `FB_PAGE_ID`) under **Settings → Secrets and variables → Actions**,
then run **Sync Instagram news** once by hand. See `docs/instagram-sync.md`.

If the app is owned by whoever administers the Page, Business Verification is
*not* required. It only becomes mandatory when the app serves assets the
developer account does not own — see `docs/instagram-sync.md` §2.

### The site's own address

The site is static, so its address is written literally into every page
(`canonical`, `hreflang`, `og:url`), into `sitemap.xml` and into `robots.txt`.
It lives in one place — `assets/data/site.json` — and one command moves it:

```bash
node scripts/set-site-url.mjs https://tzerohk.com
```

That rewrites all of them at once and records the new address in `site.json`.
`scripts/lib/siteurl.test.mjs` fails if any page is left pointing at the old
one, so a half-finished move cannot slip through.

### Tests

```bash
npm test
```

which runs:

```bash
node --test scripts/lib/feed.test.mjs scripts/lib/site.test.mjs scripts/lib/siteurl.test.mjs scripts/lib/ig.test.mjs scripts/lib/seo.test.mjs scripts/lib/lang.test.mjs scripts/lib/submit.test.mjs scripts/sync.test.mjs scripts/manual-post.test.mjs
```

`sync.test.mjs` starts a mock `graph.facebook.com` and runs the **real** sync
script against it — token exchange, feed pull, Instagram pull, image download,
overrides, pinning and pruning all get exercised with no credentials and no
internet access. `manual-post.test.mjs` does the same for the manual route.
`site.test.mjs` fails if any social link in the HTML or the JSON-LD drifts
from `assets/data/site.json`. `ig.test.mjs` covers the link and date
arithmetic behind `ig-fetch.mjs`. `seo.test.mjs` fails if the markup and the
structured data drift apart, if a page loses its canonical link or its
sharing image, or if the sitemap lists a page that does not exist.
`lang.test.mjs` fails if a language page is not really in that language, if a
translation marker survived into a generated page, if the `hreflang` links
point at the same address, or if a link leaves its own language folder.
`submit.test.mjs` fails if the sitemap on disk is not what the generator would
write, if the IndexNow key file is not where a search engine looks for it, or
if the verification token is on one home page and not the other two.

> **Never put a Facebook token in client-side code.** This site is fully
> static, so anything in a front-end file is public. Tokens live only in
> GitHub Secrets — see `docs/instagram-sync.md` §6.

### SEO

The SEO work — one page per product, one URL per language, the shared sharing
image, the FAQ in the markup, the structured data, the sitemap and the image
compression — is written up in [`docs/seo.md`](docs/seo.md). The short version:

```bash
npm run seo:check   # regenerate everything, then run the tests
```

Every generated file says so in a comment at the top. If a file says
`GENERATED FILE — do not edit by hand`, change the script or the data it
reads from and run it again — editing the file by hand is undone the next
time anyone runs the generator.

### Getting found

Two things tell a search engine the site exists.

**Proving the site is yours** — a token from Google Search Console or Bing
Webmaster Tools, pasted in by one command:

```bash
node scripts/set-verification.mjs --google <token>
node scripts/set-verification.mjs --bing <token>
```

It writes the token into all three home pages and keeps it in
`assets/data/site.json`, so there is one place to change it. These tokens
are public — they are meant to be read by the search engine on a public
page. The tokens that must never be published are the Facebook token and
the app secret, which live in GitHub Secrets.

**Telling it what changed** — IndexNow, which needs no account at all:

```bash
npm run indexnow       # the pages that changed since the last commit
npm run indexnow:all   # every address on the site
```

The deploy workflow runs it for you after every push, so Bing and Yandex
hear about a change the moment it goes live. Google does not read
IndexNow — it finds new pages through `sitemap.xml`, which `robots.txt`
already points at.

> The old "ping your sitemap" endpoints are dead: `bing.com/ping` answers
> 410 and `google.com/ping` answers 404. IndexNow replaced them.

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
2. The language switcher is a link: from `/` it goes to `/en/`, from `/en/` to `/ja/`, from `/ja/` back to `/`. Each of those pages reads in its own language.
3. `products.html` filters update the grid; sort dropdown reorders items.
4. Each of `product-ultra-thin.html`, `product-studded.html`, `product-extended.html`, `product-extra-lub.html` renders its own product, with its own title and price.
5. The FAQ questions are visible in `index.html` with JavaScript switched off (they are in the markup, not drawn by a script).
6. "Buy on HKTVmall" buttons open in a new tab with `rel="noopener"`.
7. Mobile viewport (≤768 px): nav collapses, grid becomes 2-col.
8. Contact form: empty fields show error; valid submission shows success toast.
9. Newsletter form: invalid email rejected; valid email shows success toast.
10. Footer shows the opening hours with "(公眾假期除外)" on its own line, in all three languages.
11. Footer shows the Watsons logo badge in the 購物 column.

## Out of Scope

- No real checkout / payment — purchases link to HKTVmall
- No CMS — content lives in `data.js` (and `news.local.json` for the feed)
- No copyrighted brand imagery — all product visuals are generated SVG mockups
- No analytics / cookies