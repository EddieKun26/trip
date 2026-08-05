# Changelog

## 2026-08-05

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
