# Known issues

- The Google Maps key was previously shared in conversation. It should be rotated and restricted in Google Cloud before broader public use.
- Google Maps browser-map availability depends on correct production referrer restrictions; Leaflet is the fallback when the key cannot load.
- Google Maps shared-list import works only for publicly accessible lists. Private lists cannot be expanded server-side.
- The local airport catalog is intentionally curated rather than exhaustive; unsupported cities need catalog additions.
- Browser-based ticket OCR is optimized for airport codes, English month names, dates, and colon-formatted times. Low-resolution, handwritten, or heavily stylized tickets may need manual correction.
- First-time ticket OCR requires an internet connection to download the browser recognition worker and English language data; later loads may use the browser cache.
- First-time shopping screenshot recognition downloads Traditional Chinese, English, and Japanese OCR data and may take longer on mobile networks. It reads visible text rather than understanding products that appear only as unlabeled images.
- Private shopping screenshots are higher-resolution compressed reference images stored in Redis for the web prototype. Each member/trip keeps up to eight recent screenshots within the total payload ceiling; older item text remains but its oldest reference photo can be pruned. Photos uploaded before the 2026-08-09 quality upgrade cannot be reconstructed and must be re-uploaded to become clear.
- Walking time is currently estimated from the two saved coordinates with a walking-route factor. It is not live Google routing and may need manual adjustment for barriers, station interiors, or inaccessible paths.
- Shared production data depends on Vercel/Upstash availability. Device-local state is not a substitute for the shared store.
