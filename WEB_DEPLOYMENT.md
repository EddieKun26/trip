# 東京旅遊 App：Google Places API 與網頁版上線指南

這一版採用「網頁前端＋伺服器端 API」：瀏覽器只呼叫本站的 `/api/places`，Google Maps API 金鑰存放在 Vercel 環境變數，不會出現在 `app.js` 或使用者的瀏覽器中。

## 一、建立 Google Places API 金鑰

1. 前往 [Google Cloud Console](https://console.cloud.google.com/) 並登入 Google 帳號。
2. 建立新專案，例如 `Tokyo Family Trip`。
3. 進入「Billing／帳單」，為專案連結付款方式。Google Maps Platform 必須啟用帳單才能呼叫 Places API。
4. 進入「APIs & Services／API 和服務」→「Library／程式庫」。
5. 搜尋並啟用 **Places API (New)**。
6. 進入「Credentials／憑證」→「Create credentials／建立憑證」→「API key」。
7. 打開剛建立的金鑰，於「API restrictions」選擇 **Restrict key**，只勾選 **Places API (New)**。
8. 先不要把金鑰貼到 `app.js`、HTML、GitHub 或聊天室。後面會把它放進 Vercel 的加密環境變數。
9. 初期設定每日配額與預算警示；確認部署穩定後，再依實際使用量調整。

## 二、準備 GitHub 儲存庫

建議把 `travel-app/prototype` 當成網頁專案根目錄。這個資料夾已包含：

- `index.html`、`app.js`、`styles.css`：網頁 App。
- `api/places.js`：安全呼叫 Google Places 的伺服器端函式。
- `vercel.json`：Vercel 部署設定。
- `.env.example`：環境變數名稱範例，不包含真實金鑰。
- `.gitignore`：避免把本機金鑰與 Vercel 設定提交到 Git。

將這個資料夾提交到私人 GitHub repository。不要建立含有真實金鑰的 `.env` commit。

## 三、部署到 Vercel

1. 前往 [Vercel](https://vercel.com/) 並以 GitHub 登入。
2. 選擇「Add New…」→「Project」，匯入剛才的 GitHub repository。
3. 如果整個 repository 包含其他資料，將 **Root Directory** 設為 `travel-app/prototype`；若 repository 本身就是此資料夾，保持 `./`。
4. Framework Preset 選擇 **Other**，不需要 Build Command，也不需要 Output Directory。
5. 在部署前展開「Environment Variables」，新增：
   - Name：`GOOGLE_MAPS_API_KEY`
   - Value：剛才建立的 Google Maps API 金鑰
   - Environments：Production、Preview、Development 都可先勾選
6. 按下 Deploy。完成後會取得 `https://你的專案.vercel.app` 網址。
7. 每次修改 GitHub 預設分支後，Vercel 會自動重新部署。

環境變數修改只會套用到新部署；若之後更換金鑰，要在 Vercel 重新部署一次。

## 四、確認 API 是否成功

1. 開啟部署後的 App。
2. 到「地點」→「新增地點」。
3. 貼上一個新的 Google Maps 景點連結並按「辨識並預覽」。
4. 成功時會顯示「資料已辨識」，並自動帶入名稱、區域、類型、營業時間及電話。
5. 如果仍顯示「需要 Places API」，依序檢查：
   - Google Cloud 是否啟用 Places API (New)。
   - 專案是否連結帳單。
   - Vercel 的環境變數名稱是否完全等於 `GOOGLE_MAPS_API_KEY`。
   - 新增或修改環境變數後是否重新部署。
   - API key 的 API restrictions 是否允許 Places API (New)。

## 五、iPhone 使用方式

1. 在 iPhone Safari 開啟 Vercel 網址。
2. 點分享按鈕。
3. 選擇「加入主畫面」。
4. 之後可像一般 App 從主畫面開啟；第一階段不需要上架 App Store。

## 六、成熟後再做測試 App

建議先讓家人用網頁版測試收藏、推薦、批次匯入、地圖和每日行程。功能穩定後，再把相同資料模型與 API 搬到 SwiftUI，透過 TestFlight 給家人測試。屆時 API 金鑰仍應留在伺服器端，iPhone App 只呼叫自己的 API。

正式公開前還需要加入登入、資料庫、API 頻率限制與多人即時同步；目前這個版本適合少量家人測試。
