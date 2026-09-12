# Todo

## Completed

- [x] Travel Area v5 was deployed to production and the full 31-place `東京 7 日` production smoke test passed on 2026-09-04. The feature is complete; no deployment, migration, or formal acceptance remains pending.

## Remaining

- Verify fullscreen map opening, left-rail filtering, mobile drawer collapse, and compact marker readability on a real iPhone/PWA after the production rollout.
- Verify the compact marker → bottom preview → full detail flow, background photo enrichment, and close/reselect animation on a real iPhone/PWA.
- Verify a TPE → DXB → LHR round trip with transfers in both directions, including overnight dates and layover labels, on a production iPhone session.
- Verify screenshot prices in JPY/KRW/USD, ambiguous bundle pricing left blank, manual edits, and grouped totals on a signed-in production iPhone session.
- Verify manual Shopping photo selection from both the iPhone camera and photo library, then confirm preview, save, replace, remove, and private cross-member isolation on production.
- Verify representative Japanese, Chinese, Korean, and English shopping posters on a signed-in production iPhone session, then set an OpenAI project spend limit from observed usage.
- Verify the three-candidate web product-image picker, large preview, automatic fallback search, and `換一批圖片` behavior with representative food, appliance, cosmetic, medicine, supplement, and footwear screenshots on a signed-in production iPhone session.
- Verify representative public, login-gated, private, and address-only hidden-lodging Instagram/Threads posts on a signed-in production iPhone session and tune matching prompts only from observed failures.
- Verify manual lodging creation on a signed-in production iPhone using `神奈川縣藤澤市片瀨3-8-12` and its short Google Maps link, then edit its name/address/photo after assigning it to an itinerary day and confirm all references remain intact.
- Verify representative Agoda, Booking.com, Airbnb, and `abnb.me` share links on a signed-in production iPhone session, including links whose public metadata is blocked or incomplete and apartments that use the new address-coordinate fallback.
- Verify independent social-place re-search and skip/unskip behavior with a real ambiguous multi-store post on iPhone, including several consecutive re-search rounds.
- Choose and implement either an iOS Shortcut or native Share Extension if direct iPhone Share Sheet delivery is required before WebKit implements Web Share Target; keep the standards-based `/share-target` receiver ready for compatible platforms and future Safari support.
- Rotate the exposed Google Maps key, then restrict the browser key by production HTTP referrer and enable only required APIs.
- Perform final real-device iPhone verification before packaging a test app.
- Consider Google Routes/Transit integration only after the manual transport workflow is stable; it adds API cost and routing complexity.
- Continue improving less-common airport coverage when users encounter an unsupported city.

## General place fallback acceptance (2026-09-08)

- [ ] User production acceptance: restaurant social URL → empty/unsuitable candidates → 搜尋其他地點 → literal keyword search → inspect/select/import. Empty keyword result → 手動新增 with correct kind. Unknown manual kind → four explicit choices; booking/lodging source retains lodging editor. No agent production App visit.


## areaTags experiment acceptance — 2026-09-10

- [ ] User production comparison: optional empty tags, two tags on one Place, one-click trip/address candidates, custom overrides, save/reload, independent List/Map/fullscreen filtering and unchanged identity. Record suggestion/UI ambiguity manually; no analytics or alias resolver in this release.
- [x] User production check of the 2026-09-10 address-suggestion decoupling and English chome fallback confirmed the saved-address row still visible-without-focus behavior, but found the real Booking lodging "自由之家" still showed no Okubo/大久保 suggestion despite Travel Area resolving to 新宿 -- root cause was a stale-snapshot integration bug (not the parser), fixed the same day; see decisions.md "Booking suggestion integration fix and detail chip-row merge".
- [ ] User production re-check on a real device: reopen/re-import "自由之家" (or any Booking-style English address) and confirm the Okubo/大久保 suggestion now appears immediately (typed, pasted, and via Booking-link recognition), and that the merged areaTags+category chip row on restaurant detail pages looks correct (single wrapping row, no horizontal overflow on mobile).


## Candidate confirmation draft editor acceptance — 2026-09-11

- [ ] User production check on a real device: import a social/Google Maps candidate, open its confirmation page, tap 編輯 near the title, change name/kind/category/areaTags/photo, Save, confirm it returns to the same candidate's confirmation page showing the edit. Re-open 編輯, make an unsaved change, Cancel, confirm the prior Save is intact and the unsaved change is gone. Tap 確認選取 (not the removed 取消選取), confirm it only checks the candidate and returns to the candidate list. Uncheck it from the list, re-check it, re-open 編輯 and confirm the draft is still there. Finally tap "加入已選 N 個地點" and confirm the added place has the edited name/kind/category/areaTags/photo while its map pin, address, phone, hours, rating and photos still match the original Google listing (no re-search). Close/cancel the whole import sheet and start a new import; confirm no leftover draft from the previous session appears.


## Sticky save footer and same-place navigation acceptance — 2026-09-11

- [ ] User production check on a real iPhone/Android device during bulk areaTags editing: the Save/Cancel bar stays visible while scrolling the editor, is not obscured by or fighting the on-screen keyboard, and the last field (photo section) is never hidden behind it. Confirm Save and Cancel on an existing place both return to that same place's detail (not the list), Save shows the freshly saved data, Cancel shows the untouched original, and the underlying Places list's scroll position/filters are exactly as left when the editor is eventually closed.


## Safe auto-tag backfill acceptance — 2026-09-12

- [ ] Deploy this round's `app.js` change to production, then open the real trip in a normal authenticated browser session (this triggers `scheduleTagBackfillMigration()` automatically, once). Afterwards check a few previously-tagless restaurant Places now show a single sensible 類別 chip (and a single 地區 chip where containment/address evidence existed), and that every Place that already had either tag is completely unchanged.
- [ ] Open the browser devtools console during that first load and report back the `[tag-backfill]` line it logs (mutation counts), and in particular whether it logs the "N restaurant place(s) need an exact Google Place Details lookup; skipping that batch this run (cap is 20)" warning -- if so, the real backlog is bigger than the safe auto-run threshold and needs an explicit follow-up round to design a multi-session batching/resume plan (this round intentionally does not guess at one, since the real count was unknown while building it).
- [ ] Reload the trip a second time afterwards and confirm no further `[tag-backfill]` mutation log appears (idempotency holds in production, not just in the test suite).
