# 手動更新 Facebook / Instagram 貼文

唔想搞 GitHub、唔想搞 token、淨係想有新貼文就更新網站 —— 用呢個方法。

```
你貼文落 assets/data/manual.json
        │
        ▼
node scripts/manual-post.mjs
        │
        ▼
assets/data/news.json  ←  網站讀呢個
```

全部離線、冇 token、冇 CI。改完跑一行 command 就上咗。

---

## 點用

**1. 開 `assets/data/manual.json`**（VS Code 直接開就得）

**2. 加一個 post object：**

```json
{
  "date": "2026-10-28",
  "text": "新裝上市 🎉\n全線產品換上全新包裝，樽身更透明，凸點一目了然。\n#Tzero",
  "url": "https://www.facebook.com/Tzerohk/posts/1234567890",
  "source": "Facebook",
  "image": "assets/images/banners/carousel/11.jpg"
}
```

**3. 跑：**

```bash
node scripts/manual-post.mjs
```

搞掂。撳一下個 dev server 嘅 refresh 就見到。

---

## 每個欄位

| 欄位 | 必需？ | 講解 |
|---|---|---|
| `date` | ✅ | 貼文日期 `YYYY-MM-DD`。卡片按呢個排序 |
| `text` | ✅ | **貼文全文，直接 copy 過嚟就得。** 第一行自動變標題、emoji 同 #hashtag 會自動剝走，其餘變摘要 |
| `url` | ✅ | 貼文連結。撳「查看貼文」會跳去呢度 |
| `source` | | `Facebook`（預設）或者 `Instagram`。決定用邊個 icon 同埋「追蹤」按鈕指向邊度 |
| `image` | | 圖片。本機路徑（`assets/images/news/xxx.jpg`）或者直接填 `https://` 網址 —— 填網址嘅話 script 會下載返存喺 repo（FB / IG 個 CDN 連結會過期） |
| `title_en` / `excerpt_en` | | 英文版文案。冇填嘅話英文版會顯示中文原文 |
| `title_ja` / `excerpt_ja` | | 日文版文案 |

> `text` **唔使改**。第一行當標題、其餘當摘要 —— 就算你 copy 成段 caption
> 落嚟都得，script 會自己拆。

### 圖片點處理

- **有本機圖**：放低喺 `assets/images/news/`，然後填 `"image": "assets/images/news/xxx.jpg"`。
- **淨係有 FB / IG 個 CDN 網址**：直接填落 `image`，script 會自動下載。
  一定要咁做 —— 嗰啲網址係簽名過嘅，幾個星期後就 403 死咗。
- **下載完之後**：記得返去 `manual.json` 將 `image` 改成 script 話你知嗰條
  本機路徑（`assets/images/news/xxx.jpg`）。咁下次再跑就唔會再上網，
  就算 IG 個連結過期咗都唔會有問題。
- **冇圖都得**：卡片會顯示一個品牌色嘅漸層面板，唔會有空雞。

---

## news.html 淨係顯示 Instagram 貼文

而家 [news.html](../news.html) 個貼文列表淨係出 **Instagram** 貼文。
想 Facebook 貼文都出，改 `news.html` 一個 attribute 就得 —— 唔使改 script：

```html
<!-- 而家咁樣（淨係 IG） -->
<div class="container" data-news-list data-news-limit="8" data-news-source="instagram">

<!-- 兩個都要 -->
<div class="container" data-news-list data-news-limit="8" data-news-source="facebook,instagram">

<!-- 全部都要（刪走 data-news-source 就得） -->
<div class="container" data-news-list data-news-limit="8">
```

| `data-news-source` | 效果 |
|---|---|
| `instagram` | 淨係出 Instagram 貼文 |
| `facebook` | 淨係出 Facebook 貼文 |
| `facebook,instagram` | 兩個都要 |
| 唔填 | 全部都要 |

**自訂卡片唔受影響** —— 例如「正式登陸 HKTVmall」嗰張，source 唔係 Facebook /
Instagram，所以唔會俾呢個 filter 篩走。

`index.html` 嘅「最新動態」欄冇呢個 filter（只係 `data-news-limit="1"`），
所以最新嗰張貼文係 FB 定 IG 都照顯示。

> 記得改完 bump 一下 cache 版本：`news.html` 入面 `news.js?v=6` → `?v=7`。

---

## 一頁出幾多張？

`data-news-limit` 一個數字就夠：

| 頁面 | 而家 | 改點樣 |
|---|---|---|
| `news.html` | `4` | 改 `data-news-limit="4"` 個數字 |
| `index.html` | `1` | 改 `data-news-limit="1"` 個數字 |

**超出去嘅貼文唔會冇咗** —— 全部仲喺 `manual.json` 同 `news.local.json` 度，
只係頁面淨係顯示最新嗰幾張。想改顯示數量就撳 `data-news-limit` 個數字。

### 自訂卡片唔會俾新貼文推走

`news.html` 個列表有 `data-news-keep-curated`：

```html
<div class="container" data-news-list data-news-limit="4" data-news-source="instagram" data-news-keep-curated>
```

有咗呢個 attribute，`data-news-limit` 就**淨係計社交貼文** —— 自訂卡片
（例如「正式登陸 HKTVmall」）另外計，無論幾多新貼文都照顯示。
即係話 `data-news-limit="4"` = 最多 4 張 IG 貼文 + 自訂卡片。

`index.html` 冇呢個 attribute，所以「最新動態」永遠淨係顯示 1 張。

---

## 淨係想俾條連結就得

如果你只有 IG 貼文連結（唔想或者唔記得抄 caption）：

```bash
node scripts/ig-fetch.mjs https://www.instagram.com/p/De_a7-Yks0Z/
```

可以一次過俾多條：

```bash
node scripts/ig-fetch.mjs \
  https://www.instagram.com/p/AAAA/ \
  https://www.instagram.com/p/BBBB/ \
  https://www.instagram.com/p/CCCC/
```

或者將連結一條行一條寫入個 txt 檔再跑：

```bash
node scripts/ig-fetch.mjs --file urls.txt
```

Script 會自己讀到：

- **caption**（全文，帳號名嗰行會自動剝走）
- **圖片**（下載咗存喺 `assets/images/news/ig-<日期>-<編號>.jpg`，唔會過期）
- **日期**（由貼文短碼解出嚟，準確唔使估）
- **帳號**（`assets/data/site.json` 入面嗰個）

跟住自動寫入 `manual.json`。**跟住記得跑 `node scripts/manual-post.mjs`**
（或者用下面呢個一條龍版本）：

```bash
node scripts/ig-fetch.mjs <連結> && node scripts/manual-post.mjs
```

> **標題同摘要：script 唔會寫入 `manual.json`。** 佢哋係由 caption 推導出嚟
> （`manual-post.mjs` 嚟做），所以第一行係「【返工已經夠乾…】」嘅話，
> 標題會變成「返工已經夠乾…」（【】同 emoji 自動剝走）。
> 如果你自己改過 `title_zh` / `excerpt_zh` / `title_en` / `excerpt_en`，
> **下次再跑 `ig-fetch` 唔會洗走你寫嘅字** —— 佢只會更新 caption 同圖片。

> **要部 Chrome。** Instagram 嘅公開頁面要 JavaScript 先 render 到內容，
> 所以呢個 script 會開一個無頭 Chrome（用 DevTools Protocol，唔使 npm
> install 任何嘢）。冇 Chrome 嘅話佢會直接話你知。
> `CHROME_PATH` 環境變數可以指定 Chrome 嘅位置。

---

## 連連結都唔想抄？用 `--latest`

如果你已經登入過 Instagram（下面「有年齡限制」嗰節有講點登入），
script 可以自己去你個帳號主页搵最新嘅貼文：

```bash
node scripts/ig-fetch.mjs --latest
```

佢會：

1. 用你個 `.ig-profile/` session 開 `instagram.com/tzerojp/`
2. 讀走主页啲貼文連結（淨係自己帳號嘅，唔會混入其他人嘅貼文）
3. 逐條去讀 caption、圖片、日期
4. **已經入咗 `manual.json` 嘅貼文會跳過**（除非加 `--refresh`）

想讀多啲：

```bash
node scripts/ig-fetch.mjs --latest=12
```

想連舊貼文都重新讀一次（caption 改咗都想更新）：

```bash
node scripts/ig-fetch.mjs --latest --refresh
```

冇新貼文嘅話佢會話「nothing new」然後正常完結（唔會當錯誤）。

一條龍：

```bash
node scripts/ig-fetch.mjs --latest && node scripts/manual-post.mjs
```

> **要 session 冇過期。** 如果 Instagram 話「session expired」，
> 跑 `node scripts/ig-fetch.mjs --login` 重新登入一次就得。

### 新貼文嘅標題同摘要要自己寫

`ig-fetch` 抄返嘅係 Instagram 嘅 caption。caption 第一行通常係好長嘅
一句（`【明明已經揀咗『超潤滑』，點解仲係越用越乾、甚至刺痛？🤔】`），
自動切去 24 字會切爛中間 —— 變成 `…點解仲係越用越乾、甚至…`。

所以新貼文入咗 `manual.json` 之後，**最好自己寫返 `title_zh` 同
`excerpt_zh`**（仲有 `title_en` / `excerpt_en`）：

```json
{
  "date": "2026-10-30",
  "text": "【明明已經揀咗『超潤滑』…】",
  "url": "https://www.instagram.com/tzerojp/p/DfGkQzBAfF7/",
  "source": "Instagram",
  "image": "assets/images/news/ig-2026-10-30-DfGkQzBAfF7.jpg",
  "title_zh": "揀咗『超潤滑』，點解仲係越用越乾？",
  "excerpt_zh": "問題唔係出喺潤滑嘅「量」，而係出喺潤滑嘅「成分」。…",
  "title_en": "Why does \"ultra smooth\" still dry out?",
  "excerpt_en": "The problem is rarely how much lubricant a condom carries…"
}
```

寫完之後再跑 `node scripts/manual-post.mjs`，卡片就會用你嘅文案。

> **日文唔使寫。** 之前決定咗日文版照顯示中文原文，所以唔使加
> `title_ja` / `excerpt_ja`。

---

## 啲貼文成日讀唔到？可能係「有年齡限制」

Instagram 會將部分貼文標記做 sensitive（有年齡限制）—— 性健康品牌好常見中招。
未登入嘅訪客完全睇唔到：

- 貼文頁淨係見到「有年齡限制的內容……登入並繼續」
- embed 頁會話「這張照片或視頻的連結可能已損壞」

`ig-fetch.mjs` 會自動試晒幾種公開頁面（embed → 具名 embed → `/embed/` → 貼文頁 → IG 個
web API）。如果貼文係咁，上面全部都讀唔到 caption —— **呢個唔係 script 壞咗**，
係 Instagram 唔俾未登入嘅人睇。

解法係登入一次：

```bash
node scripts/ig-fetch.mjs --login
```

- 會開一個**睇得見**嘅 Chrome 視窗，停喺 instagram.com 個登入頁
- 撳「以 Instagram 帳戶登入」，或者用手機 App 掃 QR code
- 登入成功之後視窗會自己閂埋
- session 存喺 `.ig-profile/`（已經加咗落 `.gitignore`，**唔會** commit 入去）

跟住照舊跑：

```bash
node scripts/ig-fetch.mjs <連結>
```

**之後唔使再登入** —— session 留喺 `.ig-profile/` 度，下次一樣用得。
（要重新登入就 `rm -rf .ig-profile` 再跑 `--login`。）

> 呢個 folder 有 cookie，等同你份登入狀態。唔好 commit、唔好分享。

---

## 常用操作

| 你想 | 點做 |
|---|---|
| 加新貼文 | 加多一個 object 落 `posts` 入面，跑 script |
| 刪一張卡 | 刪走佢個 object，跑 script |
| 改字 | 直接改 `text`，跑 script |
| 換張圖 | 改 `image` 個值，跑 script |
| 由連結自動入 | `node scripts/ig-fetch.mjs <連結>` |
| 自動搵最新貼文（唔使抄連結） | `node scripts/ig-fetch.mjs --latest` |
| 貼文有年齡限制、讀唔到 | `node scripts/ig-fetch.mjs --login`（登入一次，之後唔使再登） |

**Id 係自動生成嘅**（用貼文連結計），所以次序唔影響 —— 你可以隨便擺。
同一條連結永遠得同一個 id，掂咗佢就係更新，唔會重複出卡。

---

## 佢同時做咗另一件事

跑完之後，呢啲手動貼文會被寫入 `assets/data/news.local.json`。
即係話 —— **如果將來你 setup 咗 GitHub Actions 自動同步，呢啲手動貼文唔會被
自動同步蓋走**，兩邊可以共存。

---

## 唔想自己跑 command？

直接將貼文內容 send 俾我，我即刻幫你更新埋 —— 同上面跑 script 嘅效果一樣。

---

## 相關檔案

| 檔案 | 用途 |
|---|---|
| `assets/data/manual.json` | **你改呢個** |
| `scripts/manual-post.mjs` | 跑呢個 |
| `scripts/ig-fetch.mjs` | 淨係有連結嗰陣用 —— 自動抓 caption／圖／日期。`--latest` 更加連連結都唔使俾 |
| `assets/data/news.json` | 自動生成，網站讀呢個 |
| `assets/data/news.local.json` | 自動生成（手動貼文部分）+ 手動維護（翻譯、置頂） |
| `assets/data/site.json` | Facebook / Instagram 帳號（全站唯一真相來源） |

測試：`node --test scripts/manual-post.test.mjs`

---

## 改帳號名？

社交平台帳號全部喺 `assets/data/site.json` 一個地方：

```json
{
  "facebook": "https://www.facebook.com/Tzerohk",
  "instagram": "https://www.instagram.com/tzerojp"
}
```

改完之後跑一行，網站所有連結（包括 footer、JSON-LD、卡片啲「追蹤」按鈕）
就會一齊更新：

```bash
node scripts/sync-social-links.mjs
```

`scripts/lib/site.test.mjs` 會守住呢個規則 —— 如果有邊個連結唔啱，測試就會
話你知係邊個檔案。

---

## 想要自動化？

GitHub Actions + Graph API 嘅方案見 [`instagram-sync.md`](instagram-sync.md)。
嗰個方案唔使你手動做任何嘢，但需要開 GitHub repo、開 Meta App、攞 token。
