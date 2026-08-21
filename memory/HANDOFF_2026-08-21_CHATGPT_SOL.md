# 交接說明：2026-08-21 這一輪改了什麼

給接手的 ChatGPT SOL。本文只描述**這一輪**（2026-08-21，Claude Fable 5 執行）的變更、原因、驗證方式與注意事項。專案的整體架構請看 `documentation/architecture.md`，長期狀態看 `memory/project_state.md`。

---

## 0. 一分鐘摘要

這一輪處理四件事：

1. **修好 Booking 住宿匯入定位錯誤**（使用者回報的主要問題）。根因是 Booking 開始封鎖伺服器端抓取，加上門牌比對認不得 Google 回傳的羅馬字日文地址。
2. **Google Maps 開啟行為分流**：手機同頁跳轉（交給 Maps App），電腦開新分頁（不覆蓋 App）。
3. **前端體質優化**：補齊 PWA 圖示、自帶 Leaflet 移除 CDN 依賴、匯入提示文案、無障礙修正。
4. 產出本文件。

測試從 85 → **90 個全數通過**（`node --test`）。已推上 GitHub `main` 並部署 Vercel production。

---

## 1. Booking 住宿匯入：根因與修正

### 1.1 使用者回報的現象

貼上這個 Booking 連結後，App 無法透過地址門牌定位到正確位置：

```
https://www.booking.com/hotel/jp/50-ping-fang-da-jiu-bao-xin-su-1-zhan-di-ikeman-st-ge-wu-ji-ting-2-yu-shi-2-wei.zh-tw.html
```

該住宿的正確資訊（由房東提供）：

- 公寓名稱：自由之家
- 公寓地址：东京 新宿区 大久保 1 丁目 16-19，〒169-0072
- 地圖：`https://maps.app.goo.gl/LUyTfE7V4mvKoDuu8`（實測解析到 35.7008624, 139.703034）

### 1.2 三個根因（都經實測確認，不是推測）

**根因 A — Booking 已封鎖伺服器端抓取。**
實測 `fetchPublicMetadata()` 抓該頁面，得到 **HTTP 202、僅 3962 bytes 的反機器人挑戰頁**，`title`、`og:title`、`og:description`、`formattedAddress` 全部是 `null`。換過 desktop Chrome UA、英文版網址都一樣。

> 這代表既有那條「讀 Booking 頁面結構化地址」的路徑（2026-08-20 加的）**現在完全失效**。之前能運作，現在不行，是 Booking 那側的改變，不是我們程式壞掉。

**根因 B — 門牌比對認不得羅馬字日文地址（這是定位錯誤的直接原因）。**
用真實 Google Places API 實測「東京都新宿区大久保1丁目16-19」，Google 回傳的是：

```
1-chōme-16-19 Ōkubo, Shinjuku City, Tokyo 169-0072
```

舊的 `houseNumberOf()` 有兩個問題，導致解析不出 `1-16-19`：
- 認不得 `chōme` 的長音符號 `ō`（正規化後仍是 U+0304 組合字元）
- 認不得數字與 `chōme` 之間的連字號（`1-chōme`，舊的 regex 只允許 `1 丁目`）

結果：**正確的座標被判定「門牌不符」而丟棄，錯誤的鄰近旅館反而留下** → 定位到錯的地方。

**根因 C — 多行房東訊息解析不完整。**
房東給的訊息是這種編號格式：

```
1、公寓名称：自由之家
2、公寓地址：东京 新宿区 大久保 1 丁目 16-19 -169-0072
3、地图链接：https://maps.app.goo.gl/...
4、公寓电话：81-90-3180-9800
```

實測舊的 `extractAddressHint()` 對這段回傳**空字串**（地址完全抓不到）。而且沒有任何邏輯會去抓「公寓名稱：自由之家」——所以就算定位對了，名稱也只會是 Booking 標題的房型描述。

### 1.3 做了什麼修正

檔案：`api/social-place-import.mjs`

| 修正 | 函式 | 內容 |
|---|---|---|
| A | `houseNumberOf()` | 加入 NFD 正規化 + 移除組合用變音符號（U+0300–U+036F），讓 `chōme` → `chome`；regex 允許數字與 `丁目/chome` 之間有連字號 |
| B | `extractAddressHint()` | 邊界條件加入換行、`地圖/地图/連結/链接/電話/电话/tel/phone`、以及 `\d+\s*[、.．]`（編號行），避免地址吃進下一欄位或整段失敗 |
| C | `extractLodgingNameHint()`（**新增**） | 擷取「公寓名稱／飯店名稱／住宿名稱：…」等明確標示的住宿名稱，同樣有編號行邊界 |
| D | `lodgingUrlSlug()`（**新增**） | 從訂房網址取出 slug（`50 ping fang da jiu bao xin su ...`），這是頁面標題的拼音轉寫 |
| E | AI prompt | 新增規則 14（明確提供的住宿名稱優先於房型描述與網搜結果）、規則 15（頁面被擋時解讀 slug 拼音地名並網搜原頁面，不得改用相似住宿） |
| F | AI reference | 新增 `publicPageUnavailable`、`lodgingUrlSlug` 兩個欄位 |
| G | handler | 新增 `sharedTextRaw`（保留換行的貼文），線索擷取改用它；`lodgingNameHint` 串進 AI 與 `cleanRecognition` |
| H | `cleanRecognition()` | 住宿類別關鍵字補上「公寓／民宿／apartment」 |

### 1.4 現在的實際行為（很重要，請照實轉述給使用者）

**只貼 Booking 連結** → 盡力而為，不保證。Booking 封鎖下沒有任何頁面資料，只能靠 AI 用 slug 拼音去網路搜尋。而且「自由之家」這個名字**根本不在 Booking 頁面上**（頁面標題只有房型描述），所以純連結永遠不可能辨識出「自由之家」。

**貼 Booking 連結 + 房東訊息** → 這條路是**確定性的**，已用測試鎖住：會得到一個名為「自由之家」、定位在大久保 1-16-19 的住宿座標候選。

因此 UI 上加了提示文案（見第 3.4 節），引導使用者一開始就走可靠路徑。

### 1.5 這一節的測試

`tests/social-place-import.test.mjs` 新增 2 個測試：

- `a multi-line host message keeps its labelled address, lodging name, and URL slug clues` — 鎖住 A/B/C/D 四個擷取函式對真實房東訊息的輸出
- `a blocked Booking page with pasted host details still yields a correctly named coordinate candidate` — 端到端：模擬 Booking 回傳空白挑戰頁 + Google 回傳**羅馬字**地址，驗證仍得到名為「自由之家」的正確座標候選，且門牌不符的鄰近住宿被排除

---

## 2. Google Maps 開啟行為分流

**需求**：手機點「查看完整地圖」直接開 Google Maps App；電腦版開新分頁，不要覆蓋 App 頁面。

**背景**：2026-08-19 曾把 `window.open(_blank)` 改成 `window.location.assign()`，因為 iPhone 上開新分頁會留下一個空白 Safari 分頁。但那個修正讓桌面版也變成同頁跳轉，會蓋掉 App。

**做法**：`app.js` 新增 `isMobileNavigationDevice()`，`openGoogleMaps()` 依裝置分流：

```js
function isMobileNavigationDevice() {
  const userAgent = String(navigator.userAgent || "");
  return /iphone|ipad|ipod|android/i.test(userAgent)
    || (/macintosh/i.test(userAgent) && Number(navigator.maxTouchPoints) > 1);
}
```

- 手機／平板 → `window.location.assign(url)`（原行為，iOS/Android 會交給 Maps App）
- 桌面 → `window.open(url, "_blank", "noopener")`
- **彈窗被擋** → 退回同頁跳轉，不會變成「按了沒反應」

第二個條件是處理 iPadOS：它預設回報 Macintosh UA，靠 `maxTouchPoints > 1` 才能認出來。

**驗證**：除了單元測試，我在真實瀏覽器實測過兩種情境——Windows UA（`maxTouchPoints: 0`）確認開了 `_blank` 且 App 頁面留在原地；Android 模擬（`maxTouchPoints: 5`）確認走同頁跳轉。

---

## 3. 前端體質優化

### 3.1 PWA 圖示（原本完全沒有）

`manifest.webmanifest` 的 `icons` 原本是空陣列 → iPhone「加入主畫面」會拿網頁截圖當圖示。

新增 `icons/`：`icon-192.png`、`icon-512.png`、`icon-maskable-512.png`、`apple-touch-icon.png`（180px）。

設計是奶油色地圖圖釘 + 品牌陶土紅 `#c8452d`，用 Node 內建 `zlib` 純程式產生 PNG（**沒有引入任何影像處理相依套件**）。maskable 版滿版且圖形縮小落在安全區內。`index.html` 補上 `apple-touch-icon`、`icon`、`apple-mobile-web-app-*` 標籤。

> 產生器腳本在暫存區、未進版控。要改圖示的話重寫一份即可，或直接replace PNG 檔。

### 3.2 自帶 Leaflet，移除 CDN 依賴

原本 `leaflet.js` / `leaflet.css` 從 `unpkg.com` 載入。Leaflet 是 Google Maps 掛掉時的**備援**地圖——備援卻依賴第三方 CDN，等於備援自己也可能一起失效。

改為 `vendor/leaflet/`（1.9.4：js、css、marker/layers 圖檔）。`vercel.json` 為 `/vendor/` 加上 `immutable` 一年快取、`/icons/` 一週。

**這是本輪風險最高的改動**，所以我實際起了本機伺服器在瀏覽器驗證：`window.L.version === "1.9.4"`、App 正常渲染、無主控台錯誤、四個 marker 圖檔皆 200、375px 下無水平溢出。

### 3.3 無障礙

分頁列的 `◇ ● □ ▱` 四個裝飾字元加上 `aria-hidden="true"`，VoiceOver 不再唸出符號名。

### 3.4 匯入提示文案

匯入面板連結欄下方新增（`.field-hint`）：

> 訂房平台常擋住自動讀取。住宿請連同房東訊息或訂單確認信一起貼上（含「公寓名稱：…」「地址：…」），才能用正確名稱與門牌定位。

### 3.5 刻意「沒有做」的事：資產壓縮

我原先建議 minify `app.js`（334KB）與 `styles.css`（114KB），**後來實測後決定不做**：

```
curl -sI -H "Accept-Encoding: br" https://trip-eddie23.vercel.app/app.js
→ Content-Encoding: br，實際傳輸 85.6 KB
```

Vercel 已自動 brotli 壓縮，334KB → 85.6KB。再 minify 大概只能到 ~60KB，卻要為一個**沒有 package.json、沒有建置流程**的專案引入建置管線，破壞現在「直接 `node --test`、靜態部署」的簡潔性。投報比不划算。

> 如果之後真的要做，建議連同 `app.js` 的模組化一起規劃，不要只為了壓縮而加建置步驟。

---

## 4. 變更檔案清單

```
api/social-place-import.mjs      Booking 匯入修正（第 1 節）
app.js                           地圖開啟分流 + 匯入提示文案
styles.css                       .field-hint
index.html                       圖示標籤、本地 Leaflet、aria-hidden、資產版本 → 20260821.3
manifest.webmanifest             icons 陣列
vercel.json                      /vendor/ 與 /icons/ 快取標頭
icons/*.png                      新增 4 個
vendor/leaflet/**                新增（1.9.4）
tests/social-place-import.test.mjs   +2 測試
tests/ui-logic.test.mjs              +3 測試（地圖分流、圖示與 Leaflet、無障礙與提示）
memory/changelog.md, known_issues.md, project_state.md   更新
```

---

## 5. 接手須知

### 5.1 工作流程（務必遵守）

- 正典原始碼：`travel-app/prototype`。**先改這裡**。
- 部署鏡像 / Git：`trip-deploy`。驗證通過後才複製過去再發佈。
- **正典記憶是 `trip-deploy/memory`**，不是 `travel-app/prototype/memory`（兩邊內容已分歧，我這輪一度寫錯位置後修正）。
- `AI家教` 底下的舊副本不要動。

### 5.2 環境

- `travel-app/prototype/.env.local` 只有 `GOOGLE_MAPS_API_KEY`。**本機沒有 `OPENAI_API_KEY`**，所以無法在本機跑完整 AI 辨識流程，只能靠測試的 mock。
- 測試全部用 mock `globalThis.fetch`，不會打真實 API，可安心跑。

### 5.3 已知限制（新增到 `known_issues.md`）

- **Booking.com 現在對伺服器抓取回傳 HTTP 202 反機器人頁**（2026-08-21 實測）。純 Booking 連結的辨識是 best-effort。可靠路徑是連同房東訊息一起貼。
- Agoda / Airbnb **我這輪沒有實測**，不確定是否有同樣的封鎖。如果使用者回報類似問題，第一步先用 `fetchPublicMetadata()` 實抓看看回傳什麼，不要直接猜是程式邏輯問題。

### 5.4 除錯這類問題的建議順序

Booking 這個案子的教訓是：**先確認外部資料源真的給了什麼**，再看解析邏輯。我一開始就直接抓頁面看到 HTTP 202，才沒有浪費時間在「AI 提示詞不夠好」這個錯誤方向上。同理，第二步用真實 Google API 查一次地址，才發現回傳的是羅馬字——這是純看程式碼絕對看不出來的。

---

## 6. 驗證狀態

- `node --check app.js`：通過
- `node --test`（正典 `travel-app/prototype`）：**90 / 90 通過**
- `node --test`（鏡像 `trip-deploy`）：**90 / 90 通過**
- 瀏覽器實測：Leaflet 1.9.4 本地載入、App 渲染、無主控台錯誤、marker 圖檔 200、375px 無溢出、桌面／行動地圖開啟行為各自正確
- Production API 健康檢查：`{"status":"ok","aiReady":true,"placesReady":true}`
