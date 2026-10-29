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
  "image": "assets/images/banners/carousel/11.png"
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

**自訂卡片唔受影響** —— 例如「正式登陸 HKTVmall」嗰張，任何情況都會顯示。

`index.html` 嘅「最新動態」欄冇呢個 filter（只係 `data-news-limit="1"`），
所以最新嗰張貼文係 FB 定 IG 都照顯示。

> 記得改完 bump 一下 cache 版本：`news.html` 入面 `news.js?v=6` → `?v=7`。

---

## 常用操作

| 你想 | 點做 |
|---|---|
| 加新貼文 | 加多一個 object 落 `posts` 入面，跑 script |
| 刪一張卡 | 刪走佢個 object，跑 script |
| 改字 | 直接改 `text`，跑 script |
| 換張圖 | 改 `image` 個值，跑 script |

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
| `assets/data/news.json` | 自動生成，網站讀呢個 |
| `assets/data/news.local.json` | 自動生成（手動貼文部分）+ 手動維護（翻譯、置頂） |

測試：`node --test scripts/manual-post.test.mjs`

---

## 想要自動化？

GitHub Actions + Graph API 嘅方案見 [`facebook-sync.md`](facebook-sync.md)。
嗰個方案唔使你手動做任何嘢，但需要開 GitHub repo、開 Meta App、攞 token。
