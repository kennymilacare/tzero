# 網站 SEO 維護指南

呢份文件講點樣維護 `tzero-jp.com` 嘅 SEO。
每樣嘢都由 script 生成，唔好手改生成出嚟嘅嘢 —— 手改嘅話下次跑 script 就會蓋返。

---

## 一眼睇晒

| 做咗啲乜 | 喺邊 |
|---|---|
| 每件貨一個實體頁（4 個） | `product-extra-lub.html` / `product-extended.html` / `product-studded.html` / `product-ultra-thin.html` |
| 全站共用一張 OG 圖（1200×630 PNG） | `assets/images/og-image.png` |
| 每個產品頁有 Product + Breadcrumb 結構化資料 | `scripts/gen-product-pages.mjs` |
| 常見問題寫死喺 HTML 入面（crawler 唔使跑 JS 都讀到） | `scripts/gen-faq-html.mjs` |
| 結構化資料寫死喺 HTML 入面（唔係靠 JS 補上） | `scripts/gen-jsonld.mjs` |
| FAQ 同 Products / LocalBusiness 結構化資料 | `assets/js/data.js`（`faqPage()`、`seo.jsonld.home`） |
| 最新動態嘅 ItemList | `scripts/sync-news-jsonld.mjs` |
| sitemap + 自動 lastmod | `scripts/update-sitemap.mjs` |
| 圖片壓縮（38 MB → 9 MB） | `scripts/compress-images.py` |
| 防漂移測試 | `scripts/lib/seo.test.mjs` |

---

## 一、隨時可以跑嘅命令

```bash
npm run gen:products   # 4 個產品頁
npm run gen:faq        # index.html 入面嘅常見問題
npm run gen:jsonld     # 各頁嘅結構化資料
npm run seo:sync       # 最新動態嘅 ItemList
npm run sitemap        # sitemap.xml + lastmod
npm run seo:check      # 上面全部 + 跑晒所有測試
```

`npm run seo:check` 係最值得跑嗰條 —— 一句就做晒所有生成，再跑 78 個測試。
改完任何 SEO 相關嘅嘢，跑一次佢。

> Deploy workflow 每次都會自動跑一次 `gen:products`、`gen:faq` 同 `sitemap`，
> 所以就算邊次 commit 唔小心漏咗生成，線上版本都唔會過期。

---

## 二、四個產品頁

以前全部貨都係 `product.html?id=xxx`。四條 URL 有同一個 canonical link，
crawler 分唔出係四件唔同嘅貨 —— 佢只會收一件，其餘三件當 duplicate 掉。

而家每件貨一個檔案：

```
product-ultra-thin.html    ← 超薄
product-studded.html       ← 顆粒
product-extended.html      ← 持久
product-extra-lub.html     ← 潤滑
```

每頁自己帶 title、description、canonical、`og:url`、hreflang，
同埋 Product 結構化資料（sku、價錢、貨架狀態、評分、評價、麵包屑）。

`product.html` 本身仲喺度 —— 舊連結（`product.html?id=`）唔會死，
但佢而家係 `noindex,follow`，亦唔喺 sitemap 入面，避免同四個新頁重複。

**加新產品**：喺 `assets/js/data.js` 嘅 `products` 加一個 object，然後

```bash
node scripts/gen-product-pages.mjs
```

新頁會自動出現，sitemap 亦會自己更新。

---

## 三、常見問題（FAQ）

之前個 FAQ 係 JavaScript 先畫出嚟，一個唔跑 script 嘅 crawler 只會見到一個空盒；
而結構化資料入面嘅問題同頁面顯示嘅亦唔一樣。

而家：

- 問題寫死喺 `index.html` 入面（`scripts/gen-faq-html.mjs` 生成）
- 頁面載入之後用 JavaScript 換返做訪客嗰種語言
- 結構化資料嘅 `FAQPage` 由 `data.js` 嘅 `faqs` 直接生成

**三邊都係同一份 `faqs`**，所以佢哋冇可能「漂移」。
改問題 → 改 `assets/js/data.js` 嘅 `faqs` → 跑 `npm run gen:faq`。

---

## 四、Google / Bing 驗證

`index.html` 入面 `<meta name="robots">` 下面有兩行註釋咗嘅 meta tag：

```html
<!-- <meta name="google-site-verification" content="PASTE_TOKEN_HERE"> -->
<!-- <meta name="msvalidate.01" content="PASTE_TOKEN_HERE"> -->
```

**Google**：
[search.google.com/search-console](https://search.google.com/search-console) →
設定 → 網域驗證 → HTML 標記驗證 → 貼 token 入去。

**Bing**：
[bing.com/webmasters](https://www.bing.com/webmasters) →
設定 → 網站驗證 → Meta 標記 → 貼 token 入去。

貼完之後，刪走嗰行嘅 `<!--` 同 `-->` 就得，唔使郁其他嘢。

**DNS 驗證亦得，而且唔使改呢個檔** —— 去 DNS 加一條 TXT 記錄就得，
適合同時想驗證多個子網域嘅情況。

---

## 五、Sitemap 同 lastmod

`sitemap.xml` 由 `scripts/update-sitemap.mjs` 生成，10 條 URL：

```
/  products.html  product-extra-lub.html  product-extended.html
product-studded.html  product-ultra-thin.html  about.html
news.html  contact.html  terms.html
```

`lastmod` 係**最後一次改動嗰日**，由 git 歷史讀出嚟：

```bash
git log -1 --format=%cs -- index.html
```

所以要完整嘅 git history —— deploy workflow 嘅 `actions/checkout` 因此用咗
`fetch-depth: 0`。淺 clone 讀唔到日期。

`404.html` 同 `product.html` 唔喺 sitemap 入面（兩者都係 `noindex`），
`sync.test.mjs` 同 `seo.test.mjs` 會守住呢個規則。

---

## 六、圖片壓縮

原本成個網站 38 MB，最重嗰張 banner 5.6 MB。壓完之後 9 MB。

```bash
python scripts/compress-images.py --dry-run   # 只睇計劃，唔郁任何嘢
python scripts/compress-images.py --apply     # 真係做
```

`--dry-run` 會印出每個檔案改前改後大細、刪邊啲檔、HTML 入面啲引用點改。
**跑 `--apply` 之前先睇清楚嗰張清單。**

- 相片用 JPEG quality 82
- 有細字嘅圖表（`lubricant-comparison`、`hyaluronic-acid`）用 quality 90 + 4:4:4 ，
  免得細字變晒
- PNG 轉 JPEG 嘅話，script 會順手改返 HTML / CSS 入面嘅引用

`og-image.png` 唔會郁 —— 社交平台對分享圖嘅壓縮比較敏感。

---

## 七、結構化資料

> **呢一節最易整錯。** 之前啲頁面嘅 JSON-LD 係一個**空嘅** `<script>` tag，
> 內容由 JavaScript 執行時先填入。即係話：唔跑 script 嘅 crawler
> （大部分 crawler 都係咁，同埋所有睇 rich result 嘅都係咁）
> 見到嘅係**乜都冇** —— 一個空嘅 `ld+json` block仲比冇更差，
> 解析器讀唔到就可能成頁嘅結構化資料都唔要。
>
> 而家 `scripts/gen-jsonld.mjs` 會把中文版本寫死入 HTML 入面，
> 頁面載入之後照舊會換成訪客嗰種語言。爬蟲見到嘅係完整嘅嘢。

每一頁都有結構化資料：

| 頁 | 內容 |
|---|---|
| `index.html` | LocalBusiness、WebSite、BreadcrumbList、FAQPage |
| `products.html` | BreadcrumbList、ItemList（4 件貨） |
| `product-*.html` | BreadcrumbList、Product（sku、價錢、貨架、評分、評價） |
| `news.html` | BreadcrumbList、ItemList（最新貼文） |
| `about.html` | BreadcrumbList、WebPage |
| `contact.html` | BreadcrumbList、ContactPage（指返間舖） |
| `terms.html` | BreadcrumbList、WebPage |

`about` / `contact` / `terms` 嗰三頁嘅標題同描述係**直接由頁面自己讀出嚟**，
所以結構化資料唔可能同頁面講緊唔同嘅嘢。

`assets/js/data.js` 入面 `i18n.<lang>['seo.jsonld.home']` 同
`i18n.<lang>['seo.jsonld.news']` 兩個 graph：

- **LocalBusiness** —— 本身係做本地生意，記埋地址同營業時間：
  九龍觀塘海傍道 173 號 D.J. 大廈 5 樓，逢一至五 10:00–18:00
- **FAQPage** —— 由 `faqs` 生成
- **ItemList** —— 最新動態，每篇一條 `ListItem`，
  `itemListOrder` 用 `https://schema.org/ItemListOrderDescending`
  （schema.org 真正定義嘅係 `ItemListOrderDescending`，唔係 `itemListOrderDescending`）

`assets/js/news.js` 喺 runtime 亦會更新同一個 ItemList，
所以爬蟲行 JS 同唔行 JS 都見到同一份內容。

---

## 八、社交平台分享

`assets/images/og-image.png`（1200×630，PNG）全站共用。

**唔好用 SVG 做 og:image** —— Facebook、X、LinkedIn、WhatsApp 全部讀唔到 SVG。
`seo.test.mjs` 會守住呢一點。

改品牌圖之後：

```bash
node scripts/gen-og-image.mjs
```

---

## 九、仲未做嘅嘢

- **Google Business Profile** —— 上面有地址但冇 `geo` 座標（唔想亂填）。
  開咗 Business Profile 之後，可以拎返真實座標加落 `LocalBusiness`
- **真實用戶評價** —— 而家 Product 結構化資料入面嘅評價係示範內容。
  Google 會要求評價真係來自真實用戶先會顯示星星
- **多語言版本嘅獨立 URL** —— 而家三種語言係同一個 URL 用 `localStorage` 切換，
  爬蟲見到嘅永遠係中文版。想三種語言各自被收錄，就要拆做 `/en/`、`/ja/` 獨立頁
- **Core Web Vitals** —— 圖片壓完之後 LCP 應該大幅改善，
  上線後可以用 PageSpeed Insights 實測
