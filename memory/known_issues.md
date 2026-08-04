# Known issues

- The Google Maps key was previously shared in conversation. It should be rotated and restricted in Google Cloud before broader public use.
- Google Maps browser-map availability depends on correct production referrer restrictions; Leaflet is the fallback when the key cannot load.
- Google Maps shared-list import works only for publicly accessible lists. Private lists cannot be expanded server-side.
- The local airport catalog is intentionally curated rather than exhaustive; unsupported cities need catalog additions.
- Shared production data depends on Vercel/Upstash availability. Device-local state is not a substitute for the shared store.
