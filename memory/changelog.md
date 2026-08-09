# Changelog

## 2026-08-09

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
