# 驗證地圖

2026-09-04 發布前聚焦測試涵蓋 Travel Area、Places、社群候選整合與 UI migration，共 39/39 通過，canonical source 與 deployment mirror 結果一致。較早的完整 canonical `node --test` 為 114/115，唯一失敗仍是原有缺少 Apple 簽署 `.shortcut` 成品的包裝測試；deployment mirror 為 114/114。專案目前沒有 GitHub Actions 或強制 branch protection；測試是發布前工作流程要求，但不是平台強制的 merge gate。

## Existing coverage

| 使用案例 | 固定規則與負面案例 | 證據 | 狀態 |
|---|---|---|---|
| PIN 登入 | 同暱稱 PIN 才能恢復；錯誤 PIN／過量嘗試拒絕 | `tests/auth.test.mjs`、`api/member.mjs` | existing integration |
| 旅程隔離 | 未加入者不能讀寫；邀請碼加入後才可存取 | `tests/auth.test.mjs`、`api/trips.mjs`、`api/trip.mjs` | existing integration |
| 成員管理 | 僅 owner 可移除；被移除舊客戶端不能恢復；退出時 owner 轉移 | `tests/auth.test.mjs` | existing integration |
| 私人購物 | member + trip 隔離；非成員拒絕 | `tests/shopping.test.mjs` | existing integration |
| 購物 AI | 只用 server key、圖片格式檢查、membership、無網圖仍保留辨識結果 | `tests/shopping-recognize.test.mjs` | existing integration |
| 商品研究／圖片 | 只能研究自己的項目；備援搜尋只在不足時啟動 | `tests/shopping-research.test.mjs`、`tests/product-image-search.test.mjs` | existing unit/integration |
| Google 地點匯入 | shared list 與普通 place link 分流；地址為原始證據；座標可轉可讀地址 | `tests/place-list.test.mjs`、`tests/places.test.mjs` | existing integration |
| 旅遊分區 | 穩定 key 分組；澀谷／淺草合併；明洞／Brooklyn／蒙馬特不放大；v2/v3/v4 遷移；手動優先與失敗保留 | `tests/planning-region.test.mjs`、`tests/ui-logic.test.mjs`、`documentation/travel-area-validation-2026-09-04.md` | unit/integration + live Google 17/17 + formal trip 31/31 acceptance |
| 社群匯入授權 | 必須是登入旅程成員；來源被擋時要求截圖 | `tests/social-place-import.test.mjs` | existing integration |
| 社群安全媒體 | allowlist、排除 avatar、輪播上限、最多 20 地點 | `tests/social-place-import.test.mjs` | existing unit/integration |
| 候選確認 | 分組、來源比對、重搜、略過，不強迫錯誤候選 | `tests/ui-logic.test.mjs`、`tests/social-place-import.test.mjs` | existing static/integration |
| Booking 地址 | 結構化完整地址優先，門牌不符候選排除，無商家頁使用座標候選 | `tests/social-place-import.test.mjs` | existing integration |
| Booking 阻擋頁降級 | 頁面回傳空白挑戰頁時，房東訊息的名稱與地址仍產生正確命名座標候選；Google 羅馬字地址（`1-chōme-16-19 Ōkubo`）門牌可正確比對，鄰近錯誤門牌排除 | `tests/social-place-import.test.mjs` | existing integration |
| 房東訊息擷取 | 多行編號訊息的地址不會吃進下一欄位；`公寓名稱：…` 成為住宿名稱；URL slug 轉為拼音線索 | `tests/social-place-import.test.mjs` | existing unit |
| Liberty Stay 名稱 | 公開 title 或完整 AI title 的尾端正式名稱在截斷前擷取；搜尋不再用「70 平方…」 | `tests/social-place-import.test.mjs` | existing unit/integration |
| 無效座標 | null 與 `0,0` 不能建立地圖位置；可走有限 OSM 備援 | `tests/social-place-import.test.mjs`、`tests/ui-logic.test.mjs` | existing unit/integration |
| 混合住宿證據 | 名稱、地址、Google Maps、Booking 合併成一筆 | `tests/ui-logic.test.mjs` | existing unit/static |
| 來源按鈕 | Google Maps 不能誤顯示 Threads | `tests/ui-logic.test.mjs` | existing static |
| 地圖開啟分流 | 手機／平板同頁導向交給 Maps App；桌面先開同源空白分頁、切斷 opener，再導向 Maps；成功、彈窗被擋、分頁導向失敗三種回傳分開驗證；地點、機場、交通按鈕與路線 marker 都必須走同一函式 | `tests/ui-logic.test.mjs` | existing unit/static |
| 自帶資產 | manifest 具備 192/512 any 與 512 maskable 真實 PNG；Leaflet 由 `vendor/` 提供且 index 不含 unpkg | `tests/ui-logic.test.mjs` | existing static |
| 底部導覽與提示 | 四個按鈕使用同一套語意旅行圖示、不含舊幾何字元；圖示不重複朗讀，`aria-current` 同步選中頁；匯入 sheet 說明訂房平台限制 | `tests/ui-logic.test.mjs` | existing unit/static + 375×812 browser |
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
| 高 | 沒有自動化 live 測試能證明 Booking 防爬頁在未來仍可安全降級（2026-08-21 已確認 Booking 回傳 HTTP 202 阻擋頁；mock 覆蓋此情境，但真實頁面行為可能再變） | 錯誤住宿名稱／位置 | none |
| 中 | Agoda 與 Airbnb 是否也開始阻擋伺服器抓取，尚未實測 | 住宿匯入靜默退化 | none |
| 高 | Google Maps browser key 尚待輪替與 referrer 限制的外部確認 | 配額與費用濫用 | none |
| 高 | 沒有平台強制 CI／branch protection | 未測試變更可直接進 main | none |
| 中 | Redis 備份、還原與資料保留未演練 | 正式旅程資料遺失 | none |
| 中 | 真實 iPhone 上 12 圖並行辨識與記憶體壓力未完成代表性測試 | 行動裝置穩定性 | none |
| 中 | Nominatim 使用量與 attribution 只有程式／UI 規則，沒有 live compliance check | 服務政策風險 | none |
| 低 | 靜態 UI regex 測試不能取代完整視覺回歸 | CSS 版面退化 | none |

# P1 isolated regression — 2026-09-06

Release candidate base: `7dcaa8c`; validated in worktree `p1-address-selection` before its single P1 commit.

Command (run from this worktree):

```powershell
node --test tests/maps-text-import.test.mjs tests/ui-logic.test.mjs tests/place-identity.test.mjs tests/social-place-import.test.mjs tests/lodging-page.test.mjs tests/places.test.mjs tests/planning-region.test.mjs tests/place-list.test.mjs
```

Result: **134/134 passed**, including thirteen targeted P1 tests. A–F cover one multiline address, room/floor/postal continuation, two one-line addresses, two multiline addresses without blank separation, one Maps URL with address text, and ambiguous room/floor evidence between two cores. Additional assertions prove candidates do not absorb one another, address components cannot become collections, ambiguous components never reach geocoding or submission, and cancellation leaves both the displayed count and actual submit at one. Existing social multiselect, lodging single-select, P0 identity and Travel Area v5 regressions pass.

`node --check app.js`, `node --check tests/maps-text-import.test.mjs`, syntax checks of all API `.mjs` files and `git diff --check` pass. Top-level API function count: **12**. Network calls in the new tests are mocked; no live Maps/browser/production acceptance is claimed.


## Places filters (2026-09-08)

- `tests/places-filters.test.mjs` checks key identity, missing areas, AND filters, invalid selection reset, old/malformed/custom tags, explicit category-only inference, shared sanitizer/JSON retention, and accessible scrolling chip markup. Restaurant editor runtime coverage verifies multi-select save and explicit clearing.
- Release: targeted 143/143; full 337/337; syntax/diff clean; API 12. Local Edge 393x852 filter rows and editor have no document overflow. Production acceptance reserved for user.


## Places filter UX follow-up

Targeted 107/107 and full 340/340; syntax/diff checks pass, API 12. Runtime tests cover all-kind cuisine filtering, shared map area keys and trip-scoped empty viewport; local full-DOM native touch verifies both chip rows, final chip reachability, map fit, empty viewport, adjacent controls and fullscreen. Polygon unavailable; no fabricated boundary.


## Fullscreen / cuisine inference / geometry (2026-09-09)

Targeted 141/141; full regression 348/348 once. New area-geometry tests cover multilingual inference, manual/empty precedence, 12 sourced mappings, composite polygons, country/name mismatch, cached load failures, stale A-to-B responses, clear-All and noninteractive rendering. Local 393x852 full-DOM/Leaflet fixture verifies dropdown, arrow drawer, same map instance, selection synchronization and actual boundary layers. Syntax/diff pass; 12 API functions. Source evidence and license: data/area-geometry/README.md.


## Production UX corrections (2026-09-09)

Targeted 132/132; full 352/352 once. Added area-scoped categories/reset, tag-only save/clear preserving Google identity/address/photos without requests, CID precedence and navigation URL exclusion from place-page/photo links. Local full-DOM 393x852 validates drawer edge placement, token-colored boundary and discoverable real multi-select/clear save flow. Syntax/diff pass; API 12.

## Places photo and category cleanup — 2026-09-09

- Baseline 0684223; canonical isolated source travel-app/prototype/places-cleanup. No production App opened.
- Detail gallery previously rendered stored custom/source media and the first three exact Google photo references without image-error handling. Failed remote media or /api/place-photo non-image error responses therefore left browser broken-image icons. The new per-gallery queue removes failed images, consumes unused valid photo resources belonging to the same exact Place ID, then shows an App placeholder. Pending images remain hidden until decoded; cached completions are handled. Neither search nor saved place/identity/photo metadata is changed. Place-page links and navigation remain separate. This diagnosis was reproduced locally; no claim of production-store-specific HTTP tracing.
- Restaurant details directly show category chips; the separate edit-category action and Save categories button are removed. The existing bottom general editor and its single Save remain. Tag-only saves retain the existing safe path preserving all non-tag fields.
- Editor chips derive from current trip restaurant values plus the current restaurant's own tags, with no fixed 13-item suggestion list. Custom labels trim, reject empty strings and deduplicate exact text; unchecking removes an assignment and clearing all saves explicit []. An unused tag disappears after save/reload; no global category database or schema migration. Explicit/manual arrays always win. Inference uses existing category/source/tags/description evidence, excludes names alone, and recognizes explicit seafood-buffet terms.
- Filters remain area-scoped using travelAreaKey and area/category AND. Unavailable selections reset, empty category rows hide. Secondary chips use 12px text, 11px horizontal padding and 32px visible pills inside 44px touch targets with native horizontal scrolling.
- Boundaries now use solid --accent #c8452d strokes for both map providers, unfilled and noninteractive. OSM geometry/source/attribution and composite components unchanged. API functions remain 12.
- Validation: targeted 134/134; full regression once 354/354; syntax of app.js and all 12 API modules; git diff --check. scripts/verify-places-ux.cjs runs the full app and Leaflet locally in a real touch-enabled browser at 393x852, with controlled image HTTP responses: partial and total photo failure, wrong-identity exclusion, real image decoding, custom tag add/dedup/remove/save/JSON reload/clear, dynamic options, solid boundary, drawer placement, secondary 44px touch area, zero page errors/overflow. Run with PLAYWRIGHT_MODULE set to an installed Playwright package. Assets 20260909.3.

## Exact photo resource refresh — 2026-09-09

- User accepted other UX; screenshots showed Ginza Hachigo working while three older entries had placeholders. Prior fallback only consumed saved references; photosLoaded/detailsLocked prevented normal detail updates. Google documents that photo resource names expire and must be obtained from recent Place Details (https://developers.google.com/maps/documentation/places/web-service/place-photos). No production App or private trip store opened; affected stores' individual HTTP failures were not inspected.
- Existing /api/place-photo now accepts exact placeId to fetch only id,photos, rejects mismatched response IDs, filters matching photo resource prefixes and returns at most 10 candidates with attribution. No text search. JSON and media redirects use no-store; no new function.
- Each detail gallery can refresh once when an image fails or saved safe references are insufficient, regardless of photosLoaded/detailsLocked. Fresh resources stay transient; no saved identity/name/address/tags/photos are mutated. Detached galleries and mismatched IDs ignore late responses. Refreshed image failures consume remaining exact candidates then use placeholders without retry loops. API/network failure retains existing safe images/placeholders.
- Validation: targeted 13/13; full regression once 356/356; syntax and git diff --check passed; API functions 12. Real local browser scripts/verify-photo-refresh.cjs recovers decoded fresh photos from expired references with photosLoaded/detailsLocked true, verifies one refresh/no metadata mutation and empty/mismatched/offline graceful fallback. Production App not opened. Assets 20260909.4.

## Fullscreen drawer filters — 2026-09-09

- Requested baseline 4d72a50; fetch confirmed latest origin/main d7d2863, preserving accepted photo refresh. Canonical worktree travel-app/prototype/drawer-filters.
- Fullscreen removes the duplicate kind dropdown while retaining top kind buttons; ordinary map dropdown unchanged. Restaurant drawer displays category chips through existing placesFilterModel/placesFilterChips, with area:false so the compact area dropdown remains unique. Options use actual selected-area restaurant tags and existing invalid-tag reset.
- List/Map/fullscreen share placeKind/placeAreaFilter/restaurantTagFilter/mapPreference. Mode switching no longer resets filters. Picking a restaurant tag retains restaurant kind when already selected. List applies existing matchesMapFilters so retained preference affects results too; date retains its existing day-map semantics.
- No changes to photo fallback, editor/custom categories, geometry/boundary, drawer handle, URL helpers, AI, Shopping or lodging.
- Targeted 88/88; full regression once 357/357; syntax and diff checks passed; API functions 12. Local real browser at 393x852 passes no duplicate kind, area-scoped drawer categories/reset, single-place AND result and shared kind/area/tag/preference across List/Map/fullscreen round trips. Production App not opened. Assets 20260909.5.

## Travel Area boundary component semantics — 2026-09-09

- Baseline 7fee1ed; canonical source travel-app/prototype/boundary-components. Existing polygons were already separate, but uniform unlabeled rendering implied one Travel Area administrative boundary. No Google/OSM source equivalence is claimed.
- Runtime mapping explicitly exposes travelAreaKey -> geometryComponents[] backed by original FeatureCollection features. Every component keeps its original rings, OSM relation ID and local name. No geometry files, resolver, union/hull/outer envelope or coordinates changed.
- Google draws each component's original rings with componentId and uses small OverlayView text in overlayLayer below POI markers. Leaflet creates independent GeoJSON component layers and noninteractive permanent labels in its pointer-transparent boundary pane. Labels anchor to a vertex on the original outer ring (text positioning only). Existing accent solid strokes retained.
- Credit says N independent town boundaries for composites, and explains lines are source town boundaries rather than an official Travel Area administrative perimeter. OSM/ODbL credit remains. Single component renders normally; All clears boundaries and label overlays. Existing async stale-response protection retained.
- Ebisu/Daikanyama components: 恵比寿 (relation 9521529), 恵比寿西 (17008303), 代官山町 (17022574). All 12 catalog mappings preserve the original feature/coordinate data.
- Validation: targeted 10/10; full regression once 359/359; app/API syntax, diff check; API functions 12. Local full-DOM touch browser validates three separate Leaflet layers/local-name labels, pointer-events:none, fullscreen switch to one Ginza component, then All removes every line/label/credit. Production App not opened. Assets 20260909.6.
