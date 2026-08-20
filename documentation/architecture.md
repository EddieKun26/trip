# 旅伴 App 架構

## 產品與假設

- iPhone 優先的多人旅遊規劃 Web App，正式站為 `https://trip-eddie23.vercel.app`。
- 使用者以「暱稱＋4 位數 PIN」登入；旅程內容由成員共同編輯，個人購物清單則依成員與旅程隔離。
- `travel-app/prototype` 是唯一正式來源；`trip-deploy` 是 GitHub/Vercel 發布鏡像。
- 外部住宿或社群內容只提供辨識線索，永遠不能跳過候選檢查與使用者確認。

## 技術組成

| 層級 | 實作 | 責任 |
|---|---|---|
| 前端 | 原生 HTML、CSS、JavaScript | 旅程、地點、行程、航班、購物 UI；iPhone 響應式介面 |
| API | Vercel Functions（`.mjs`） | 登入、旅程、地點辨識、購物與外部服務代理 |
| 共用資料 | Upstash Redis | 帳號、工作階段、旅程、邀請碼、私人購物清單、每日 AI 額度 |
| 地圖 | Google Maps JavaScript API、Places API (New) | 互動地圖、地點資料、候選與地址查詢 |
| 地圖備援 | Leaflet、OpenStreetMap/Nominatim | 瀏覽器地圖備援與少量地址座標查詢 |
| AI | OpenAI Responses API，預設 `gpt-5.6-luna` | 社群／住宿地點辨識、購物截圖辨識與網頁資料查核 |
| 發布 | GitHub `EddieKun26/trip` 的 `main` → Vercel | 自動部署正式站 |

## 主要資料與信任邊界

1. 瀏覽器只持有暱稱、旅程 UI 狀態與非秘密的瀏覽器地圖設定。
2. 登入成功後，伺服器簽發隨機工作階段 token；瀏覽器只透過 `HttpOnly; Secure; SameSite=Lax` Cookie 傳送。
3. 所有共用寫入必須在 API 端重新由 Cookie 查出成員，再確認該成員屬於目標旅程。
4. Redis REST token、OpenAI key、Google Places server key 只存在 Vercel 伺服器環境。
5. Google Maps 瀏覽器 key 會傳給瀏覽器，因此必須以正式網域 referrer 與 API 範圍限制；它不是伺服器秘密。
6. 社群／Booking／Agoda／Airbnb 網頁屬不可信外部輸入。伺服器限制允許的主機、重新驗證重新導向與媒體主機，AI 輸出再經 schema、字數、座標與地址規則清理。
7. AI 只能提出辨識結果；真正寫入旅程由 App 在使用者選擇候選並確認後執行。

## 部署與工作區

- 正式來源：`travel-app/prototype`
- 專案記憶：`trip-deploy/memory`
- 部署鏡像：`trip-deploy`
- 正式網址：`https://trip-eddie23.vercel.app`
- 最新確認版本：前端資產 `20260821.2`，Git commit `6861965`
- 發布流程：來源修改 → 本機測試 → 更新 memory/documentation → 複製到鏡像 → 鏡像測試 → commit/push `main` → 確認正式資產版本。

## 已知風險與假設

- Google Maps key 曾在對話中出現，仍應輪替並限制；詳見 `memory/known_issues.md`。
- Booking 可能回傳阻擋頁，導致公開標題不可讀。系統會從完整 AI 標題擷取短名稱、以精確地址建立座標候選，但若來源根本沒有提供正式名稱，不能憑空保證名稱正確。
- OpenStreetMap/Nominatim 只允許使用者觸發、有限次數的備援查詢，不能改成大量、自動或 autocomplete 用途。
- 4 位數 PIN 的安全性依賴伺服器雜湊、嘗試次數限制與私密暱稱；不等同高保證帳號系統。
- Redis 目前同時承擔正式資料與 session；沒有獨立資料庫 migration／備份流程文件。
- 自動測試大量使用 mock；真實 iPhone、Booking 防爬、Google/OpenAI 額度與外部頁面變化仍需要人工驗證。

## 不適用的條件文件

- 無交易或自動寄信，因此沒有 `emails.md`。
- 無排程工作或 cron，因此沒有 `cron.md`。
- 無公開旅程的動態 SEO／分享預覽路由，因此沒有獨立 `seo.md`；目前只有靜態 App 首頁 metadata。

## Related Documents

- [flows.md](./flows.md)：高風險流程與副作用順序
- [permissions.md](./permissions.md)：角色與資源權限矩陣
- [variables.md](./variables.md)：環境變數與秘密管理
- [automation.md](./automation.md)：AI／外部自動化邊界
- [tests.md](./tests.md)：現有測試、建議測試與缺口
- [FABLE_HANDOFF.md](../memory/FABLE_HANDOFF.md)：可直接交給 Fable 的專案與本次改動摘要
