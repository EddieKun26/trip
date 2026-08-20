# Fable 交接：旅伴 App

## 一句話目標

這是一個 iPhone 優先的多人旅遊規劃 Web App。近期工作的核心是：讓使用者能貼 Booking／Agoda／Airbnb 住宿連結，取得可核對的住宿名稱、完整地址與導航座標，同時避免 AI 或 Google Maps 猜錯附近住宿。

## 目前正式狀態

- 正式站：`https://trip-eddie23.vercel.app`
- GitHub：`EddieKun26/trip`，branch `main`
- 最新 commit：`6861965`（`Keep Liberty Stay in Booking imports`）
- 前端資產版本：`20260821.2`
- 測試：`node --test` 共 85 項全數通過（canonical source 與 deployment mirror 均已驗證）
- 正式來源：`travel-app/prototype`
- 發布鏡像：`trip-deploy`
- 專案記憶：`trip-deploy/memory`
- 交接文件：`trip-deploy/documentation`

## 這一輪已完成的需求與 Bug

1. 新增 Agoda、Booking.com、Airbnb、`abnb.me` 住宿連結辨識；確認後保留原始訂房連結。
2. Booking 沒有獨立 Google 商家頁時，可用完整地址建立 `住宿座標` 候選供導航。
3. 日本郵遞區號與完整門牌（本例 `〒169-0072 1-16-19`）優先於 AI／網路搜尋猜測；附近門牌不符的住宿不得取代。
4. Google Maps URL 解析優先使用實際 pin 的 `!3d…!4d…`，不使用相機中心。
5. null、空座標、超出範圍與 `0,0` 全部視為無效；Google 地址查詢無座標時才可走有限 OpenStreetMap/Nominatim 備援。
6. 同一欄位貼上「公寓名稱＋地址＋Google Maps＋Booking」時，合併成一筆住宿，不產生無意義文字候選。
7. Booking 長標題只保留最後的正式住宿名。`50/70 平方、浴室、衛生間、新宿一站地、Ikeman St、歌舞伎町` 都是描述，不是住宿名稱。
8. 最新修正會先檢查完整 AI 回傳標題，再做 160 字顯示截斷，因此尾端 `Liberty Stay` 不會被截掉；搜尋也改用 `Liberty Stay + 精確地址`。
9. 使用者有明確中文名稱時，可顯示 `自由之家（Liberty Stay）`；只有 Booking 可靠尾端名稱時顯示 `Liberty Stay`。
10. 直接由 Google Maps 連結新增的地點，不再誤顯示「查看 Threads 貼文」。
11. 點「查看 Google Maps」改為同頁導向，避免 iPhone 開啟 Maps App 後留下空白 Safari 視窗。
12. 候選預覽的關閉按鈕固定正圓，不會被長標題擠成橢圓。
13. `file:///…/index.html` 不是正式登入環境；登入必須使用 HTTP(S) 正式站或本機 HTTP server，否則 Secure Cookie／API 不會正常工作。

## Liberty Stay 的驗收資料

- 使用者提供名稱：`自由之家`
- 正式英文名稱：`Liberty Stay`
- 地址：`東京都新宿区大久保1丁目16-19 〒169-0072`
- Google Maps：`https://maps.app.goo.gl/LUyTfE7V4mvKoDuu8`
- 目標座標約：`35.7008698, 139.7030542`（以使用者提供 Google Maps pin 為準）
- Booking slug：`/hotel/jp/50-ping-fang-da-jiu-bao-xin-su-1-zhan-di-ikeman-st-ge-wu-ji-ting-2-yu-shi-2-wei.zh-tw.html`

期望結果：

- 候選名稱直接看得到 `Liberty Stay`，不能是 `70 平方…`。
- 若使用者同時提供「公寓名稱：自由之家」，儲存名稱可為 `自由之家（Liberty Stay）`。
- 完整地址必須是 `1-16-19`，不能誤配 `1-16-20` 或百人町附近住宿。
- 地圖必須定位東京大久保，不能是 `0°0'0"N 0°0'0"E`。
- 沒有獨立商家頁時，應清楚標示這是住宿地址座標，仍保留 Booking reference。

## 關鍵程式位置

| 目的 | 檔案／函式 |
|---|---|
| Booking metadata、地址、名稱清理 | `api/social-place-import.mjs`：`publicMetadataFromHtml`、`lodgingNameFromTitle`、`cleanRecognition` |
| Google 候選、精確門牌與座標備援 | `api/social-place-import.mjs`：`searchGoogleCandidates`、`searchAddressWithOpenStreetMap` |
| Google Maps URL 座標解析 | `api/places.mjs` 與 `app.js` 的 Maps parser |
| 混合名稱／地址／Map／Booking 合併 | `app.js`：`explicitLodgingDetailsFromText`、`mergeLodgingMapEvidence` |
| 候選預覽與確認 UI | `app.js`：`openImportCandidatePreview`、`importPreviewMarkup` |
| 正圓關閉按鈕 | `styles.css`：`.icon-button` |
| 住宿回歸測試 | `tests/social-place-import.test.mjs`、`tests/ui-logic.test.mjs` |

## 為什麼曾出現「70 平方…」

Booking 對伺服器常回傳約 4 KB 的阻擋頁，沒有 title、`Liberty Stay` 或地址。系統因此改由 AI web search 補足；搜尋可能找到相似房源，或回傳很長的房型標題。上一版又先把 AI 名稱截到 160 字，可能在看到尾端 `Liberty Stay` 之前就截斷。現在會先用完整 500 字名稱擷取正式尾端短名，再做顯示長度限制，並用短名＋精確地址搜尋。

仍需誠實保留的限制：如果 Booking 阻擋頁與 AI 結果都完全沒有提供 `Liberty Stay`，App 不可能從這個拼音房型 slug 憑空保證正式名稱。這時最可靠做法仍是讓使用者補上名稱、完整地址或 Google Maps 連結，並在候選預覽確認。

## 不可破壞的安全／產品規則

- AI 只能提出候選，不能自動寫入旅程。
- 住宿與社群匯入只允許已登入且屬於目標旅程的成員。
- 不得把 Redis、OpenAI、server Google key 放進前端或文件。
- Booking／社群 HTML、redirect、圖片和 AI 回傳都是不可信輸入；保留 allowlist、schema、大小與每日額度限制。
- Google 商家結果與住宿地址座標是不同概念；地址座標不可偽裝成已驗證商家。
- 不要硬編碼單一 Booking 房源 ID → `Liberty Stay`；修正要適用所有類似長標題。
- UI 以 iPhone 15 Pro 為主，輸入字級至少 16px，不能水平溢出，確認按鈕保持可見。
- 修改 `travel-app/prototype` 後才同步到 `trip-deploy`；不要反向把部署鏡像當正式來源。

## 建議請 Fable 回答的問題

1. 在 Booking 公開 metadata 被擋、只剩 URL 與 AI 搜尋結果時，還有哪些通用且合法的方法能提高正式住宿名稱可信度，而不硬編碼單一房源？
2. 候選卡是否應把「辨識名稱」「完整地址」「來源可信度」「地址座標／Google 商家」分得更明顯，讓使用者快速判斷？
3. 當系統偵測 URL slug 的房型面積（例如 50）與 AI 結果（例如 70）不一致時，是否應直接降級為「名稱待確認」，而不是顯示相似房源？
4. 是否要在候選預覽提供一個可編輯的「住宿名稱」欄位，讓使用者在確認座標時修正名稱，但仍保留來源與審核提示？
5. 請以安全、iPhone 可用性與一般化為原則審查，不要建議繞過 Booking 防爬、抓取私人訂單頁或把平台 Cookie／憑證送到伺服器。

## Fable 修改前的必讀順序

1. `AGENTS.md`
2. `trip-deploy/memory/project.md`
3. `trip-deploy/memory/project_state.md`
4. `trip-deploy/memory/decisions.md`
5. `trip-deploy/memory/known_issues.md`
6. `trip-deploy/documentation/architecture.md`
7. `trip-deploy/documentation/flows.md`
8. 本文件

如果 Fable 只提供建議，請要求它清楚區分「目前已實作」「推測」「建議變更」，並附上會影響的檔案與驗收方式，不要直接把假設寫成已完成。
