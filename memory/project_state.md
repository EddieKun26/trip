# Project state

## Implemented

- Public responsive web app optimized for iPhone 15 Pro.
- Overview is a decision dashboard with complete trip title/date text, trip status, a planning-completion percentage derived from flights, lodging, itinerary-day coverage, and transport coverage, prioritized next actions, and a full editable flight list with an add-flight entry point. Days until departure remain a separate status fact and do not affect completion.
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
- Shopping items support brand, product name, benefits/recommendation notes, removable default/custom categories, reusable removable recipient tags, notes, purchased/unpurchased state, higher-resolution reference photos, detail/edit/delete flows, one-level private undo, confirmed left-swipe deletion, and batch selection/deletion from a toolbar directly above the list. Recipient filters show each person's bought and unbought counts and combine with the status filter.
- New screenshot imports use one browser request per image and run two OpenAI operations in parallel: Responses performs multilingual identification and web-grounded product verification, while the dedicated Image Edit API always attempts a high-fidelity edit from the uploaded screenshot. The result is one centered, front-facing, product-only image on pure white; the app no longer displays or stores website images and opening the item does not make another request.
- Import review shows the single larger generated product image first, editable brand/product/benefits/category fields and concise AI annotation next, and the member's original screenshot last in a collapsed disclosure. Detail views use larger readable text, strip URLs/domains/source citations, show no stars or recommendation index, and preserve the original screenshot at the end. Legacy items can retry generation from their private original screenshot.
- Up to eight recommendation screenshots can be selected at once. Each image is compressed on-device and returns one independently editable product card; the combined annotation and chosen image URL are saved only after explicit confirmation. Legacy or manually created items can still use an explicit backfill action.

## Latest validation

- `node --check app.js` passes.
- `node --test tests/*.test.mjs`: 64 tests passing as of 2026-08-12 after making the dedicated Image Edit call mandatory, preserving recognized text when image access fails, and surfacing safe permission/quota diagnostics.
- iPhone 15 Pro browser verification at 393×852 confirms the compact place-import sheet uses a 56px link field, keeps 16px form text, gives multi-candidate results a 316px independently scrollable region, and keeps confirmation actions fixed and visible while that region scrolls.
- 2026-08-07 audit: the canonical source, deployment mirror, and public Vercel assets remain aligned; core documented features showed no implementation drift.
