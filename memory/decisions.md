# Decisions

## Identity and sharing

- Identity is nickname plus four-digit PIN, not email/OAuth.
- PIN verification uses server-side hashing and an HttpOnly secure session cookie.
- Trips are private to members; invite codes explicitly grant access.
- Guests may read a shared trip but cannot add, vote, reorder, edit, or delete.

## Data

- Each trip owns flights, places, votes, itinerary, transports, and members.
- Flights remain one persisted record per leg. "Round trip" is a creation mode that saves one outbound and one return record so itinerary and map behavior remain compatible.
- Itinerary items have stable IDs. Transport segments connect two adjacent item IDs and are flagged for review when reordering breaks adjacency.
- Place categories use the shared top-level groups attraction, restaurant, and lodging.

## Maps and external data

- Google Maps JavaScript API is the preferred interactive map; Leaflet/OpenStreetMap remains a fallback.
- Places imports support ordinary place links and public shared-list expansion before Places enrichment.
- Airport selection uses a local city-to-airport catalog to avoid manual airport-code entry and extra API cost.

## Mobile UI

- iPhone native form controls must have bounded grid tracks and at least 16px input text to avoid overlap and focus zoom.
- Itinerary time pills keep their established type size; width and centering are adjusted instead.
- Flight date/time controls remain side by side, with more room assigned to the date.
- Native date/time inputs remain the interactive picker, but their browser-rendered text is visually replaced by an app-rendered centered label for consistent iPhone alignment.
- Flight ticket OCR runs locally in the browser with a lazily loaded Tesseract.js worker. Images are not persisted or added to shared trip data; recognized fields always require user confirmation before saving.
