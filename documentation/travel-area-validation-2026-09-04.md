# 旅遊分區驗證 — 2026-09-04

狀態：程式、本機驗證與完整正式旅程 31 筆畫面驗收均已完成。

## 規格與資料模型

- Google `addressComponents` / `addressComponentsOriginal` 是原始證據；`administrativeAreas` 是獨立的行政資訊。
- 清單只使用 `travelAreaKey` 分組，標題固定為 `travelAreaZh（travelAreaLocal）`。
- 日本依明確的旅遊分區規則混用知名街區、區、市，不以同一行政層級概括。
- 韓國／美國保留既有旅遊粒度；沒有對應規則的細分區不直接放大為其父行政區或城市。
- 手動分區優先。自動辨識版本為 5，版本 2、3、4 均須重處理。失敗保留上一可用分類，提供重試與編輯。
- `area*`、`planningRegion*` 僅保留舊資料相容用途，不能作為清單群組鍵。

## 必要案例（單元測試通過）

| 原始地址證據 | 最終顯示 | 群組鍵 |
|---|---|---|
| 東京都渋谷区神宮前 | 澀谷（渋谷） | shibuya |
| 東京都渋谷区神南 | 澀谷（渋谷） | shibuya |
| 東京都台東区花川戸 | 淺草（浅草） | asakusa |
| 東京都台東区雷門 | 淺草（浅草） | asakusa |
| 東京都中央区銀座 | 銀座（銀座） | ginza |
| 東京都練馬区 | 練馬（練馬） | nerima |
| 神奈川県鎌倉市 | 鎌倉（鎌倉） | kamakura |
| 서울특별시 중구 명동 | 明洞（명동） | myeongdong |
| Brooklyn, New York | 布魯克林（Brooklyn） | brooklyn |

另外驗證蒙馬特仍為 `蒙馬特（Montmartre）`，而不是巴黎；API 有回傳地址但無有效分區規則時不算成功。

## Google Places 實際地址驗證

`scripts/validate-planning-regions-live.mjs` 使用 Google Places Text Search 與各國當地語言 Place Details，檢查實際地址線索及最終標題。2026-09-04 最終重跑結果為 **17/17 通過**。

案例包含富ヶ谷、神宮前、神南、惠比壽、代官山、西新宿、銀座、花川戶、雷門、淺草、大塚、練馬、鎌倉、江南、明洞、Brooklyn、Montmartre。神宮前／神南與花川戶／雷門各自共用群組鍵；輸出的穩定群組沒有四個被禁止的過細標題。

## 完整正式旅程 31 筆 migration 與 UI 驗收

完整正式旅程以最小化本機快照載入未修改的新前端，並經一般 `/api/places` v5 migration 流程處理。快照、原始地址、Place ID、登入資料與驗收截圖均保留在本機，不納入 Git；驗收過程沒有寫回 production。

驗收結果：

- 31/31 筆完成 version 5 自動辨識，0 筆失敗、0 個可重試群組、0 個 page error。
- 最終 31 筆完整呈現且沒有重複，共 14 個唯一 `travelAreaKey` 群組。
- `澀谷（渋谷）` 正確合併 5 筆；`淺草（浅草）` 正確合併 3 筆。
- 穩定群組標題不再出現神宮前、神南、花川戶／花川戸、雷門或 `正在辨識地區`。
- 每一個群組標題都符合 `繁體中文（當地語言）`；逐筆對照正式快照地址後，其他 24 筆也未發現錯誤分組。

最終 14 個群組為：銀座、惠比壽／代官山、新宿、大塚、豐洲、池袋、丸之內／大手町、築地、麻布十番、淺草、練馬、澀谷、東京鐵塔／芝公園、原宿／表參道。

## 發布前回歸

- 四個變更的 production JavaScript 檔案通過 `node --check`。
- Travel Area、Places、社群候選整合與 UI migration 的發布前聚焦測試在 canonical source 與 deployment mirror 均為 39/39 通過。
- 較早完整 canonical `node --test` 為 114/115，唯一失敗是既有缺少 Apple 簽署 `shortcuts/旅伴匯入.shortcut` 的包裝測試；deployment mirror 為 114/114。未完成 Shortcut UI、CSS、測試與成品均未同步。
- 完整正式 31 筆資料已完成 v5 migration 與 UI 驗收，Travel Area release gate 通過。
- 部署內容不包含 `.env.local`、`.vercel/`、fixture、正式旅程快照、登入資料、本機驗證 server、暫存程式或驗收圖片。

舊版 `planning-region-validation-2026-09-03.md` 已撤除，當中把地址行政層級當作旅遊分區的結論作廢。
