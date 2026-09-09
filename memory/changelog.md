# Changelog

## 2026-09-04

- Closed Travel Area v5 after its successful production deployment. The user-confirmed `東京 7 日` production smoke test loaded all 31 places, completed the normal v5 migration, retained 14 `繁體中文（當地語言）` groups, merged the expected five Shibuya places and three Asakusa places, exposed none of 神宮前、神南、花川戶／花川戸、雷門 or a permanent `正在辨識地區` group, and produced zero page or console errors. The feature is complete; no Travel Area deployment, migration, or formal acceptance remains pending.
- Corrected canonical memory before implementation: Travel Area is a traveler-facing same-day grouping, not a fixed administrative level. `travelAreaKey`, `travelAreaZh`, and `travelAreaLocal` are separate from raw Google components and `administrativeAreas`; collection grouping uses only the stable key.
- Implemented version 5 rules with required Shibuya/Asakusa/Ginza/Nerima/Kamakura/Myeongdong/Brooklyn outcomes and preserved Montmartre. Every older automatic version is refreshed; manual assignments win. Failed recognition preserves the previous usable category, exposes retry/manual editing, and never leaves a permanent recognizing label.
- Canonical syntax checks pass; the focused Travel Area/Places/social-import suite passes 39/39 in both canonical source and the deployment mirror. The earlier full-suite result remains 114/115 in canonical source, with only the pre-existing missing Apple-signed Shortcut packaging failure, and 114/114 in the deployment mirror. Unrelated unfinished Shortcut source work remains only in canonical source. Final live Google validation passes 17/17.
- Completed full formal-trip UI acceptance with a user-provided minimized snapshot of all 31 existing places. The unchanged new frontend migrated 31/31 to v5 with zero failures, 14 unique `繁體中文（當地語言）` groups, correct Shibuya and Asakusa merges, no forbidden fine-grained group, no retry state, and no page error. Address-by-address review found no other incorrect grouping. The snapshot and validation screenshots remain local evidence and are excluded from Git.
- Frontend asset version `20260904.1` is the validated and production-deployed Travel Area v5 build. The earlier local acceptance did not mutate production data; its snapshot and screenshots remain excluded from Git. See `documentation/travel-area-validation-2026-09-04.md`.
- Applied and pushed the minimal Vercel function-count-limit hotfix as commit `433d2d4`: moved the byte-identical `planning-region.mjs` helper from `api/` to `lib/`, updated only its imports, reduced top-level `api/*.mjs` routes from 14 to 13, and reran the focused Travel Area/Places/social-import/UI migration suite at 39/39 plus syntax/import checks. That production deployment attempt failed at `Deploying outputs...` with `function-count-limit`; a production-mode Vercel build confirmed 13 generated functions (`lodging-page`, `maps-browser-config`, `member`, `place-list`, `place-photo`, `places`, `shopping-images`, `shopping-recognize`, `shopping-research`, `shopping`, `social-place-import`, `trip`, and `trips`). No second deployment was run during that attempt; the later successful production result is recorded in the closeout entry above.

## 2026-09-03

- Superseded on 2026-09-04: the previous area/planning-region versions 2–4 incorrectly equated travel grouping with address administrative levels and could overwrite manual choices or leave pending labels. Those grouping and validation conclusions are revoked; do not reuse them as requirements. Destination-aware search and retained bilingual raw address evidence remain valid.
- Added a manual lodging/custom-place path beside link recognition. Editors can paste a host-provided address and optional Google Maps link, choose their own display name/type/area, and attach, replace, or remove a compressed shared photo. Exact addresses use Google Geocoding rather than nearby-business Places search.
- Added editor controls to every saved place detail. Name, category, type, address, Maps link, area labels, and personal photo can be corrected later; renaming a place also updates votes, itinerary references, transport labels, and active map selection.
- Advanced frontend assets to `20260903.1`. Source and deployment suites pass 99/99 available checks; the canonical source still has the separate pre-existing unsigned iOS Shortcut packaging failure. A 393×852 layout pass confirmed 16px inputs, 44–54px actions, and no document-level horizontal overflow.
- Advanced frontend assets to `20260903.2`. All 100 deployment checks pass, including Japanese exact-address, Korean, and Latin-script area localization coverage.

## 2026-09-02

- Reworked planning/day map selection into a compact-marker → bottom preview card → full place-detail flow. Marker and rail selection now animate/pan without rebuilding the map; the preview shows a Google place photo when available and enriches missing photos in the background.
- Flights now support up to six ordered legs per direction. Outbound, return, and round-trip submissions can append transfer legs; each leg keeps a compatible flight record plus `journeyId`, `segmentIndex`, and `segmentCount`. Added common Europe, Middle East, and North America hubs.
- Private Shopping items now store an editable numeric price and ISO currency. Screenshot recognition copies only a clearly visible single-item price, all review/edit surfaces expose it, and the list totals each currency separately without automatic exchange-rate conversion.
- Frontend assets advanced to 20260902.1. The deployment mirror passes all 96 tests. The canonical source also passes these 96 relevant checks; its separate pre-existing Shortcut packaging assertion remains unavailable because `shortcuts/旅伴匯入.shortcut` is absent, so that unfinished Shortcut UI/test change was intentionally excluded from publication. A 393×852 smoke pass verified all three new flows without Shopping horizontal overflow.

## 2026-08-27

- Added a standards-based PWA Web Share Target for links. The manifest sends GET `title`, `text`, and `url` fields to a no-cache `/share-target` route; the receiver bounds and validates shared content, rejects deceptive lookalike hosts, preserves a valid payload through login/trip loading, strips it from browser history, and opens the existing import sheet with automatic recognition and the same explicit Google-candidate confirmation used by pasted links. Agoda, Booking.com, Airbnb, Instagram, Threads, and existing Google Maps links are covered, while the manual paste and screenshot fallbacks remain intact. Frontend assets advanced to 20260827.1; `node --check app.js` and all 95 tests pass.
- Recorded the current platform boundary: WebKit bug 194593 is still open, so iPhone home-screen web apps do not register manifest Web Share Targets. The new receiver is ready for compatible platforms and future Safari support, but direct iPhone Share Sheet delivery still needs an iOS Shortcut or native Share Extension and has not been reported as an iPhone validation pass.

## 2026-08-25

- Added a 44px `食べログ查看` action directly below the phone number in Japanese restaurant detail sheets. It opens Tabelog's restaurant search with the Google place's full restaurant name and local area, appears only for restaurant records that resolve to Japan, and keeps non-Japanese restaurants and other place types unchanged.
- Place-detail enrichment now retains Google's formatted address so Japan detection remains reliable after a place is refreshed. Frontend asset version advanced to 20260825.1; syntax checks pass and all 93 tests pass.
- Moved the restaurant action out of the phone card into its own full-width `Tablelog預約` card. New Japanese restaurant imports now generate and persist a validated `tabelogUrl` when the place is confirmed rather than constructing it when details open; older restaurant records are safely backfilled in memory. On phones the HTTPS link navigates in the current context so Tabelog's verified Universal Link can hand off to its installed app, while an uninstalled app naturally leaves the user on Tabelog's website. Desktop keeps the travel App open and uses a guarded new tab.
- Frontend asset version advanced to 20260825.2. Syntax checks pass and all 94 tests pass.
- Replaced the ordinary Tabelog webpage navigation with Tabelog's official OneLink and `tabelog-v2` restaurant deep link. The five existing Tokyo restaurant records now backfill to their exact Tabelog restaurant IDs instead of English-name search pages; newly imported Japanese restaurants still persist a validated fallback link at confirmation time. If the App is installed, the direct anchor hands off to it; otherwise OneLink falls back to the same restaurant/search webpage.
- Moved `Tabelog預約` into the unused lower area of the phone card, made it the same inner width as the phone column, and applied the App's orange accent with a 44px touch target. Frontend asset version advanced to 20260825.3; syntax checks pass and all 94 tests pass.
- Hotfixed the blank-screen startup regression introduced in 20260825.3: the exact Tabelog restaurant lookup is now initialized before the startup place backfill uses it. Added an explicit initialization-order regression assertion, advanced frontend assets to 20260825.4, and reran all 94 tests.
- Separated the fixed 44px `Tabelog預約` action from the phone card while retaining the exact same right-column width. Its orange background now explicitly uses white label/arrow colors. Replaced AppsFlyer OneLink, which could incorrectly route an installed App to an unavailable regional App Store, with the direct `tabelog-v2` restaurant scheme and a visibility-aware 1.4-second website fallback. Frontend assets advanced to 20260825.5; all 94 tests pass.
- Corrected the direct scheme for the separately distributed Tabelog multilingual App. Tabelog's own iPhone restaurant HTML identifies `tabelog-tourists://rstdtl/{id}/top/` for a restaurant and `tabelog-tourists://rstlst/` for results; the domestic-only `tabelog-v2` URL was invalid on the installed multilingual App. Web fallbacks now use the equivalent `/tw/` page. Frontend assets advanced to 20260825.6; all 94 tests pass.
- Replaced the invalid standalone `tabelog-tourists://` navigation with the complete HTTPS Universal Link used by Tabelog's own multilingual restaurant pages: `tabelog-tourists.onelink.me/3eEh`. Exact restaurant/search deep links now remain inside the official OneLink parameters, and iOS, Android, and web fallbacks all target the corresponding Traditional Chinese page instead of a regional App Store. Removed the custom timer and direct-scheme click interception. Frontend assets advanced to 20260825.7; syntax checks pass and all 94 tests pass.

## 2026-08-22

- Added an App-level fullscreen map workspace. The normal Places map now has a fullscreen action; fullscreen hides the phone frame and bottom navigation, gives the interactive map the whole viewport, and adds a collapsible left rail containing planning/day mode, date, place type, preference, live-location status, type counts, and the currently matching place list. Selecting a place in the rail pans and zooms the live Google or Leaflet map; on narrow screens the rail becomes an overlay drawer and closes after selection. Escape exits fullscreen on desktop.
- Added 購物 as a complete shared place type, distinct from the private Shopping checklist. Apparel, footwear, department stores, malls, boutiques, drugstores, and similar Google/social-import categories can be auto-classified or explicitly selected as Shopping, then filtered in Places, fullscreen map, and itinerary place selection.
- Made the normal 規劃地圖 heading use the same page-title hierarchy as 收藏地點, while retaining compact controls below it. Reduced map marker boxes from 42px to 34px, tightened their badges/borders, and updated Google and Leaflet anchors so route lines still terminate correctly.
- Responsive checks at 1280×800 and 393×852 caught and fixed an overlap between the fullscreen action cluster and the map gesture hint; the hint now sits below the actions. The desktop rail, mobile overlay drawer, closed full-map view, and compact markers have no horizontal overflow or console errors.
- Frontend asset version advanced to 20260822.1. Syntax checks pass and all 92 tests pass.

## 2026-08-21

- Corrected the Google Maps device handoff after an audit found that `window.open(url, "_blank", "noopener")` can return `null` even when the desktop tab opened successfully, causing the App tab to navigate away as well. Desktop now opens a same-origin blank tab, removes its opener, and replaces that tab's location; only a genuinely blocked popup or failed navigation falls back to the App tab. Phones and tablets still navigate in place for native Maps handoff. Place details, airport nodes, route buttons, and transport markers all use this single path. Unit coverage models successful, blocked, and failed desktop navigation separately and prevents those route entry points from bypassing it.
- Replaced the abstract `◇ ● □ ▱` bottom-navigation glyphs with one consistent Tabler icon family: compass for 總覽, map pin for 地點, calendar event for 行程, and shopping bag for 購物. The selected icon receives the existing brand-red surface, every tab keeps a visible text label and at least a 54px-tall touch target, `aria-current="page"` follows navigation state, focus and reduced-motion states are covered, and the vendored MIT license is retained without adding a CDN or build dependency. Verified at 375×812 with no horizontal overflow, one selected tab at a time, and no browser console warnings.
- Shipped real PWA icons (192/512 `any`, 512 `maskable`, 180 `apple-touch-icon`), generated procedurally as a cream map pin on the clay theme colour, so iPhone "add to home screen" no longer falls back to a page screenshot.
- Vendored Leaflet 1.9.4 (js, css, marker/layer images) under `vendor/leaflet/` and removed the unpkg CDN dependency, so the map fallback no longer fails when a third-party CDN is unreachable. `vendor/` is served immutable for a year; `icons/` for a week.
- Added an import-sheet hint explaining that booking sites block automatic reading and that lodging links should be pasted together with the host message or booking confirmation. Deliberately did NOT minify assets: Vercel already serves app.js as 85.6 KB brotli from 334 KB, so a new build pipeline was not justified.
- Restored correct Booking lodging placement after Booking.com began answering server-side page fetches with an HTTP 202 anti-bot challenge that strips all public metadata (title, Open Graph, structured address). House-number matching now survives Google's romanized Japanese addresses (`1-chōme-16-19 Ōkubo`: macron stripped, hyphen allowed before 丁目/chome), labelled multi-line host messages keep their address line intact instead of leaking into the next numbered field, and an explicit `公寓名稱/飯店名稱：…` line pasted with the link becomes the lodging name (e.g. `自由之家`) for AI recognition and the coordinate candidate. Blocked lodging pages also send the URL slug (a pinyin/romaji transliteration of the page title) plus a `publicPageUnavailable` flag to the AI with instructions to decode place names in it and web-search the exact page rather than a similar property. All 87 tests pass.
- Fixed the reported Liberty Stay import end to end. Explicit apartment name, complete address, Google Maps link, and Booking link pasted together now merge into one lodging candidate; `Liberty Stay` is retained from the descriptor-heavy Booking title and a reliable short Chinese name may be shown alongside it. Address lookups reject missing and `0,0` coordinates and use a bounded OpenStreetMap fallback when Google returns no usable location. Google Maps URLs prefer the actual `!3d…!4d…` place pin over the camera center, standalone context lines no longer become meaningless candidates, and the candidate-preview close control can no longer shrink into an oval. All 83 tests pass.
- Fixed a follow-up case where Booking blocked its public title and a long AI-returned room description such as `70 平方…` reached the candidate list. The importer now extracts `Liberty Stay` from the complete AI title before any display-length truncation, removes descriptor-heavy translated copy, and searches with the short property name plus exact address. All 85 tests pass.
- Added a durable handoff documentation set covering architecture, protected flows, permissions, environment variables, AI automation boundaries, existing/proposed test coverage, known gaps, and a Fable-specific project summary. No secret values are included.

## 2026-08-20

- Added a safe navigation fallback for Booking.com, Agoda, and Airbnb apartments that have no independent Google Maps business page. The importer preserves a web-verified full address, runs an exact address-only Places lookup, and presents the result as a clearly labeled `住宿座標` candidate with coordinates and the original booking reference. It never substitutes a nearby similar property automatically, and saving still requires explicit address review and confirmation. All 76 tests pass.
- Corrected the reported Booking apartment match by treating source-page Japanese postal codes and full house numbers as authoritative. The importer now recognizes an unlabeled address such as `〒169-0072 … 1-16-19`, lets it override an AI guess such as `1-16-20`, excludes nearby mismatched lodging, and ranks the exact address coordinate first. All 77 tests pass.
- Fixed coordinate-only Google Maps imports that displayed URL-encoded degrees as a meaningless place name. Decimal and degree-minute-second coordinates are now decoded and reverse-geocoded into a readable address label; when Google address geocoding is unavailable, a bounded user-triggered OpenStreetMap reverse lookup supplies the address with visible attribution. Such records are explicitly marked as address coordinates rather than accommodation names. Both booking candidates and raw coordinate candidates can now open an embedded map with their full address before import. All 79 tests pass.
- Fixed Booking apartments that were understood by AI but still failed with `Google Maps 找不到足夠吻合的地點`. The importer now reads the public page's structured `formattedAddress` directly and preserves it as the authoritative address hint even when Open Graph metadata or AI output omits the address, allowing an address-coordinate lodging candidate when no independent Google business listing exists. All 81 tests pass.

## 2026-08-19

- Fixed two place-detail link bugs. Original-source actions now require an allowlisted Instagram, Threads, Agoda, Booking.com, or Airbnb URL and derive their label from the actual host, so direct Google Maps imports cannot display a false Threads reference. Google Maps actions now navigate in the current browser context instead of opening `_blank`, preventing iPhone app handoff from leaving an empty Safari window. Invalid map URLs show an inline toast. All 75 tests pass.

## 2026-08-17

- Added confirmed lodging imports from Agoda, Booking.com, Airbnb, and `abnb.me` links. The importer safely allowlists those hosts, automatically requests lodging recognition, uses web lookup when booking-page metadata is incomplete, presents Google Maps candidates for explicit confirmation, and retains the original booking link in place details. The universal link-field copy and source-reference labels now cover booking platforms as well as social posts. All 74 tests pass.

## 2026-08-15

- Removed forced selection from ambiguous social-place imports. Every recognized group now supports an editable independent Google Maps re-search that excludes candidates already shown across rounds, plus an explicit skip/cancel state that leaves all other pending places intact. The targeted re-search does not spend another whole-post AI call. All 73 tests pass.
- Added source comparison for ambiguous social-place matches. Each recognized group can open its original caption, AI evidence, and the specific supporting carousel images identified during the same AI request; images open full-size and the original post is one tap away. Comparison media remains pending-only and is not saved into shared places. All 71 tests pass.
- Clarified social place-import counts: Google Maps alternatives are now visibly grouped under each recognized place, the sheet separately reports place and candidate counts, and a fully selected result says `加入全部 N 個地點`. This prevents a 12-place post with 16 candidate rows from looking like four places were omitted. All 70 tests pass.
- Extended Instagram/Threads place recognition from a single Open Graph cover to the complete publicly exposed main-post carousel. The importer now reads bounded full-page HTML, excludes avatars, deduplicates and validates up to twenty Meta CDN images, fetches them with bounded concurrency and a total byte budget, and sends them together in one visual-recognition request. The reported Threads post was verified to expose 19 main-post images including the `銀座ブラジル（浅草支店）` attachment. All 69 tests pass.

## 2026-08-13

- Moved the active workspace to `旅遊APP`, verified canonical/deployment file parity, GitHub and Vercel bindings, and globally installed custom skills, and added a root workflow file that prevents future edits from targeting the older `AI家教` copies.
- Raised one-post social place recognition and import from five to twenty distinct locations, increased structured-output capacity, bounded Google candidate lookup concurrency to five, and preserved partial successful candidate groups when an individual lookup fails. All 67 tests pass.

## 2026-08-12

- Added tappable large previews for all three Shopping product-image candidates, with previous/next switching, explicit selection, backdrop/close/Escape dismissal, and preserved import edits. Improved intermittent empty image rounds with one primary search followed only when needed by two concurrent official/multilingual backup searches; all 66 tests pass.
- Raised Shopping screenshot imports from eight to twelve. The native iOS picker limitation is now stated accurately, over-twelve selections are rejected after returning to the App, AI recognition remains concurrent, and every product card shows an accessible queued/preparing/recognizing/complete/failed progress indicator. All 64 tests pass.
- Fixed Shopping candidate selection persistence on iPhone by switching selected-image export to bounded JPEG, increasing the private product-image total, and reconciling new items with the server save response. Up to eight screenshots now recognize concurrently, each completed card unlocks `換一批圖片` independently, and over-eight selections are rejected with a clear message. All 64 tests pass.
- Removed the slow and unreliable GPT Image generation path from Shopping. Recognition now extracts up to three product-image candidates from matching public product pages, the import review lets the user choose one, and `換一批圖片` retrieves a different round while excluding seen candidate IDs. Only the selected image is compressed and stored; all 64 tests pass.
- Fixed successful product recognition that silently returned no image: generic required tool choice had only forced web search, not image generation. Each upload now runs a dedicated GPT Image Edit request in parallel with Responses recognition, uses the screenshot as the sole reference, and returns safe image-specific permission, quota, input, or service diagnostics while preserving recognized text. All 64 tests pass.
- Recorded standing authorization to publish completed, validated project changes directly through GitHub `main` to Vercel production and to return the live App link after each release.
- Replaced third-party product-photo scraping and hotlinking with one screenshot-grounded GPT Image edit inside the existing recognition request. Each review now requests a centered front-facing product-only image on pure white, compresses it before private storage, drops legacy external image URLs, and offers legacy records a repair action using their original screenshot.
- Removed URLs, domains, Markdown links, and source citations from Shopping annotations at both response and persistence boundaries. Extended Vercel function duration for the combined vision, web-verification, and image-generation request; all 63 tests pass.
- Combined each new Shopping screenshot's multilingual visual recognition, web-grounded product research, structured annotation, and single front-facing product-image discovery into one OpenAI Responses request. Import review saves that result directly, while legacy/manual items retain an explicit optional backfill action.
- Simplified Shopping import and detail layouts: one larger AI-found product image appears first, editable recognized fields and readable features/usage/cautions follow, source links, stars, and numeric indexes are removed, and the original uploaded screenshot is last in a collapsed disclosure.
- Added removable custom categories and recipient tags, moved custom-category creation into the category dropdown, and added recipient filters with bought/unbought counts. Corrected Overview's percentage to measure actual flight/lodging/itinerary/transport planning coverage rather than departure proximity. All 63 tests pass.

## 2026-08-11

- Added an editor-only delete button at the bottom of place details opened from either maps or lists. Labels adapt to attractions, restaurants, and lodging; confirmation remains mandatory, cancel returns to the same details, guests remain read-only, and the existing one-level undo remains available. All 58 tests pass.
- Expanded candidate preview activation from the candidate name to the full card while preserving the left radio as a quick-select control. Added versioned frontend assets, Vercel revalidation headers, and foreground deployment checks so iPhone tabs no longer keep obsolete candidate handlers after new releases. All 57 tests pass.
- Added a pre-import candidate detail preview for social-place recognition. Candidate names and view hints now open a nested iPhone sheet with Google photos, full address, category, rating count, hours, phone, and Google Maps access; users can select the candidate there and return to the unchanged import form for final confirmation.
- Added address-aware social lodging imports for Reels whose creators hide the formal property name in a profile or pinned link. Explicit caption addresses and lodging clues now survive even when no name is identified, the special case may use a conditional OpenAI web-search cross-check, and Google Places returns up to five lodging-prioritized candidates for explicit user selection.
- Passed the selected place category from the iPhone import sheet to the recognition endpoint and added regression coverage for address extraction, hidden profile-name detection, AI-empty address fallback, conditional web search, and expanded lodging candidate lookup. All 56 tests pass.

## 2026-08-10

- Compacted the add-place link field to 56px, removed redundant category/link/screenshot instructions, shortened action labels, and made recognition candidates an explicit touch-scroll region while keeping confirmation actions fixed. Verified an eight-candidate fixture at 393×852: the 316px result region scrolled independently and the action row remained visible.
- Fixed Instagram Reels and screenshot imports that reached AI successfully but failed at Google Places with `GOOGLE_PLACES_400`; the previous 100 km trip-center bias exceeded the API limit. Candidate lookup now skips trip bias when AI identifies a location, caps ambiguous bias at 50 km, and retries once without bias if Google rejects it.
- Simplified the place-import sheet to two visible inputs: a universal Google Maps/Instagram/Reels/Threads link field and a screenshot/photo picker. Removed supplemental pasted text and its disclosure so recognition and confirmation controls remain reachable on iPhone.
- Added standalone screenshot, Reels URL, 50 km bias, and retry regression coverage. All 53 tests and the 393×852 layout check pass.
- Added confirmed Instagram/Threads place import: safe public metadata retrieval, optional screenshot fallback, multilingual OpenAI vision extraction, Google Places candidate matching, radio selection, duplicate protection, and original-post references in place details.
- Added member authorization, a daily social-recognition limit, SSRF-safe social-host redirects, strict structured output, and tests covering candidate confirmation and blocked posts.
- Verified the completed import sheet at iPhone 15 Pro dimensions with no page overflow, no focus zoom, fixed actions, and an independently scrollable result list; successful recognition automatically collapses the fallback panel.
- Revoked the previously exposed OpenAI key and configured its replacement only as Vercel's sensitive `OPENAI_API_KEY` for Production and Preview; the replacement was never stored in source, project memory, or tool output.

## 2026-08-09

- Replaced Vercel AI Gateway with direct server-side OpenAI Responses API recognition using `gpt-5.6-luna`, original image detail, strict structured output, `store: false`, server-only `OPENAI_API_KEY`, and OpenAI-specific status messages; all 46 tests pass and production now only awaits the new key and redeployment.
- Fixed production Shopping AI requests to prefer the fresh per-invocation Vercel OIDC credential over stale configured keys, changed output limits to the Gateway-compatible `max_tokens` parameter, added strict-schema to JSON compatibility fallbacks, and exposed safe status-specific diagnostics instead of a generic 502-only failure.
- Fixed production Shopping AI authentication by reading Vercel's runtime OIDC request header instead of relying only on build-time environment variables, and added a credential-safe readiness check.
- Replaced Shopping's local OCR and keyword guessing with authenticated server-side multilingual vision AI through Vercel AI Gateway.
- Added strict one-product extraction with original-language and Traditional Chinese brand/product names, image-grounded benefits, category, language, confidence, per-member authorization, and a daily request limit.
- Added clear per-image AI status/error messages while preserving editable review and explicit confirmation before private storage.
- Upgraded Shopping screenshot recognition to extract editable brand, product name, benefits/recommendation points, and category fields; health supplements such as chondroitin are classified as medicine.
- Added multi-image Shopping import for up to eight screenshots in one confirmation flow, with one independently editable product card and source image per screenshot.
- Moved selection, select-all, and batch-delete controls into one toolbar directly above the shopping list.
- Extended private shopping records with brand and benefits fields and raised the maximum retained reference-photo count to 16 within the existing total payload ceiling.
- Changed Shopping screenshot recognition to create one most-likely main product and reject benefits, ingredients, usage instructions, and other descriptive copy as separate items.
- Added confirmed left-swipe deletion plus selection, select-all, and confirmed batch deletion to Shopping.
- Increased private reference-photo resolution, changed detail images to preserve the full screenshot, and retained up to eight clear photos within the existing storage ceiling.
- Added a fourth Shopping tab with private per-member, per-trip server storage that is excluded from shared trip data.
- Added default/custom shopping categories, reusable recipient tags, notes, purchased checkmarks, photo details, editing, confirmed deletion, filtering, progress, and one-level private undo.
- Added screenshot compression and local Traditional Chinese/English/Japanese OCR with editable multi-item review before confirmation.
- Added server authorization and isolation tests proving travel companions cannot read one another's shopping lists, plus cleanup when a member leaves a trip.

## 2026-08-07

- Audited documented settings against source code, automated tests, deployment mirror, and public Vercel assets; no feature drift was found.

## 2026-08-05

- Compacted Overview flight rows, moved outbound/return labels to a dedicated far-left column, and enlarged/vertically centered passenger notes.
- Rebalanced flight city/airport form columns to favor the airport selector and shortened the city placeholder so full airport names fit on iPhone.
- Restored the complete flight list and add-flight entry point to Overview, and allowed full trip titles and dates to wrap instead of truncating.
- Removed the duplicate top-right add-place button; the Places list now uses only its persistent bottom action.
- Removed the default button border from place icons, centered recommendation controls, and fully concealed swipe-delete layers until a left swipe begins.
- Centered the planning-map live-location glyph, anchored day-map pins directly to route endpoints, and removed the redundant transport legend while retaining route transport icons.
- Expanded one-level undo controls to every main page and automatically added them to editable sheets.
- Rebuilt Overview as a trip decision dashboard with readiness, planning metrics, and prioritized next actions while preserving the existing editorial style.
- Added mode-adaptive transport entry. Walking now pre-fills a coordinate-based estimate, simple transport cards show only mode and duration, and scheduled ticket fields expand only on request.
- Added one-level undo for reversible trip edits, exposed in success toasts and Overview.
- Fixed the sticky add-place action so list rows no longer show through it while scrolling.
- Raised place-note input text to 16px to prevent iPhone Safari focus zoom.
- Added an optional planning-map live-location switch with a blue position marker and accuracy radius for Google Maps and Leaflet.
- Kept live location device-only and stopped geolocation tracking when disabled, leaving the planning map, or closing the page.
- Moved the live-location switch into the planning-map legend row so it no longer covers Google Maps controls.

## 2026-08-04

- Replaced top-aligned iPhone date/time text with centered app-rendered values while retaining native pickers.
- Made flight city and airport columns equal width.
- Added private, browser-side flight ticket image OCR with automatic form prefilling and explicit save confirmation.
- Widened and centered itinerary time pills without changing their type size.
- Fixed iPhone flight date/time overlap with bounded, centered fields.
- Added city-aware airport selection.
- Replaced the flight type "Other" with "Round trip" for new flights; round trips create outbound and return legs.
- Removed the named Google Maps list example from the add-place placeholder.
- Restored reliable single-place imports while retaining public shared-list expansion.
- Added manual transport segments, scheduled ticket details, validation, and route links.

## 2026-08-03

- Added multi-trip membership, invitations, sharing, leaving, and member removal.
- Added shared Redis persistence and four-digit PIN identities.
- Added Google Maps interactive planning/day maps, airport markers, route ordering, and flight paths.
- Added place categories, Google Maps enrichment, notes, photos, hours, phone, and voting attribution.
- Added itinerary time confirmation, chronological sorting, touch reordering, and swipe deletion.

## 2026-09-08

- Fixed non-lodging manual import routing and retained empty recognized groups for keyword Google Places search/manual fallback. Assets 20260908.2; API functions remain 12. See project_state.md for tests and acceptance steps. Shopping unchanged.


## Places area and restaurant filters — 2026-09-08

- Built from origin/main fab6a1acbf10ab2d156775de4985c5706529e315 in isolated canonical-source worktree travel-app/prototype/places-filters. Existing dirty workspaces are preserved.
- Places list has compact horizontally scrolling area chips, dynamically derived from this trip's stored travelAreaKey/travelAreaZh. Filtering compares keys only; no resolver/API request or Travel Area rule change. Missing/unclassified areas remain visible under All.
- Restaurant-only cuisine chips use the trip's actual restaurantTags. Area and cuisine combine with kind using AND; invalid selections reset to All. Cuisine selection applies across top-level kinds; see UX follow-up. Filter state is device UI only and resets when trip view clears.
- Optional restaurantTags: string[] supports multiple values and 13 default editor choices plus retained custom values. Existing missing fields need no migration. Explicit arrays, including manual clearing to [], are preserved. Old restaurant detail refresh never adds tags; new imports with exact known Google response categories can conservatively supply tags; names and AI classification are never used. Existing sharedTripPayload/cleanTrip/JSON reload preserve fields without server changes.
- Validation: targeted 143/143; full regression once 337/337; app.js and all 12 API modules pass syntax; git diff --check passes. Local Edge headless 393x852 has zero horizontal document overflow, two 48px scrolling filter rows, 341px editor, 18px checkboxes and working multi-selection. API functions remain 12; assets 20260908.3.
- Scope excluded: Aidaya/existing-candidate exclusion, Shopping/Threads changes, lodging matching/source, P0 identity, Travel Area resolver, and candidate-editor refactoring. Production App was not opened; user owns acceptance.
- Acceptance: choose restaurant, edit a place and select multiple cuisine tags, save/reload/reopen editor; choose area + cuisine and verify intersection, switch All to include untagged/unclassified places, clear the only occurrence of a selected tag to confirm filter resets. Swipe the filter rows on iPhone.


## Places filter UX follow-up — 2026-09-08

- Baseline origin/main e7f1ad5; isolated canonical worktree travel-app/prototype/places-filter-ux; deployment mirror places-filters-deploy.
- Area/cuisine chips have bounded flex width, nowrap, native touch panning, momentum scrolling, hidden scrollbars and contained horizontal overscroll. Selection retains row scroll offset.
- List and both map layouts share placeAreaFilter (stored Travel Area key). Map chips change the same selection; map results and fitBounds reflect matching located places. No located results preserve the previous center/zoom, scoped to the trip. Area changes clear the selected map-place preview, and live-location centering does not override a selected area.
- Existing resolver catalog contains area key/names/aliases and Google integration supplies point coordinates/address components. No trustworthy area polygon exists. No inferred boundary drawn; area boundary needs an additional geometry source.
- Fullscreen action moved from the normal map title into an operation row beside Show location; fullscreen behavior retained. Both controls have 44px height.
- Cuisine row appears whenever any restaurant in the trip has tags, including top-level All. Choosing a tag sets top-level All and matches only tagged restaurants, AND area. Untagged restaurants match cuisine All. Old-restaurant detail enrichment no longer populates tags; schema/editor/persistence and new-import category mapping unchanged.
- Validation: targeted 107/107; full regression once 340/340; app.js and 12 API modules syntax pass; git diff --check pass; API functions 12. Full shipped local DOM/Leaflet at 393x852: native touch moved chips 225px, last chip fully reachable, cuisine row scrolls, List-to-Map area count 2, empty viewport preserved, controls same y=345, fullscreen selection retained, no document overflow or page errors. No production App opened. Assets 20260908.4.


## Fullscreen, inferred cuisine and sourced area boundaries — 2026-09-09

- Baseline 1af5839, isolated canonical source travel-app/prototype/area-geometry; validated deployment mirror places-filters-deploy.
- Fullscreen uses a compact dynamic area select keyed by travelAreaKey. A single always-visible 44x64 left-center arrow toggles the sliding drawer, updates aria-expanded/inert and preserves the live map instance. No X or filter-icon opener remains; exit fullscreen is independent. Normal list/map chips remain unchanged. Area and cuisine selection persist across list/map/fullscreen; map now honors selected cuisine too.
- Restaurants without an explicit restaurantTags array derive tags at runtime from clear category/source/tags/description/name cuisine terms (Chinese/Japanese/English). Unknown evidence stays empty; no AI/API calls or persistence backfill. Existing arrays including [] always override inference. Editor displays inferred checks and saves restaurantTagsSource=manual alongside selected values, including explicit clearing; old payloads stay compatible with no migration.
- Trustworthy geometry now ships as a same-origin static OSM/ODbL snapshot for 12 Tokyo area mappings: Ginza; Ebisu/Daikanyama; Shibuya; Asakusa; Shinjuku; Otsuka; Ikebukuro; Toyosu; Marunouchi/Otemachi; Tsukiji; Azabujuban; Ueno. Exact source relation IDs, names, tags, timestamp, URLs, license and raw snapshot hash are preserved in data/area-geometry; reproducible offline builder joins only original way endpoints. Ebisu/Daikanyama keeps three separate Ebisu, Ebisu-Nishi and Daikanyamacho polygons. Other compound areas likewise keep separate authentic components. These OSM town boundaries are not an invented official perimeter for an informal travel area.
- Google renders non-clickable dashed closed paths; Leaflet uses unfilled dashed GeoJSON in a pointer-transparent noninteractive pane. Visible OSM/ODbL attribution accompanies boundaries. Geometry loads asynchronously from one cached local asset promise; markers/filter/fitBounds do not wait. Missing geometry draws nothing; All clears layers. Map/trip/selection tokens prevent late responses from painting stale regions. No production Overpass/Nominatim requests or extra function; missing-area viewport behavior retained.
- Validation: targeted 141/141; full regression once 348/348; app.js and all 12 API modules syntax pass; git diff --check pass; API functions 12. Local full-DOM/Leaflet touch fixture at 393x852 passes dropdown, arrow open/close retaining map, three composite polygons, absent/All boundary removal, noninteractive pane, List/Map/fullscreen area+cuisine sync, inferred editor checks, zero page errors/overflow. Production App not opened. Assets 20260909.1.
- Deferred/protected: Aidaya keyword exclusion, Travel Area resolver identity, Google identity, social/lodging/Shopping routing and import selection modes unchanged.


## Production UX corrections — 2026-09-09

- Baseline fac25f6; isolated canonical worktree travel-app/prototype/places-production-ux. Validated files copied to clean places-filters-deploy mirror.
- Fullscreen drawer handle now sits at the panel right edge while open, moves to viewport left while closed, and follows the slide transition. Visible tab 22px wide inside a 44x64px touch target; panel padding restored. Independent fullscreen exit and map gestures retained.
- Both Google and Leaflet boundary stroke reuse computed --accent (#c8452d), still dashed, unfilled and noninteractive. OSM geometry/source files are unchanged.
- Filter/editor heading is 類別. Available tags derive only from restaurants in the selected travelAreaKey; All area includes the whole trip. Area changes reset a category absent from the new area, then apply area/category/kind AND filters.
- Restaurant details have a visible 編輯類別 entry above the gallery, opening the existing general editor. 13 defaults/custom values remain multi-select. Existing restaurants can 儲存類別 independently; tag-only primary Save uses the same path when all other form values match their opening snapshot. This changes only restaurantTags and restaurantTagsSource, preserves explicit [] and all identity/address/photos, and needs no geocode. Other edits retain the existing form path.
- placeMapsUrl retains exact Place ID first and trustworthy CID/place-page URLs before coordinate-only fallback for ordinary POIs; navigation paths/parameters are excluded from place-page output. Custom/address identities retain their coordinate behavior. Google gallery photos link to the place page while img src remains the unchanged identitySafePhotos-guarded /api/place-photo resource. Link clicks prevent default duplicate navigation. Explicit navigation action still uses placeNavigationUrl (coordinates then address); null/empty coordinate values are no longer coerced to zero. No name re-search or Google identity/photo-source rewrite.
- Validation: targeted 132/132; full regression once 352/352; app.js/all 12 API modules syntax pass; git diff --check pass; API 12. Local 393x852 full-DOM/Leaflet: open handle x=300 matches panel right=300, visual width22/touch44, collapse left correct, stroke #c8452d, regional tags/reset, visible editor entry, multi-select/save/JSON reload/explicit clear, original identity/address/photos preserved, exact place-page photo link; no page errors/overflow. Production App not opened. Asset version 20260909.2.

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
