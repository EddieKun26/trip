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
- Undo is intentionally one level. It snapshots the last reversible trip-content edit, is shown consistently on all main pages and editable sheets, and does not attempt to reverse authentication, membership, or remote invitation actions.
- Shopping data is keyed by member ID plus trip ID and is authorized server-side against current trip membership. It is deliberately excluded from shared trip state, votes, invitations, and guest views.
- Shopping screenshots are compressed client-side and stored with private shopping records in Redis for this web prototype; each screenshot creates one independent product with editable brand, product name, benefits, and category fields. Up to 16 higher-resolution original screenshots may be retained, subject to the existing total payload ceiling. Leaving or being removed from a trip deletes that member's private shopping record for the trip.

## Maps and external data

- Google Maps JavaScript API is the preferred interactive map; Leaflet/OpenStreetMap remains a fallback.
- Places imports support ordinary place links and public shared-list expansion before Places enrichment.
- Social place import initially supports Instagram posts/Reels and Threads links. AI extracts possible place mentions from untrusted public post metadata or one screenshot; Google Places remains the source of truth for the saved name, address, category, rating, hours, phone, photos, and coordinates. A user must explicitly select a Google candidate and confirm before saving. The original social URL is retained as a reference, while social images are not copied into shared place data.
- The place-import sheet exposes only two content inputs: a compact universal link field and a directly visible screenshot/photo picker. Supplemental pasted text and redundant helper copy were removed. Recognition results own the remaining sheet height and scroll independently while confirmation actions stay fixed on iPhone.
- Social import is restricted to signed-in trip members, server-side credentials, safe allowlisted social hosts, and a per-member daily recognition limit. Login-gated or private posts fall back to a screenshot.
- If a social caption explicitly states an address while saying the formal lodging name is in a profile or pinned link, the import keeps an address-based lodging mention instead of discarding it. Only this address-plus-hidden-name case enables an OpenAI web-search cross-check; Google Places returns up to five lodging-prioritized candidates and the user still selects the final match.
- Social Google candidates are inspectable before import. Candidate details open as a nested sheet above the import form so the user's link, screenshot, scroll position, and candidate selection are preserved. Selecting inside the preview only marks that candidate; a separate final import confirmation remains required.
- The complete social candidate card opens its preview; only the radio control is reserved for quick selection. This avoids relying on a small name-only target on iPhone.
- Google Places candidate search never biases a location that AI already identified. Ambiguous mentions may use the trip center with Google's valid 50 km maximum radius, and a rejected biased request retries once without location bias.
- Airport selection uses a local city-to-airport catalog to avoid manual airport-code entry and extra API cost.
- Live location is opt-in and planning-map-only. It stays in browser memory, is never written to shared trip data, and stops when disabled, leaving the map, or closing the page.

## Delivery reliability

- Production HTML is not stored as a reusable browser response, while `app.js` and `styles.css` must revalidate. The document loads versioned asset URLs, and the running app checks the current script ETag/Last-Modified value when a long-lived tab returns to the foreground so a newer deployment can reload automatically.
- After an implementation is complete and its relevant checks pass, publish this project's validated deployment mirror directly to GitHub `main` so Vercel updates production. The user has granted standing project-specific authorization and does not want a separate deployment question each time; platform-enforced security confirmations may still appear.

## Mobile UI

- iPhone native form controls must have bounded grid tracks and at least 16px input text to avoid overlap and focus zoom.
- Itinerary time pills keep their established type size; width and centering are adjusted instead.
- Flight date/time controls remain side by side, with more room assigned to the date.
- Flight city/airport rows use an approximately 39/61 width split, prioritizing full airport names over the shorter city value.
- Overview flight cards keep the outbound/return marker in a dedicated far-left column; the center is reserved for route direction only, and the passenger note is a readable vertically centered row.
- Native date/time inputs remain the interactive picker, but their browser-rendered text is visually replaced by an app-rendered centered label for consistent iPhone alignment.
- Flight ticket OCR runs locally in the browser with a lazily loaded Tesseract.js worker. Images are not persisted or added to shared trip data; recognized fields always require user confirmation before saving.
- Shopping screenshot recognition uses server-side multilingual vision AI through the OpenAI Responses API rather than local OCR heuristics or Vercel AI Gateway. It uses `gpt-5.6-luna`, sends each compressed image with `detail: original`, requests strict structured output, preserves original-language brand/product names alongside Traditional Chinese meaning, extracts only image-stated benefits, and returns one main product. Requests require a signed-in trip member, are limited per member/day, use only the server-side `OPENAI_API_KEY`, set `store: false`, and never expose credentials to the browser. Every field remains editable and nothing is added until confirmation.
- Shopping deletion follows the same safety pattern as places and itinerary: left swipe reveals a confirmed single-item delete, while explicit selection mode supports confirmed batch deletion.
- A shopping item's original recognition screenshot remains private Redis data. GPT Image generation is not used. The recognition response's web-search sources are inspected for structured product images, up to three safe image candidates are materialized server-side, and only the user's selected candidate is compressed and stored with the private item.
- Shopping import must present up to three product-image candidates before confirmation. Each thumbnail opens a large, keyboard-dismissible preview where the user can switch candidates and select one. `換一批圖片` performs a dedicated web image search for the already-recognized brand and product, excludes candidate IDs seen in earlier rounds, and never reruns image generation. The search is adaptive: one primary query is sufficient when it yields three usable images; only an incomplete result triggers two concurrent official/multilingual backup queries, whose page sources are interleaved before image extraction.
- Multi-image Shopping imports accept up to twelve screenshots. Images are prepared locally in sequence to avoid an iPhone memory spike, then all prepared AI recognition requests are dispatched concurrently. Every card exposes its own semantic progress state so completed or failed work is immediately distinguishable while other requests remain active. Browser file pickers cannot enforce a native maximum count, so selections over twelve are rejected after the picker returns control to the App, before compression or API use, instead of being silently truncated.
- Selected web product images are converted to bounded JPEG data URLs for reliable iPhone Canvas support. The private Shopping save accepts up to 1.6 MB total selected-product imagery, and the client reconciles each newly added item with the server-sanitized response so stripped images cannot be mistaken for a successful save.
- Product-source links, domains, recommendation stars, and numeric recommendation indexes are intentionally removed from both Shopping API output and persisted annotations. Research sources may ground the AI request internally but never appear in the Shopping UI.
- Custom Shopping categories are created only through a `新增自訂分類` option inside category selectors and may be removed later; affected items fall back to `日常`. Reusable `買給誰` tags may also be removed, and recipient/status filters provide per-person bought and unbought views.
- Place details expose a low-emphasis destructive action at the bottom for signed-in editors. Its label adapts to attraction, restaurant, or lodging; deletion still requires confirmation, cancel returns to the same detail sheet, and guests never see the control.
- Overview prioritizes real planning completion and unresolved decisions instead of duplicating the Places and Itinerary navigation. Its percentage is weighted from outbound/return flight coverage (20%), lodging (20%), days containing itinerary items (40%), and transport coverage between scheduled items (20%); proximity to departure is never a completion input.
- Overview keeps the complete flight list and an explicit add-flight button because flights are a primary planning object rather than a summary-only metric.
- The Places list has one add-place entry point: the persistent bottom action. Swipe-delete controls remain fully hidden until a left swipe begins.
- Transport forms use progressive disclosure: mode-relevant fields appear first, while ticket-specific details remain collapsed until explicitly requested.
