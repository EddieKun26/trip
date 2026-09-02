# Todo

- Verify fullscreen map opening, left-rail filtering, mobile drawer collapse, and compact marker readability on a real iPhone/PWA after the production rollout.
- Verify the compact marker → bottom preview → full detail flow, background photo enrichment, and close/reselect animation on a real iPhone/PWA.
- Verify a TPE → DXB → LHR round trip with transfers in both directions, including overnight dates and layover labels, on a production iPhone session.
- Verify screenshot prices in JPY/KRW/USD, ambiguous bundle pricing left blank, manual edits, and grouped totals on a signed-in production iPhone session.
- Verify representative Japanese, Chinese, Korean, and English shopping posters on a signed-in production iPhone session, then set an OpenAI project spend limit from observed usage.
- Verify the three-candidate web product-image picker, large preview, automatic fallback search, and `換一批圖片` behavior with representative food, appliance, cosmetic, medicine, supplement, and footwear screenshots on a signed-in production iPhone session.
- Verify representative public, login-gated, private, and address-only hidden-lodging Instagram/Threads posts on a signed-in production iPhone session and tune matching prompts only from observed failures.
- Verify representative Agoda, Booking.com, Airbnb, and `abnb.me` share links on a signed-in production iPhone session, including links whose public metadata is blocked or incomplete and apartments that use the new address-coordinate fallback.
- Verify independent social-place re-search and skip/unskip behavior with a real ambiguous multi-store post on iPhone, including several consecutive re-search rounds.
- Choose and implement either an iOS Shortcut or native Share Extension if direct iPhone Share Sheet delivery is required before WebKit implements Web Share Target; keep the standards-based `/share-target` receiver ready for compatible platforms and future Safari support.
- Rotate the exposed Google Maps key, then restrict the browser key by production HTTP referrer and enable only required APIs.
- Perform final real-device iPhone verification before packaging a test app.
- Consider Google Routes/Transit integration only after the manual transport workflow is stable; it adds API cost and routing complexity.
- Continue improving less-common airport coverage when users encounter an unsupported city.
