# 網站 SEO 維護指南

呢份文件講點樣維護 `tzero-jp.com` 嘅 SEO。
每樣嘢都由 script 生成，唔好手改生成出嚟嘅嘢 —— 手改嘅話下次跑 script 就會蓋返。

---

## 一眼睇晒

| 做咗啲乜 | 喺邊 |
|---|---|
| 每件貨一個實體頁（4 個） | `product-extra-lub.html` / `product-extended.html` / `product-studded.html` / `product-ultra-thin.html` |
| 三種語言各自一條 URL（10 頁 × 3 = 30 頁） | `scripts/gen-lang-pages.mjs` → `en/` `ja/` |
| 全文翻譯嘅細則頁（三種語言） | `assets/data/terms.json` |
| 全站共用一張 OG 圖（1200×630 PNG） | `assets/images/og-image.png` |
| 每個產品頁有 Product + Breadcrumb 結構化資料 | `scripts/gen-product-pages.mjs` |
| 常見問題寫死喺 HTML 入面（crawler 唔使跑 JS 都讀到） | `scripts/gen-faq-html.mjs` |
| 結構化資料寫死喺 HTML 入面（唔係靠 JS 補上） | `scripts/gen-jsonld.mjs` |
| FAQ 同 Products / LocalBusiness 結構化資料 | `assets/js/data.js`（`faqPage()`、`seo.jsonld.home`） |
| 最新動態嘅 ItemList | `scripts/sync-news-jsonld.mjs` |
| sitemap + 自動 lastmod | `scripts/update-sitemap.mjs` |
| 圖片壓縮（38 MB → 9 MB） | `scripts/compress-images.py` |
| 防漂移測試 | `scripts/lib/seo.test.mjs`、`scripts/lib/lang.test.mjs` |

---

## 一、隨時可以跑嘅命令

```bash
npm run gen:products   # 4 個產品頁
npm run gen:faq        # index.html 入面嘅常見問題
npm run gen:jsonld     # 各頁嘅結構化資料
npm run gen:lang       # 英文版同日文版嘅每一頁（en/ 同 ja/）
npm run seo:sync       # 最新動態嘅 ItemList
npm run sitemap        # sitemap.xml + lastmod
npm run seo:idempotent # 跑多次生成器，睇下會唔會變
npm run seo:check      # 上面全部 + 跑晒所有測試
```

`npm run seo:check` 係最值得跑嗰條 —— 一句就做晒所有生成，再跑 93 個測試，
最後仲會確認生成器跑兩次出嚟嘅嘢一模一樣。
改完任何 SEO 相關嘅嘢，跑一次佢。

**次序好緊要**：`gen:lang` 要喺 `gen:products` 同 `gen:jsonld` 之後，
因為語言頁係攞嗰啲生成好嘅最終 markup 去做翻譯。

> Deploy workflow 每次都會自動跑一次 `gen:products`、`gen:faq`、`gen:jsonld`、
> `gen:lang` 同 `sitemap`，所以就算邊次 commit 唔小心漏咗生成，
> 線上版本都唔會過期。

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

**淨係貼喺 root 嗰份 `index.html`** 就夠 —— Google 同 Bing 都係攞網域嘅主頁嚟驗證，
唔使喺 `en/` `ja/` 都加一份。

**DNS 驗證亦得，而且唔使改呢個檔** —— 去 DNS 加一條 TXT 記錄就得，
適合同時想驗證多個子網域嘅情況。

---

## 五、Sitemap 同 lastmod

`sitemap.xml` 由 `scripts/update-sitemap.mjs` 生成，**30 條 URL**（10 頁 × 3 種語言）：

```
/  products.html  product-extra-lub.html  product-extended.html
product-studded.html  product-ultra-thin.html  about.html
news.html  contact.html  terms.html

/en/  /en/products.html  /en/product-extra-lub.html  /en/product-extended.html
/en/product-studded.html  /en/product-ultra-thin.html  /en/about.html
/en/news.html  /en/contact.html  /en/terms.html

/ja/  /ja/products.html  /ja/product-extra-lub.html  /ja/product-extended.html
/ja/product-studded.html  /ja/product-ultra-thin.html  /ja/about.html
/ja/news.html  /ja/contact.html  /ja/terms.html
```

`lastmod` 係**最後一次改動嗰日**，由 git 歷史讀出嚟：

```bash
git log -1 --format=%cs -- index.html
```

所以要完整嘅 git history —— deploy workflow 嘅 `actions/checkout` 因此用咗
`fetch-depth: 0`。淺 clone 讀唔到日期。

> `en/` `ja/` 入面嘅生成檔**要 commit 入 repo**。日期係由 `git log` 讀返嚟，
> 冇 commit 嘅話佢哋嘅 `lastmod` 只會係「今日」，每次跑都唔同。
> （git 讀唔到日期嗰陣，script 會用今日做後備 —— 唔會壞，但日期唔准。）

每一條 URL 都仲帶住另外兩種語言嘅 `xhtml:link`，令爬蟲即刻知道三條地址
係同一頁：

```xml
<xhtml:link rel="alternate" hreflang="en" href="https://www.tzero-jp.com/en/terms.html"/>
```

`404.html` 同 `product.html` 唔喺 sitemap 入面（兩者都係 `noindex`），
`sync.test.mjs` 同 `seo.test.mjs` 會守住呢個規則。

---

## 六、三種語言，三條 URL

以前三種語言**共用同一條 URL**，只係喺瀏覽器入面用 `localStorage` 換。
爬蟲（Googlebot、Bingbot）唔跑 JavaScript、冇 localStorage、hash 又唔會傳去伺服器
—— 所以佢哋**永遠只見到中文版**，英文同日文版一次都收唔到。

更加糟嘅係 `hreflang`：四個 alternate 全部指向同一條 URL。
Google 要求 hreflang 指向**唔同** URL；全部指向同一條 = 互相矛盾 = 成組當冇，
仲等於話「呢一頁係英文版」但頁面其實係中文 —— 錯嘅訊號比完全冇 hreflang 更差。

### 而家

| 語言 | URL |
|---|---|
| 繁體中文 | `https://www.tzero-jp.com/`（維持不變） |
| English | `https://www.tzero-jp.com/en/` |
| 日本語 | `https://www.tzero-jp.com/ja/` |

中文留喺 root，所以現有 URL 一個都唔使改，唔會死任何一條舊連結。
GitHub Pages 自動用 `en/index.html` 應 `…/en/`，唔使改任何伺服器設定。

**每頁嘅文字都係 build 時間寫死落 HTML 嘅**，唔係靠 JavaScript 換。
爬蟲行唔行 JS 都見到同一份內容。

### 生成器

`scripts/gen-lang-pages.mjs` 擁有 `en/` 同 `ja/` 兩個目錄。佢每次由
**中文 source 頁**出發，依次做：

1. 換 `<html lang>` 加 `data-lang` 同 `data-lang-urls`
2. 換 `<title>` / `<meta name="description">`
3. 換 hreflang 四行（`zh-HK` / `en` / `ja-JP` / `x-default`；三種語言三條唔同嘅 URL，`x-default` 指向中文）
4. 換 JSON-LD
5. 語言掣由 `<button>` 變成 `<a href>`，指向**同一頁嘅下一種語言**
6. `data-i18n*` 標記 → 實字（跟 `assets/js/i18n.js` 嘅 `applyToDOM()` 語義）
7. 路徑改寫：`assets/…` → `../assets/…`

> **唔好手改 `en/` `ja/` 入面嘅檔。** 全部由 generator 產生，
> 跑一次 `npm run gen:lang` 就會蓋返。

### 語言掣

以前係一個 `<button>`，撳一下喺原地換文字。依家係 `<a href>` —— 撳一下真係去到
另一條 URL。兩個原因：分享出去嘅連結**一定**係同一個語言，
同埋搜尋引擎見得到三條唔同嘅頁。

### 舊嘅 `#lang=en` 連結

以前嘅分享連結係 `…/#lang=en`。而家 `assets/js/i18n.js` 見到 hash 入面有語言、
而同一頁嘅語言唔同，就會 `location.replace()` 跳去嗰個語言嘅真正 URL。
Google 唔理 hash，所以呢個改動對 SEO 冇影響。

**冇**加任何「有 cookie 就自動跳」嘅邏輯 —— 決定咗 URL 為準。
代價：之前撳過英文掣嘅訪客，下次返嚟會見返中文（要再撳一次）。

### 細則頁

`terms.html` 嘅內文原本係硬編碼中文，冇任何翻譯機制 ——
`en/terms.html` 會有 60 行中文。所以三種語言嘅法律文本搬咗去
`assets/data/terms.json`，由 `scripts/lib/terms.mjs` 砌成 HTML。

`assets/data/terms.json` **淨係喺 build 時間用**，瀏覽器唔會 load 佢。

### 守住唔會漂移

`scripts/lib/lang.test.mjs`（11 個測試）會捉住：

- 每頁喺每種語言都有版本，`data-i18n*` 一個都冇漏咗冇換
- 英文頁真係英文、日文頁真係日文（搵只有嗰種語言先有嘅字串）
- 三份法律頁形狀一樣（h2/h3/p/li 數目相同）
- canonical 指向自己、hreflang 三條 URL 各唔同
- 語言掣指向同一頁嘅下一種語言
- 頁面入面嘅連結唔會離開自己嘅語言資料夾
- 每個 `src` / `href` 指向嘅檔案真係喺度

`scripts/check-idempotent.mjs` 會跑多次生成器，確認輸出 byte-for-byte 一樣。

---

## 七、圖片壓縮

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

## 八、結構化資料

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

## 九、社交平台分享

`assets/images/og-image.png`（1200×630，PNG）全站共用。

**唔好用 SVG 做 og:image** —— Facebook、X、LinkedIn、WhatsApp 全部讀唔到 SVG。
`seo.test.mjs` 會守住呢一點。

改品牌圖之後：

```bash
node scripts/gen-og-image.mjs
```

---

## 十、仲未做嘅嘢

- **Google Business Profile** —— 上面有地址但冇 `geo` 座標（唔想亂填）。
  開咗 Business Profile 之後，可以拎返真實座標加落 `LocalBusiness`
- **真實用戶評價** —— 而家 Product 結構化資料入面嘅評價係示範內容。
  Google 會要求評價真係來自真實用戶先會顯示星星
- **產品列表 / 新聞列表寫死入 HTML** —— 而家呢兩份列表仍然係由 JavaScript 畫。
  結構化資料（ItemList）已經齊，所以唔急；做咗先對爬蟲更友好
- **搜尋 overlay 嘅文案翻譯** —— `輸入關鍵字搜尋產品或頁面`、`產品`、`頁面`
  呢幾個字硬編碼喺 `assets/js/main.js`，冇經 `data-i18n`，所以英文版同日文版
  嘅搜尋框仍然係中文
- **Core Web Vitals** —— 圖片壓完之後 LCP 應該大幅改善，
  上線後可以用 PageSpeed Insights 實測
