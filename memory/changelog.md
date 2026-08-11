# Changelog

## 2026-08-12

- Corrected Shopping product photos to be AI-found rather than manually uploaded. The explicit research action now searches and cites matching official or trusted product pages, safely extracts up to four externally hosted product images, shows each page source, and lets the member choose a list thumbnail while preserving the original recommendation screenshot.
- Added an explicit AI product-research action to Shopping details. It uses the existing server-side OpenAI key with Responses API web search, complete source metadata, and strict structured output to return a Traditional Chinese summary, product features, general usage, cautions, source links, and a qualified 1-5 shopping-reference index. Opening details never spends API credit automatically, health-related results carry a non-medical disclaimer, and all 62 tests pass.

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
