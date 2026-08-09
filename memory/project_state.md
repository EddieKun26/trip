# Project state

## Implemented

- Public responsive web app optimized for iPhone 15 Pro.
- Overview is a decision dashboard with complete trip title/date text, trip status, readiness, planning metrics, prioritized next actions, and a full editable flight list with an add-flight entry point.
- Four-digit PIN identities persist across devices; guest mode is read-only.
- Multiple private trips per member, invite-code joining, trip switching, member removal, leaving a trip, and native share links.
- Shared Redis-backed trip data with revision-aware updates.
- Places are separated into attractions, restaurants, and lodging. Lists are grouped by Chinese area name with local name retained.
- Google Maps single-place links, multiple links, and public shared lists can be imported and enriched with name, area, category, hours, phone, photos, and coordinates.
- Place details include photos, Google Maps link, votes, itinerary assignment, business hours, phone, and editable notes.
- Planning map and day map are independent. The planning map has an optional device-only live-location layer with a centered control icon and accuracy radius; day maps support per-day colors, ordering badges anchored to route endpoints, route lines, airports, transport icons, and red dashed flight segments without a redundant transport legend.
- Daily itinerary supports time-wheel confirmation, chronological sorting, touch drag reordering, swipe deletion, add-place selection, and transport segments between adjacent items.
- Transport segments adapt fields to walking, subway, train, bus, taxi, driving, ferry, and other modes. Walking pre-fills a coordinate-based time estimate; fixed-schedule, fare, traveler, and booking fields stay collapsed until “指定票券” is enabled.
- One-level undo restores the latest reversible trip edit and is available from success toasts, every main page, and every editable sheet.
- Flights support outbound and return records. New round trips create two compatible legs automatically.
- Flight airports are selected from city-aware options; common Taiwan, Japan, Korea, and regional airports are included.
- Overview flight cards use a compact layout with the outbound/return marker fixed at the far left and a larger vertically centered passenger note.
- Flight forms allocate more horizontal space to airport selectors than city fields so full airport names remain readable on iPhone.
- Flight date/time values use centered app-rendered labels over native iPhone pickers, avoiding Safari's top-aligned text.
- Flight ticket images can be selected or photographed, recognized locally in the browser, and used to prefill the flight form before confirmation.
- A fourth Shopping tab stores a separate private list for each signed-in member and trip. Shopping data never enters the shared trip payload.
- Shopping items support default and custom categories, reusable recipient tags, notes, purchased/unpurchased state, higher-resolution reference photos, detail/edit/delete flows, one-level private undo, confirmed left-swipe deletion, and batch selection/deletion.
- Recommendation screenshots are compressed on-device, locally OCR-recognized in Traditional Chinese, English, and Japanese, reduced to one most-likely main product instead of treating benefits or ingredients as separate products, and saved only after confirmation.

## Latest validation

- `node --check app.js` passes.
- `node --test tests/*.test.mjs`: 40 tests passing as of 2026-08-09.
- 2026-08-07 audit: the canonical source, deployment mirror, and public Vercel assets remain aligned; core documented features showed no implementation drift.
