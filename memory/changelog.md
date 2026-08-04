# Changelog

## 2026-08-05

- Added an optional planning-map live-location switch with a blue position marker and accuracy radius for Google Maps and Leaflet.
- Kept live location device-only and stopped geolocation tracking when disabled, leaving the planning map, or closing the page.

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
