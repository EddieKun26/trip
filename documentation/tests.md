# 驗證地圖

目前 `node --test` 共 85 項，會在 canonical source 與 deployment mirror 各跑一次。專案目前沒有 GitHub Actions 或強制 branch protection；測試是發布前工作流程要求，但不是平台強制的 merge gate。

## Existing coverage

| 使用案例 | 固定規則與負面案例 | 證據 | 狀態 |
|---|---|---|---|
| PIN 登入 | 同暱稱 PIN 才能恢復；錯誤 PIN／過量嘗試拒絕 | `tests/auth.test.mjs`、`api/member.mjs` | existing integration |
| 旅程隔離 | 未加入者不能讀寫；邀請碼加入後才可存取 | `tests/auth.test.mjs`、`api/trips.mjs`、`api/trip.mjs` | existing integration |
| 成員管理 | 僅 owner 可移除；被移除舊客戶端不能恢復；退出時 owner 轉移 | `tests/auth.test.mjs` | existing integration |
| 私人購物 | member + trip 隔離；非成員拒絕 | `tests/shopping.test.mjs` | existing integration |
| 購物 AI | 只用 server key、圖片格式檢查、membership、無網圖仍保留辨識結果 | `tests/shopping-recognize.test.mjs` | existing integration |
| 商品研究／圖片 | 只能研究自己的項目；備援搜尋只在不足時啟動 | `tests/shopping-research.test.mjs`、`tests/product-image-search.test.mjs` | existing unit/integration |
| Google 地點匯入 | shared list 與普通 place link 分流；羅馬字地區轉中文；座標可轉可讀地址 | `tests/place-list.test.mjs`、`tests/places.test.mjs` | existing integration |
| 社群匯入授權 | 必須是登入旅程成員；來源被擋時要求截圖 | `tests/social-place-import.test.mjs` | existing integration |
| 社群安全媒體 | allowlist、排除 avatar、輪播上限、最多 20 地點 | `tests/social-place-import.test.mjs` | existing unit/integration |
| 候選確認 | 分組、來源比對、重搜、略過，不強迫錯誤候選 | `tests/ui-logic.test.mjs`、`tests/social-place-import.test.mjs` | existing static/integration |
| Booking 地址 | 結構化完整地址優先，門牌不符候選排除，無商家頁使用座標候選 | `tests/social-place-import.test.mjs` | existing integration |
| Liberty Stay 名稱 | 公開 title 或完整 AI title 的尾端正式名稱在截斷前擷取；搜尋不再用「70 平方…」 | `tests/social-place-import.test.mjs` | existing unit/integration |
| 無效座標 | null 與 `0,0` 不能建立地圖位置；可走有限 OSM 備援 | `tests/social-place-import.test.mjs`、`tests/ui-logic.test.mjs` | existing unit/integration |
| 混合住宿證據 | 名稱、地址、Google Maps、Booking 合併成一筆 | `tests/ui-logic.test.mjs` | existing unit/static |
| 來源按鈕 | Google Maps 不能誤顯示 Threads；Google Maps 使用同頁導向避免空白視窗 | `tests/ui-logic.test.mjs` | existing static |
| iPhone UI 規則 | 匯入 sheet、16px 輸入、正圓 close control、時間與航班欄位版面 | `tests/ui-logic.test.mjs` | existing static |
| 行程／地圖完整性 | 時間排序、拖曳、路線、航班虛線、交通關聯與 review 狀態 | `tests/ui-logic.test.mjs` | existing static/unit |
| 部署更新 | HTML 資產版本與 foreground update check 存在 | `tests/ui-logic.test.mjs` | existing static |

## Proposed tests

| 類型 | 使用案例 | 預期行為 | 狀態 |
|---|---|---|---|
| guarded live | 真實 Booking URL 在無登入 Cookie／被擋頁狀態 | 不採用附近錯誤 70 平方住宿；可得 Liberty Stay 時用短名，否則要求補充名稱或地址 | proposed |
| manual iPhone | 以正式站貼上 Liberty Stay Booking URL | 首選名稱顯示 `Liberty Stay`，地址為 〒169-0072 1-16-19，地圖非 `0,0` | proposed |
| manual iPhone | 同欄位貼名稱＋地址＋Google Maps＋Booking | 只出現一個住宿群組，reference 與精確座標都保留 | proposed |
| guarded live | Google Places 回傳附近多間百人町／大久保住宿 | 門牌不符者不能取代精確地址座標 | proposed |
| manual iPhone | Google Maps app handoff | 不留下空白 Safari 分頁 | proposed |
| security integration | 竄改 trip ID／member ID／owner action | API 401/403 且 Redis 無副作用 | proposed |
| operational | OpenAI、Google、Redis 個別故障 | 顯示可理解錯誤，不寫入半成品、不洩漏 provider response/key | proposed |
| performance | 20 地點社群貼文、12 張購物圖 | 併發受控、iPhone 不崩潰、完成／失敗狀態可獨立呈現 | proposed |

## Gaps

| 優先度 | 未驗證規則 | 暴露面 | 狀態 |
|---|---|---|---|
| 高 | 沒有自動化 live 測試能證明 Booking 防爬頁在未來仍可安全降級 | 錯誤住宿名稱／位置 | none |
| 高 | Google Maps browser key 尚待輪替與 referrer 限制的外部確認 | 配額與費用濫用 | none |
| 高 | 沒有平台強制 CI／branch protection | 未測試變更可直接進 main | none |
| 中 | Redis 備份、還原與資料保留未演練 | 正式旅程資料遺失 | none |
| 中 | 真實 iPhone 上 12 圖並行辨識與記憶體壓力未完成代表性測試 | 行動裝置穩定性 | none |
| 中 | Nominatim 使用量與 attribution 只有程式／UI 規則，沒有 live compliance check | 服務政策風險 | none |
| 低 | 靜態 UI regex 測試不能取代完整視覺回歸 | CSS 版面退化 | none |
