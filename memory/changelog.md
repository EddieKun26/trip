# Changelog

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
