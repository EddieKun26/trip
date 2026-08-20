# 高風險流程

## 1. 暱稱與 PIN 登入

- 角色：未登入使用者
- 前提：提供 1–10 字暱稱與 4 位數 PIN
- 成功結果：取得 HttpOnly session Cookie；可存取自己的旅程清單

流程：

1. 瀏覽器 POST `/api/member`。
2. 伺服器正規化暱稱，以暱稱雜湊尋找帳號。
3. 新帳號以隨機 salt + scrypt 儲存 PIN 雜湊；既有帳號以 timing-safe 比對驗證。
4. 同暱稱與來源 IP 五分鐘內超過 10 次嘗試時拒絕。
5. 伺服器產生 32-byte 隨機 token，只把 token 雜湊後的索引與成員資料寫入 Redis。
6. 瀏覽器收到 `HttpOnly; Secure; SameSite=Lax` Cookie。

拒絕：PIN 格式錯誤、PIN 不符、嘗試過多、Redis 未設定。

## 2. 建立、加入與管理旅程

- 角色：已登入成員；移除成員時限旅程 owner
- 前提：有效 session；加入時有 6 位邀請碼
- 成功結果：建立／加入／更新旅程，或安全移除／退出成員

流程：

1. `/api/trips` 先由 Cookie 查 session；無 session 一律 401。
2. 建立旅程時驗證名稱、目的地、日期與 60 天上限，建立 owner、invite code、revision。
3. 加入旅程時由 invite code 查 trip ID，再把目前 member 加入 `trip.members` 與個人 trip index。
4. 更新旅程時再檢查 `trip.members[member.id]`。
5. 移除成員時額外檢查 `trip.ownerId === member.id`；同步移除票選、個人 trip index 與該成員私人購物資料。
6. 成員退出時移除自己的票選與購物資料；owner 退出則轉移給剩餘第一位成員；最後一人退出才刪除旅程與邀請碼。

拒絕：非成員讀寫、非 owner 移除成員、無效邀請碼、自己移除自己、無效日期。

## 3. 共同旅程寫入

- 角色：旅程成員
- 前提：有效 session 且是目標旅程成員
- 成功結果：航班、地點、票選、行程與交通更新至共用旅程

流程：

1. 瀏覽器 PUT `/api/trip?tripId=…`。
2. 伺服器由 Cookie 查 member，再讀目標 trip。
3. 確認 `trip.members[member.id]`，非成員拒絕。
4. 清理傳入 payload、保留伺服器掌控的成員／owner／invite 欄位，revision +1，寫回 Redis。
5. 其他已開啟的成員分頁定期讀取較新的 revision。

資料完整性：前端的一階 undo 是使用者體驗，不取代伺服器授權；共用資料仍以伺服器回傳版本為準。

## 4. Booking／Agoda／Airbnb 住宿匯入

- 角色：已登入旅程成員
- 前提：允許的住宿網址，必要時加上完整地址、Google Maps 連結或截圖
- 成功結果：顯示可核對的 Google 候選或精確地址座標候選；使用者確認後才寫入

流程：

1. 瀏覽器把來源 URL、同欄位文字與可選截圖送到 `/api/social-place-import`。
2. 伺服器驗證 session、旅程 membership、來源主機與 redirect；秘密 key 不進瀏覽器。
3. 嘗試讀取公開 metadata、Booking 結構化 `formattedAddress` 與媒體；阻擋頁不視為可靠內容。
4. OpenAI 產生結構化地點線索；每日額度限制在 AI 呼叫前執行。
5. 清理階段強制住宿類別、保留精確郵遞區號／門牌，從完整 Booking 或 AI 標題擷取尾端正式短名稱，例如 `Liberty Stay`，移除「70 平方、浴室、站地」等房型描述。
6. Google Places 以短名稱與精確地址找候選；門牌不符的附近住宿被排除。
7. 沒有獨立商家頁時，Google 地址查詢或有限的 Nominatim 備援建立 `住宿座標`；null、空值、超範圍與 `0,0` 一律拒絕。
8. 若同一欄位包含明確名稱、地址、Google Maps 與 Booking，前端合併為一筆住宿，保留 Booking reference 與 Google 座標。
9. 使用者開啟候選預覽核對地圖和完整地址，選擇並按確認後，才經 `/api/trip` 寫入。

拒絕：不支援主機、非旅程成員、AI/Places 未設定、來源不足、無可靠候選、每日額度耗盡。

## 5. Instagram／Threads 地點匯入

- 角色：已登入旅程成員
- 前提：公開貼文或使用者截圖
- 成功結果：最多 20 個辨識群組，每組可選、重搜或略過

信任邊界：只接受 allowlist 社群主機及 Meta 媒體主機；公開 HTML、caption、圖片與 AI 輸出均為不可信輸入。每個群組必須由使用者選擇 Google 候選，AI 不直接寫資料。

## 6. 私人購物清單與 AI 截圖辨識

- 角色：已登入旅程成員
- 前提：是目標旅程成員；AI 辨識需有效圖片
- 成功結果：只有該 member + trip 能讀寫的購物項目

流程：

1. `/api/shopping` 由 session 取 member，再確認 trip membership。
2. Redis key 同時包含 member ID 與 trip ID；旅伴無法讀取彼此購物清單。
3. `/api/shopping-recognize`、`shopping-research`、`shopping-images` 重複執行 session 與 membership 檢查，並套用每日額度。
4. OpenAI 僅回傳可編輯候選；使用者確認後才 PUT 私人清單。
5. 成員退出或被移除時，該旅程的私人購物資料會刪除。

拒絕：未登入、非旅程成員、圖片格式/大小錯誤、AI key 缺失、每日額度超限。
