# Facebook / Instagram 貼文自動同步

把 T-ZERO 第九感 Facebook 專頁（連同連結住嘅 Instagram Business 帳號）嘅貼文自動同步到網站。

> **淨係想手動更新？** 唔想開 GitHub、唔想搞 token 嘅話，用
> [`manual-posts.md`](manual-posts.md) —— 貼落一個 JSON、跑一行 command 就得。
> 兩條路可以共存：手動加嘅貼文會被寫入 `news.local.json`，唔會被自動同步蓋走。

```
Facebook 專頁 ──┐
                ├─  Graph API（排程job，密碼存在 GitHub Secrets）
Instagram ──────┘
     ▼
assets/data/news.json  ←  同步script寫入，並commit
assets/images/news/*   ←  貼文圖片下載到本機
     │
     ▼
assets/js/news.js      ←  前端讀取、渲染卡片（無JS時回退到HTML內建卡片）
```

網站本身仍然係純靜態 —— 冇後端、冇build step、冇runtime依賴。
同步只係一個 GitHub Actions 排程job，佢做嘅事係「commit 兩個檔案」。

---

## 一次性設定

### 0. 事前：你必須係專頁管理員

去 T-ZERO 專頁 **設定 → 專頁存取權（Page access）→ 你**，確認你係
**完整控制（Full Control）**。只有 Page Admin 或以上先攞到 token，
「工作」或「編輯」唔夠。

另外：整個過程要用同一個 Meta 帳號完成（開 App 嗰個 = 管專頁嗰個），
理由見下面第 2 步。

### 1. 建立 Meta App

1. 去 <https://developers.facebook.com/apps> → **Create App**
2. **用途（Use case）揀 Business**。
   呢個係重點：App 類型**建立咗就改唔到**，而只有 Business 類型先可以
   攞 Page token。其他類型（Consumer、其它）根本冇呢條路。
3. App 入面撳 **Add product** → 加 **Facebook Login for Business**
4. 左邊 **Settings → Basic** → 抄低 **App ID** 同 **App Secret**
   （App Secret 撳「顯示」先睇到，撳兩下就永久顯示）

### 2. Business Verification：幾時真係需要？

呢個係最多人卡住嘅位，所以講清楚：

| 情況 | 需要 Business Verification？ | 需時 |
|---|---|---|
| **App 開發者帳號 = 專頁擁有人**（自己嘅品牌，自己做） | **唔需要** | 即刻 |
| App 俾公司其他員工 / 另一個 Business Portfolio 用 | 需要（連 App Review） | 約 1 星期起 |

T-ZERO 係自己個品牌、你自己管專頁嘅話 —— **行上面第一行就夠，
唔使做 Business Verification，唔使等 App Review。** App 保持
Development mode，你（App Admin）就已經有 Standard Access 讀到個 Page。

只有喺「App 唔係你擁有嘅資產」嗰種情況，Meta 先會要求
**Business Verification + Advanced Access**，而嗰個真係要等幾日。
如果你撞到 error 200/10，先回嚟睇呢一節。

> **要永續、唔使換嘅 token？** Production 環境標準做法係喺 Business
> Portfolio 開 **System User**，攞一條永唔過期嘅 token（本網站唔需要，
> 60 日 + 自動續期已經夠）。想知多啲見文件尾。

### 3. 攞 User Access Token（順手攞埋 Page token）

用 **Graph API Explorer**：<https://developers.facebook.com/tools/exchange>

1. 左上角 App 欄揀你啱啱整嘅 App
2. 右邊 **Permissions** 撳 **Add** → 撈去最底揀：
   - `pages_read_engagement` — 讀專頁貼文
   - `pages_show_list` — 列出你管嘅專頁
   - `instagram_basic` — 讀 Instagram Business 貼文（**淨係想同步 Facebook 就唔使加**）

   > 呢三個 permission **唔使 App Review**，Development mode 就攞到。

3. 撳 **Get Token** → 權限視窗撳「繼續」→ **Get Access Token**

   如果視窗有得顯示「以 Page 管理員身分」，記得揀你個 T-ZERO 專頁。
4. 拎到一條 token —— **短期**，約 1 個鐘，要先換成長效

> 建議攞 **User token** 而唔係直接攞 Page token：User token 換成長效之後，
> 從佢派生嘅 Page token 一樣長效，而且你只需要喺 GitHub 存**一條**
> token（script 每次自己去 `me/accounts` 攞返 Page token）。

### 3b. Instagram：將 IG 帳號連去專頁（同步 IG 就必做）

只有 **Instagram Business / Creator 帳號**可以經 Graph API 讀取
（普通 personal 帳號唔得）。設定方法：

1. 去 <https://www.facebook.com/business/help/138851576232882> 跟 Meta 官方指引，
   或者喺 **Meta Business Suite → Settings → Accounts → Instagram accounts**
   加你個 IG 帳號，設 username 同密碼。
2. 確認 IG 係 **Business** 類型：IG 個人檔案 → 設定 → 切換「專業帳號」→「Business」。
3. 喺 IG 帳號設定裡面揀 **「連結到 Facebook 專頁」**，揀你個 T-ZERO 專頁。
   （由專頁嗰邊發佈會自動同步去 IG，反方向就唔一定。）
4. 綁好之後，script 會喺專頁物件上讀到 `instagram_business_account`，
   自動開始同步 IG，**唔使另外設定 token**。

> 如果未綁好，但你想同步指定 IG：喺 GitHub **Variables** 加 `FB_IG_USERNAME`
> （本網站就係 `tzerojp`，喺 `assets/data/site.json` 度），script 會試住用
> `ig_<username>` 嘅方式攞返個媒體庫 ID。
> 呢個方法好處係唔使 Business 類型，但只支援 Business/Creator 帳號。

### 4. 換成長效 token（60 日）

```bash
curl -s "https://graph.facebook.com/oauth/access_token\
?grant_type=fb_exchange_token\
&client_id=YOUR_APP_ID\
&client_secret=YOUR_APP_SECRET\
&fb_exchange_token=SHORT_LIVED_TOKEN"
```

拎返 `access_token`，同時留意 `expires_in`（應該係 `5183999` ≈ 60 日）。
呢條就係 `FB_USER_TOKEN`。

> **唔使擔心 60 日到期**：同步 script 每次行都會用 App ID + App Secret
> 自動換一次 token，所以條 token 會一直有效（前提係 App 冇被 Meta 停權，
> 亦即你冇漏做年度 Data Use Checkup）。

### 5. 確認 Page ID（順便測試 token）

```bash
curl -s "https://graph.facebook.com/v24.0/me/accounts?fields=id,name,access_token&access_token=YOUR_LONG_LIVED_TOKEN"
```

`data[].id` 就係 `FB_PAGE_ID`，`name` 應該係 **T-ZERO 第九感**。
呢個 command 成功 = 權限、token、App 類型全部正確，一次過過三關。

想順便確認 IG 都通埋：

```bash
curl -s "https://graph.facebook.com/v24.0/IG_ID?fields=instagram_business_account{id,username}&access_token=YOUR_PAGE_TOKEN"
```

### 6. 加做 GitHub Secrets

入 **Settings → Secrets and variables → Actions → New repository secret**：

| Secret | 必要？ | 內容 |
|---|---|---|
| `FB_USER_TOKEN` | ✅（或用 `FB_PAGE_TOKEN` 二選一） | 第 4 步拎到嘅長效 token |
| `FB_APP_ID` | 建議 | App ID（用嚟自動續期 token） |
| `FB_APP_SECRET` | 建議 | App Secret（同上） |
| `FB_PAGE_ID` | 選填 | 專頁數字 ID。用 `FB_PAGE_TOKEN` 就必填 |
| `FB_PAGE_TOKEN` | 選填 | 想直接俾 Page token（唔想 script 自己搵）就用呢個代替 `FB_USER_TOKEN`，**一定要同時填 `FB_PAGE_ID`** |

**Variables**（選填）：

| Variable | 預設 | 用途 |
|---|---|---|
| `FB_PAGE_USERNAME` | `assets/data/site.json` 入面嘅 FB 帳號 | 用嚟砌 permalink |
| `FB_IG_USERNAME` | `assets/data/site.json` 入面嘅 IG 帳號 | IG 未連結專頁時，用嚟指定要同步嘅帳號 |
| `FB_GRAPH_VERSION` | `v24.0` | Graph API 版本 |
| `FB_POST_LIMIT` | `8` | 每次保留幾多張卡 |

> 社交帳號本身喺 `assets/data/site.json`，唔使填 Variable。
> 改咗個檔之後跑 `node scripts/sync-social-links.mjs`，全站連結就會一齊更新。

> **Token 一定要放喺 GitHub Secrets，唔可以放喺網站任何地方。**
> 呢個網站係純靜態，任何寫入前端 JS 嘅 token 全部人睇到，
> 等於開放畀任何人攞你個專頁嘅讀取權。

### 7. 推上 GitHub

Repo 已經 `git init` 咗（分支 `main`），仲未推上去：

```bash
git add -A
git commit -m "feat: Facebook / Instagram news auto-sync"
git remote add origin git@github.com:<you>/<repo>.git
git push -u origin main
```

之後 **Actions → Sync Facebook news → Run workflow** 手動行一次，
確認 `assets/data/news.json` 有更新。

### 8. 部署（GitHub Pages）

`.github/workflows/deploy-pages.yml` 會喺每次 push 完 `main` 之後，
將整個 repo 當成靜態網站發佈去 GitHub Pages。因為冇 build step，
「部署」就係「照原樣 publish」。

- **Settings → Pages → Build and deployment → Source** 揀 **GitHub Actions**
- 第一次 push 之後，Actions 入面會出現 **Deploy site to GitHub Pages**，
  完咗就會有一條 `https://<you>.github.io/<repo>/` 嘅網址

> 如果你用緊 Netlify / Vercel / Cloudflare Pages hosting，
> 删咗 `deploy-pages.yml`，改為喺嗰邊連接 repo 就得。

#### 點解同步 workflow 嘅 commit 都會自動部署

GitHub 有個刻意嘅限制：**用預設 `GITHUB_TOKEN` 推嘅 commit唔會觸發其他
workflow**（防止 workflow 互相觸發成死循環）。所以同步 job 推上嚟嗰次，
`push` event 係唔會行嘅。

`deploy-pages.yml` 因此加咗第二個 trigger：

```yaml
workflow_run:
  workflows: ['Sync Facebook news']
  types: [completed]
```

`workflow_run` 係 GitHub 官方俾呢個情況用嘅方法 —— 同步 workflow 完咗之後
先觸發部署，而嗰時 `main` 已經有咗新嘅 `news.json`。
（同步失敗就唔會部署，避免發佈半份 feed。）

> 如果你想改用 Personal Access Token 推（`DEPLOY_TOKEN`），
> 咁 `push` event 就會正常觸發，`workflow_run` 就唔使。

---

## 日常運作

- 排程：**每日 09:00 同 21:00（香港時間）**
- 每次同步會：拉最新 FB + IG 貼文 → 下載圖片 → 寫 `news.json` → commit → 自動部署
- `sync-facebook.yml` 同 `deploy-pages.yml` 會接力：前者 commit，後者 publish
  （同步 bot 嘅 commit 用 `GITHUB_TOKEN` 推，唔會觸發 `push` event，
  所以部署 workflow 靠 `workflow_run` 接力 —— 詳見第 8 節）

### 手動觸發

Actions → Sync Facebook news → **Run workflow**。

### 本機試跑

```bash
FB_USER_TOKEN=xxxxx \
FB_APP_ID=xxxxx \
FB_APP_SECRET=xxxxx \
node scripts/sync-facebook.mjs
```

跑之前先睇一眼有冇 `passed end-of-life` 警告 —— 有即代表要更新
`FB_GRAPH_VERSION`（見下面「出事點睇」最後一行）。

### 唔使 token 都可以試（mock Graph API）

`FB_GRAPH_BASE` 可以指向另一個 host。指向本機 mock server，
就可以完整行一次「token 交換 → 拉 feed → 拉 IG → 落圖 → 合併 override」，
而唔使真嘅 Meta 憑證。現成嘅測試就係咁做：

```bash
node --test scripts/lib/feed.test.mjs scripts/sync.test.mjs
```

`sync.test.mjs` 會起一個假 graph.facebook.com，用真嘅 script 行一次，
再檢查輸出 —— 所以改咗 script 之後，唔使有 token 都知有冇整爛。

---

## 內容點樣處理

| 情況 | 效果 |
|---|---|
| Facebook 貼文有文字 | 標題 = 第一行（去走 emoji、#hashtag，超過 24 字會截斷），摘要 = 餘下內容 |
| Instagram caption | 同上，但 hashtag 通常喺**最後**，一樣會被剝走 |
| 貼文冇文字（純圖片／影片） | 標題用預設「最新 Facebook 貼文」/「最新 Instagram 貼文」，卡片照樣顯示 |
| 貼文有圖 | 圖片**下載咗存喺 repo**（`assets/images/news/`） |
| IG 影片 / Reels | 用 `thumbnail_url`（封面圖）當卡片圖 |
| 貼文冇圖 | 卡片顯示品牌 LOGO |
| IG 卡片嘅「追蹤」按鈕 | 指向 IG 個人檔案；Facebook 卡片指向專頁 |

> **點解要下載圖片？** Facebook CDN 個 URL 係簽名過、會過期。
> 呢個網站之前就係熱連結咗一條 `scontent-hkg1-1.xx.fbcdn.net/...` 嘅圖，
> 過咗幾個星期就 403 死咗。落載到本機就唔會再有事。

### 英／日文翻譯

Facebook / Instagram 貼文本身淨係得一種語言。想網站三語都顯示原文，就要喺
`assets/data/news.local.json` 手動加翻譯：

```json
{
  "posts": {
    "1234567890": {
      "title_en": "Now in stock",
      "title_ja": "新発売",
      "excerpt_en": "…",
      "excerpt_ja": "…"
    }
  }
}
```

Key 就係 Facebook post id（喺 `news.json` 度搵到）。
IG 貼文嘅 id 會加 `ig-` 前綴（例如 `ig-17890000000000001`）。
冇翻譯嘅話，英文／日文版會照顯示中文原文。

### 自訂／非 Facebook 嘅貼文

想保留一張「正式登陸 HKTVmall」咁樣嘅自訂卡片？
喺 `news.local.json` 加一個 entry，`id` 自己命名，並且 **一定要有
`title_zh`**（script 靠呢個認出係自訂貼文）：

```json
{
  "posts": {
    "curated-hktv-launch": {
      "title_zh": "正式登陸 HKTVmall",
      "title_en": "Now on HKTVmall",
      "excerpt_zh": "…",
      "image": "assets/images/banners/carousel/9.png",
      "permalink": "https://www.hktvmall.com",
      "link": "https://www.hktvmall.com",
      "cta_zh": "前往 HKTVmall 選購",
      "cta_en": "Shop on HKTVmall",
      "follow": false,
      "pinned": true
    }
  }
}
```

呢啲 entry 每次同步都會保留，唔會被 Facebook 嘅新貼文蓋過。

想收埋某張卡：`"hidden": true`。

### `pinned: true` 係咩意思

Graph API 每次只會俾最近 N 條貼文，舊咗嘅重要貼文會喺下一次同步
消失喺網站。喺 `news.local.json` 加上 `"pinned": true`，script 就會
**由上一次嘅 `news.json` 攞返嗰張卡**放返喺度（連埋當時下載咗嘅圖），
直到你手動刪走個 override。

自訂貼文（curated）本身就係永久保留，`pinned` 對佢嚟講冇分別。

### 邊個頁顯示邊啲貼文

每個 `[data-news-list]` 容器可以用三個 attribute 控制顯示乜：

| Attribute | 效果 |
|---|---|
| `data-news-limit="8"` | 最多顯示幾多張卡（預設 8） |
| `data-news-source="instagram"` | **淨係顯示 Instagram 貼文** |
| `data-news-source="facebook,instagram"` | Facebook 同 Instagram 都顯示 |
| 冇呢個 attribute | 全部都顯示 |

而家 [news.html](../news.html) 用緊 `data-news-source="instagram"`，
即係呢一頁淨係出 Instagram 貼文。想 Facebook 貼文都出，刪走呢個
attribute 或者改成 `facebook,instagram` 就得。

自訂卡片（例如 HKTVmall 嗰張）**唔受**呢個 filter 影響 —— 佢哋唔係
社交平台貼文，任何一頁都會顯示。

> `index.html` 嘅最新動態欄用 `data-news-limit="1"`，冇 source filter，
> 所以顯示最新嗰張卡（無論係 FB 定 IG）。

---

## 出事點睇

| 症狀 | 原因 |
|---|---|
| `Graph API error 190` | Token 過期或唔啱。重新做第 3、4 步。 |
| `Graph API error 200` / `10` | 權限不足。確認 App 有 `pages_read_engagement`，同埋 App 係 Business 類型。如果 App 唔係你擁有嘅資產，就要做 Business Verification（第 2 步）。 |
| `The user token administers no pages` | Token 對唔上個專頁，或者嗰個人唔係專頁管理員 —— 返去第 0 步查權限。 |
| `the feed returned no posts` | Token 有權限但專頁冇公開貼文，或者 Page ID 錯咗。 |
| `could not read the linked Instagram account` | IG 未連去專頁，或者 token 冇 `instagram_basic`。Facebook 部分照樣會同步 —— IG 只係被略過，唔會令成個 job 死。 |
| `no Instagram Business account linked` | 同上。用 `FB_IG_USERNAME` 變數指定帳號，或者跟第 3b 步綁埋。 |
| `could not read Instagram media` | IG 帳號係 personal 而唔係 Business，Graph API 讀唔到。轉做 Business 帳號。 |
| `image download failed` | CDN 拒絕請求。貼文卡會改用品牌 LOGO，唔會斷。 |
| 網站個 feed 冇更新 | Actions → 睇下個 run log。`No changes — the feed has not moved` 即係真係冇新貼文。 |
| 毫無預兆壞咗，但冇 error | Graph API 版本過期。Meta 唔會報錯，會**靜靜哋**改用第二舊嘅版本服務你。script 會喺 log 開頭印 `passed end-of-life` 警告 —— 見到就更新 `FB_GRAPH_VERSION`。 |
| 之前好好的，某日突然全部 permission 冇咗 | 年度 **Data Use Checkup** 過咗期。喺 Meta Business Suite 填完 questionnaire 就恢復。 |

### Graph API 版本時序

`FB_GRAPH_VERSION` 預設 `v24.0`（可撐到 2028-02-18）。Meta 每年開新版本、
舊版本約兩年後退役。**退役唔會令 request 失敗**，所以要靠上面嗰個警告。

| 版本 | 可用到 |
|---|---|
| v24.0（預設） | 2028-02-18 |
| v23.0 | 2027-10-08 |
| v22.0 | 2027-05-20 |
| v21.0 | 2027-01-21 |

唔想每年改，可以喺 GitHub **Variables** 加 `FB_GRAPH_VERSION`，
改一次就長期生效。

### 想永唔過期：System User

Production 環境另一條路：喺 Business Portfolio 開 System User，
攞一條永久 token（`business_management` + `pages_read_engagement`）。
唔使換、唔使 App Review，Business Verification 咁樣就係強制的。
本網站用唔着（60 日 + 自動續期已經夠），但如果想長期零維護就考慮。

---

## 檔案

| 檔案 | 用途 |
|---|---|
| `scripts/sync-facebook.mjs` | 拉貼文、落圖、寫 JSON |
| `scripts/manual-post.mjs` | 手動路線：將 `manual.json` 變成 feed（唔使 token） |
| `scripts/sync-social-links.mjs` | 改咗 `site.json` 之後，將 HTML 同 JSON-LD 嘅連結一齊更新 |
| `scripts/lib/feed.mjs` | 純函數（標題／摘要／合併／pinned），可單獨測試 |
| `scripts/lib/feed.test.mjs` | 上面嗰啲函數嘅單元測試 |
| `scripts/lib/site.mjs` | 讀 `site.json`（社交帳號嘅唯一真相來源） |
| `scripts/lib/site.test.mjs` | 連結同 `site.json` 唔一致就 fail |
| `scripts/sync.test.mjs` | 用 mock Graph API 行一次真 script 嘅端到端測試 |
| `scripts/manual-post.test.mjs` | 手動路線嘅端到端測試 |
| `assets/data/news.json` | **自動生成** —— 前端讀呢個 |
| `assets/data/manual.json` | **手動維護** —— 手動路線貼文放喺呢度 |
| `assets/data/site.json` | **手動維護** —— Facebook / Instagram 帳號 |
| `assets/data/news.local.json` | **手動維護** —— 翻譯、自訂貼文、隱藏、pinned |
| `assets/js/news.js` | 前端渲染 |
| `.github/workflows/sync-facebook.yml` | 排程同步 |
| `.github/workflows/deploy-pages.yml` | 每次 push 完就發佈去 GitHub Pages |
