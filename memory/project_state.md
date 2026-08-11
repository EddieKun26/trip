# Project state

## Implemented

- Public responsive web app optimized for iPhone 15 Pro.
- Overview is a decision dashboard with complete trip title/date text, trip status, readiness, planning metrics, prioritized next actions, and a full editable flight list with an add-flight entry point.
- Four-digit PIN identities persist across devices; guest mode is read-only.
- Multiple private trips per member, invite-code joining, trip switching, member removal, leaving a trip, and native share links.
- Shared Redis-backed trip data with revision-aware updates.
- Places are separated into attractions, restaurants, and lodging. Lists are grouped by Chinese area name with local name retained.
- Google Maps single-place links, multiple links, and public shared lists can be imported and enriched with name, area, category, hours, phone, photos, and coordinates.
- Instagram posts, Reels, Threads links, and standalone screenshots can be imported through an authenticated AI-assisted review flow. Public post metadata or an optional screenshot is used only to infer place mentions; when a creator hides a lodging name in a profile link but states an address, the address and lodging clues remain searchable and may receive a conditional web cross-check. Before saving, tapping anywhere on a Google Places candidate card except its selection radio opens a nested preview with photos, full address, rating, hours, phone, and a Google Maps link; the user then selects a match and confirms the final import, while the original post link is retained on the place.
- Frontend HTML and static assets explicitly revalidate on Vercel. Versioned asset URLs remove stale browser cache entries, and long-lived tabs check the current app asset when returning to the foreground and reload after a deployment change.
- Place details include photos, Google Maps link, votes, itinerary assignment, business hours, phone, editable notes, and an editor-only confirmed delete action that works whether the detail was opened from the list or map.
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
- Shopping items support brand, product name, benefits/recommendation notes, default and custom categories, reusable recipient tags, notes, purchased/unpurchased state, higher-resolution reference photos, detail/edit/delete flows, one-level private undo, confirmed left-swipe deletion, and batch selection/deletion from a toolbar directly above the list.
- Shopping item details preserve the original recommendation screenshot. An explicit AI research action finds matching official or trusted product pages, extracts up to four externally hosted product images with visible source links, and lets the member choose a list thumbnail without manually uploading product photos.
- Shopping item details include an on-demand AI product annotation with a web-grounded summary, product features, general usage, cautions, source links, and a qualified 1-5 shopping-reference score; results and the selected image URL are stored privately with the item, while opening a detail never triggers API usage automatically.
- Up to eight recommendation screenshots can be selected at once. Each image is compressed on-device and sent through an authenticated server endpoint directly to OpenAI Responses API (`gpt-5.6-luna`, original image detail, structured output), which understands the whole image and returns one editable product card with translated brand, official product name, explicit benefits, category, source language, and confidence. Nothing is saved until confirmation.

## Latest validation

- `node --check app.js` passes.
- `node --test tests/*.test.mjs`: 62 tests passing as of 2026-08-12 after replacing manual product-photo uploads with source-linked AI product-image discovery.
- iPhone 15 Pro browser verification at 393×852 confirms the compact place-import sheet uses a 56px link field, keeps 16px form text, gives multi-candidate results a 316px independently scrollable region, and keeps confirmation actions fixed and visible while that region scrolls.
- 2026-08-07 audit: the canonical source, deployment mirror, and public Vercel assets remain aligned; core documented features showed no implementation drift.
