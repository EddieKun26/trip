# Known issues

- The Google Maps key was previously shared in conversation. It should be rotated and restricted in Google Cloud before broader public use.
- Google Maps browser-map availability depends on correct production referrer restrictions; Leaflet is the fallback when the key cannot load.
- Google Maps shared-list import works only for publicly accessible lists. Private lists cannot be expanded server-side.
- Instagram and Threads may block server-side public metadata or require login. In those cases the user must upload a screenshot; the first version does not support other social platforms or direct iOS share-sheet delivery.
- Instagram profile/pinned external links are not reliably exposed in public metadata. A caption-level address can still produce Google lodging candidates, but a broad neighborhood-only address may match several plausible properties and always requires the user's explicit selection.
- The local airport catalog is intentionally curated rather than exhaustive; unsupported cities need catalog additions.
- Browser-based ticket OCR is optimized for airport codes, English month names, dates, and colon-formatted times. Low-resolution, handwritten, or heavily stylized tickets may need manual correction.
- First-time ticket OCR requires an internet connection to download the browser recognition worker and English language data; later loads may use the browser cache.
- Shopping screenshot recognition depends on a separately billed OpenAI API project and a Vercel server-side `OPENAI_API_KEY`; ChatGPT Plus quota does not supply API usage. Dense or unclear posters can still have low-confidence results, so every recognized field remains editable and requires confirmation.
- Private shopping screenshots are higher-resolution compressed reference images stored in Redis for the web prototype. Each member/trip can retain up to 16 screenshots but the total payload ceiling may prune older photos sooner; item text remains. Photos uploaded before the 2026-08-09 quality upgrade cannot be reconstructed and must be re-uploaded to become clear.
- Walking time is currently estimated from the two saved coordinates with a walking-route factor. It is not live Google routing and may need manual adjustment for barriers, station interiors, or inaccessible paths.
- Shared production data depends on Vercel/Upstash availability. Device-local state is not a substitute for the shared store.
- A browser tab that was already running code from before the 2026-08-11 deployment-version check must be refreshed or reopened once. After it loads the protected build, future deployments are detected when the tab returns to the foreground.
