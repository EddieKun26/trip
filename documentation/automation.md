# AI 與外部自動化

## 共同原則

- 所有 AI 工作都由使用者按下辨識／搜尋觸發，沒有背景自主執行。
- AI 輸出是候選或可編輯草稿，不直接修改 Redis。
- 真正副作用由 App 擁有：只有使用者確認後，App 才呼叫寫入 API。
- Prompt 負責辨識方向；hard guardrails 由 allowlist、session/membership、schema、大小限制、每日額度、座標／地址清理與使用者確認組成。

## 社群與住宿地點辨識

| 項目 | 內容 |
|---|---|
| 觸發／擁有者 | 已登入旅程成員按「辨識」 |
| 可讀輸入 | allowlist URL 的公開 metadata、最多 20 張安全媒體、可選截圖、同欄位文字、旅程目的地 |
| 可呼叫 API | OpenAI Responses（必要時 `web_search`）、Google Places Text Search、Google Geocoding、有限 Nominatim search |
| Prompt steering | 辨識旅遊地點、保留多店清單、回傳結構化名稱／地址／證據／圖片索引 |
| Hard guardrails | session + membership、主機／redirect allowlist、媒體 MIME/大小、strict JSON schema、最多 20 地點、Google 併發 5、每日每人 30 次、精確門牌優先、拒絕 `0,0` |
| 輸出契約 | `source` + 多個 `groups`，每組包含 extracted mention 與 Google candidates |
| 失敗處理 | 來源被擋時要求截圖；Google 無可靠候選時不寫入；每組可重搜或略過 |
| 寫入邊界 | 使用者選定候選並再次確認後，前端才透過 trip API 寫入 |

住宿額外規則：

- Booking／Agoda／Airbnb 強制歸類 lodging，保留原始訂房 reference。
- Booking 結構化完整地址優先於 AI 推測；日本郵遞區號與門牌用來排除附近錯誤住宿。
- 長房型標題會從完整字串尾端擷取正式短名稱，例如 `Liberty Stay`；擷取在 160 字顯示截斷之前執行。
- 沒有 Google 商家頁時可建立 `住宿座標`，但預覽必須清楚標示並要求核對。

## 購物截圖辨識

| 項目 | 內容 |
|---|---|
| 觸發／擁有者 | 已登入旅程成員選擇 1–12 張截圖 |
| 可讀輸入 | 使用者選擇並在瀏覽器壓縮的圖片 |
| 可呼叫 API | OpenAI Responses + `web_search`；商品圖片來源頁抓取 |
| Prompt steering | 每張圖只辨識一個主商品，保留原語品牌／品名並提供繁中意義 |
| Hard guardrails | session + membership、圖片 data URL/MIME/大小、strict schema、每人每日辨識 60 次 |
| 輸出契約 | 可編輯品牌、品名、功能、分類、信心與最多 3 張網頁商品圖候選 |
| 寫入邊界 | 使用者修改、選圖並確認後才寫私人購物清單 |

## 商品研究與換圖

- 舊項目研究：每人每日 30 次。
- 換一批圖片：每人每日 80 次；排除已看過候選 ID。
- 主搜尋不足三張時才執行兩個備援查詢並交錯來源。
- 抓取圖片上限 700 KB；不使用生成圖片。

## 操作控制

- 額度／kill switch：移除或停用 `OPENAI_API_KEY` 可立即停用 AI；Google key 可在 Cloud Console 限制或停用。
- Retry：只做明確且有限的備援；沒有無限迴圈或背景重試。
- Audit：Redis 保存每日計數；Vercel Functions log 只記安全錯誤碼，不應記錄 key。
- Approval gate：地點與購物資料均需要前端明確確認。
- Store policy：OpenAI 請求設定 `store: false`。
