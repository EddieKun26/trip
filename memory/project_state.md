# Project state

## Implemented

- Public responsive web app optimized for iPhone 15 Pro.
- Four-digit PIN identities persist across devices; guest mode is read-only.
- Multiple private trips per member, invite-code joining, trip switching, member removal, leaving a trip, and native share links.
- Shared Redis-backed trip data with revision-aware updates.
- Places are separated into attractions, restaurants, and lodging. Lists are grouped by Chinese area name with local name retained.
- Google Maps single-place links, multiple links, and public shared lists can be imported and enriched with name, area, category, hours, phone, photos, and coordinates.
- Place details include photos, Google Maps link, votes, itinerary assignment, business hours, phone, and editable notes.
- Planning map and day map are independent. Day maps support per-day colors, ordering badges, route lines, airports, and red dashed flight segments.
- Daily itinerary supports time-wheel confirmation, chronological sorting, touch drag reordering, swipe deletion, add-place selection, and transport segments between adjacent items.
- Transport segments support regular and scheduled journeys, lines/stations, departure/arrival times, duration, fares, ticket status, travelers, booking links, and time-window validation.
- Flights support outbound and return records. New round trips create two compatible legs automatically.
- Flight airports are selected from city-aware options; common Taiwan, Japan, Korea, and regional airports are included.

## Latest validation

- `node --check app.js` passes.
- `node --test tests/*.test.mjs`: 27 tests passing as of 2026-08-04.
