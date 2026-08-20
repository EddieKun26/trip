# 環境變數與秘密

文件只記錄變數名稱與用途，不記錄任何實際值。

| 名稱 | 使用位置 | 範圍 | 來源／輪替 | 主要風險 |
|---|---|---|---|---|
| `KV_REST_API_URL` | 所有 Redis API | 伺服器 | Vercel Storage 綁定；更換 Redis 時更新並重新部署 | 洩漏會暴露資料庫端點 |
| `KV_REST_API_TOKEN` | 所有 Redis API | 伺服器秘密 | Vercel Storage；疑似洩漏立即輪替 | 可讀寫帳號、session、旅程與購物資料 |
| `UPSTASH_REDIS_REST_URL` | Redis 相容備援名稱 | 伺服器 | Upstash/Vercel | 同上 |
| `UPSTASH_REDIS_REST_TOKEN` | Redis 相容備援名稱 | 伺服器秘密 | Upstash/Vercel；疑似洩漏立即輪替 | 同上 |
| `GOOGLE_MAPS_API_KEY` | Places、Geocoding、Place Photo | 伺服器秘密 | Google Cloud；限制 Places/Geocoding，定期檢查用量 | 洩漏可能產生費用與配額濫用 |
| `GOOGLE_MAPS_BROWSER_KEY` | `/api/maps-browser-config` → 瀏覽器地圖 | 用戶端可見 | Google Cloud；必須限制正式網域 referrer 與必要 API | 不能視為秘密；限制錯誤會被濫用 |
| `OPENAI_API_KEY` | 社群／住宿與購物 AI | 伺服器秘密 | OpenAI Project；設定月度預算，疑似洩漏立即輪替 | 洩漏會產生費用與資料處理風險 |
| `OPENAI_MODEL` | AI API 模型覆寫 | 伺服器設定 | Vercel；預設 `gpt-5.6-luna` | 模型變更可能改變成本、延遲與輸出品質 |

## 用戶端秘密確認

- `app.js`、`index.html`、`styles.css` 不包含 Redis、OpenAI 或 server-side Google key。
- session token 只能由 HttpOnly Cookie 傳輸，前端 JavaScript 不讀取 token。
- `GOOGLE_MAPS_BROWSER_KEY` 設計上會傳給瀏覽器，因此保護方式是 referrer/API 限制與用量監控，不是隱藏字串。

## 上線前／交接檢查

- [ ] 輪替曾在對話中出現的 Google Maps key。
- [ ] Browser key 只允許正式 Vercel 網域及必要 Maps JavaScript API。
- [ ] Server key 只允許 Places API (New)、Geocoding 與必要 Photo 功能。
- [ ] OpenAI key 僅存在 Vercel Production/Preview 所需環境，沒有提交到 Git。
- [ ] OpenAI Project 已設定合理 spend limit 與用量警示。
- [ ] Redis token 沒有出現在瀏覽器 network response、log、文件或截圖。
- [ ] 環境變數變更後重新部署，並以 health／實際匯入流程確認。
- [ ] Vercel 與 Upstash 的帳號交接採平台權限，不以聊天傳送明文 key。
