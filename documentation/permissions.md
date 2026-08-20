# 權限矩陣

## 角色與範圍來源

| 角色 | 判斷來源 | 說明 |
|---|---|---|
| 未登入／訪客 | 無有效 session；前端 guest mode | 只看本機示範／空畫面，不具 API 寫入權限 |
| 已登入成員 | Redis session + `trip.members[member.id]` | 可編輯自己加入的旅程 |
| 旅程 owner | 上述 membership + `trip.ownerId` | 額外可移除其他成員 |

權限不依賴前端按鈕是否顯示；API 端必須以 Redis session 與旅程資料重新判斷。

## 資源 × 操作 × 角色

| 資源／操作 | 未登入 | 已登入但非成員 | 旅程成員 | Owner |
|---|---:|---:|---:|---:|
| 建立／驗證暱稱與 PIN | 允許 | 允許 | 允許 | 允許 |
| 列出自己的旅程 | 拒絕 | 僅自己的索引 | 允許 | 允許 |
| 建立旅程 | 拒絕 | 允許 | 允許 | 允許 |
| 以邀請碼加入旅程 | 拒絕 | 允許 | 允許 | 允許 |
| 讀取私密旅程 | 拒絕 | 拒絕 | 允許 | 允許 |
| 修改旅程基本資料 | 拒絕 | 拒絕 | 允許 | 允許 |
| 修改航班／地點／票選／行程／交通 | 拒絕 | 拒絕 | 允許 | 允許 |
| 移除其他成員 | 拒絕 | 拒絕 | 拒絕 | 允許 |
| 退出自己的旅程 | 拒絕 | 拒絕 | 允許 | 允許 |
| 讀寫自己的私人購物清單 | 拒絕 | 拒絕 | 允許 | 允許 |
| 讀寫旅伴的私人購物清單 | 拒絕 | 拒絕 | 拒絕 | 拒絕 |
| 呼叫社群／住宿 AI 匯入 | 拒絕 | 拒絕 | 允許 | 允許 |
| 呼叫購物 AI／圖片搜尋 | 拒絕 | 拒絕 | 允許 | 允許 |
| 取得 server-side Google Places key | 拒絕 | 拒絕 | 拒絕 | 拒絕 |

## 資料層控制

- Redis 無資料庫原生 row-level security；所有隔離依賴 Vercel API 內的程式檢查。
- 旅程 membership 來自 Redis 內的 `trip.members`，不是瀏覽器傳入的角色宣告。
- 私人購物 Redis key 為 member + trip 組合，API 仍先確認該 member 屬於 trip。
- Invite code 是加入權限的 bearer secret；加入後才形成持續 membership。
- Session token 只放 HttpOnly Cookie；Redis 只儲存 token digest 對應的 member。

## 需要審查的負面案例

- 被 owner 移除後，舊分頁不得透過舊 UI 狀態恢復旅程存取。
- 非 owner 不得偽造 `removeMember` action。
- 成員 A 不得用自己的 session 加上成員 B 的 ID 讀取 B 的購物清單。
- 外部網址與 AI 回傳不得改變目前 member、trip membership、owner 或 invite code。
- 訪客模式的前端限制不能被視為授權控制；所有寫入 API 仍須拒絕無 session 請求。
