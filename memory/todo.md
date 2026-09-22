# Todo

## Phase 2A.6 — Production-truth stabilization (2026-09-22)

- [x] Record three production acceptance failures; distinguish fixture evidence from actual production truth.
- [x] Diagnostic-only dd178242 deployed; USER performed smoke and supplied screenshots. Correlated trace confirmed direct identity + exact 9/24 09:00, address exclusion, zero hydration, sidecar miss, no windows/conflict and enabled CTA.
- [x] Add actual exclusion-path failing regression; separate hours-only eligibility on client/server while keeping full Detail protections. Add known/unavailable/transient visible state tests and retain current-selection barrier.
- [x] Remove temporary diagnostics. Focused 138/138, full 931/931, zero failures/skips; non-GUI static/fingerprint/API/privacy/artifact gate PASS.
- [ ] Git fast-forward functional release after fresh exact dd178242 baseline reconciliation; verify exact commit production READY.
- [ ] USER final iPhone acceptance: select at 9/24 exact 09:00 without opening Detail; known illegal shows persistent warning in main/drawer and blocks; unavailable/transient shows clear nonblocking notice. For known hours, legal time clears and returning to illegal time recreates warning without another Google request.
- [ ] Phase 2A.6 COMPLETE only after USER acceptance PASS. Engineering PASS is not acceptance.
- [ ] Phase 2A.7 Map — NOT STARTED. Phase 2C Discovery — NOT STARTED. Planner V2/External AI — NOT STARTED.

## Phase 2A.6 — Opening Hours Production Hotfix 2 (2026-09-21)

- [x] Reproduce a fixture-level legacy-identity defect with the real Planner selected-candidate/render path (not the later production-confirmed cause): a legacy Google Maps `sourceUrl` identity with no direct `placeId`, known mocked hours and exact 09:00 started no hydration on the released client.
- [x] Unify the existing explicit legacy Google identity across selection hydration, current-selection barrier, active state, sidecar read/write, server Plan/Apply overlay and exact response binding. Preserve the three-layer contract, 30-minute minimum, no display parser/category heuristic, sidecar-only persistence and Plan/Apply external-call boundaries.
- [x] Non-GUI gate: targeted 144/144; full regression 923/923; zero failures/skips; syntax/diff/API/fingerprint/migration/model-contract/secret/artifact checks passed.
- [x] Historical user smoke FAILED; superseded by the production-truth round above. Original smoke: set exact 09:00, select Virtu without opening Detail, wait for hours resolution and expect persistent `營業時間不符合` plus blocked Planner; choose a legal time and expect warning clear/Planner enabled; return to 09:00 and expect the warning immediately without another Google fetch.
- [ ] Phase 2A.7 Map — NOT STARTED.
- [ ] Phase 2C Discovery / Tourist Recommendations — NOT STARTED.

## Phase 2A.6 — Opening Hours Production Hotfix (2026-09-21)

- [x] Reproduce the released current-selection bypass and implement the three-layer correction: selection hydration with immediate candidate conflict, exact-time/date revalidation using the existing 30-minute rule, and a mandatory current-selection Planner-start barrier.
- [x] Preserve sidecar-only enrichment, server authority, transient unknown behavior, zero Trip/revision/Undo mutation, Plan zero-Google/zero-write, Apply zero-Google/zero-OpenAI, Phase 2A.5 semantics and Phase 2B Draft/Apply. Non-GUI gate 919/919; no skips.
- [x] Historical user smoke FAILED; superseded by the production-truth round above. Original smoke: without opening Detail, select Virtu at exact 09:00; after hours resolution expect `營業時間不符合` and blocked Planner, then choose a clearly valid time and expect the warning to clear and Preview/Draft to generate.
- [ ] Phase 2A.7 Map — NOT STARTED.
- [ ] Phase 2C Discovery / Tourist Recommendations — NOT STARTED.

## Phase 2A.6 — Planner Opening Hours Coverage (2026-09-20)

- [x] Narrow Redis sidecar, legacy embedded fallback, authenticated selected-Place exact hydration, Detail hours-only compatibility, client request deduplication/concurrency cap, Planner waiting, Plan/Apply read overlay and non-GUI engineering regression.
- [x] Historical user smoke FAILED; superseded by the production-truth round above. Original smoke: without opening Detail, select an old Google Place previously missed by Planner; after 確認營業時間 settles, an exact time clearly outside regular hours must show 營業時間不符合 before Preview, then an inside time should produce Preview/Draft.
- [ ] Phase 2C — Discovery / Tourist Recommendations. NOT IMPLEMENTED.

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


## AI Planner Preview review gate — 2026-09-17

- [x] Real Luna High evaluation: 2A.1 baseline in `../ai-planner-eval-out` and the Phase 2A.3 tuned run in `../ai-planner-eval-out-phase2a3` (21 real runs, `gpt-5.6-luna` / `high`). Planner density/quality tuning is closed and frozen — no further density tuning without new evidence.
- [x] Real local E2E through `POST action=plan` (Phase 2A.4, `scripts/ai-planner-e2e.mjs`): 200, 1 call, no repair, store unchanged.
- [x] Vercel runtime verified (Phase 2A.4): `fluid: true`, hobby plan, Fluid Compute default/max 300s. `api/trip.mjs` now declares `maxDuration` 150s (mirrored in `vercel.json`) and the Planner's worst case is 120s of model time (2 × 60s), so no platform kill and no dependence on a dashboard default. The old "≤ 220s model time" budget no longer applies.
- [x] Phase 2A.4 release gate: real `POST action=plan` E2E PASS, full regression 828/828, released to production via fast-forward to main.
- [ ] User: one production smoke of the AI Planner Preview on iPhone; then rotate the temporary OpenAI key used for the local E2E (it sat in plaintext in a local settings file) and set the production `AI_PLANNER_MODEL=gpt-5.6-luna` / `AI_PLANNER_REASONING_EFFORT=high` env vars if not already present (the route returns 503 `PLANNER_MODEL_NOT_CONFIGURED` without them).

## AI Planner quality edge cases — monitored/deferred after Phase 2A.4

- [ ] Flight-day floor: with the 9/24 17:50 NRT return, 2 of 3 Fixture E runs left the whole departure day empty (0 place stops; mean stops on flight days 0.67) while run 3 comfortably fitted 築地 09:00 + 銀座三越 ending 12:30 (320-minute margin). Decide whether an empty final morning is the wanted conservatism or under-scheduling; investigate before adding anything.
- [ ] Occasional very light day: B run 3 left 9/22 at 2 stops (淺草寺 + 晴空塔) while 上野恩賜公園 / 東京國立博物館 sat unscheduled in the same area. 1 of 15 A–E runs; watch for frequency before acting.
- [ ] Validator does not check an activity crossing midnight (e.g. 23:30 + 240 minutes); `mockValidPlan` already avoids it but the validator does not reject it. Phase 2A.5 deliberately kept this unchanged (opening hours only interpret overnight windows on the extended day timeline); it stays a separate future decision.
- [ ] Fixture E locked itinerary items store no `durationMinutes`, so gaps after a locked item stay unknown and locked→new transition diagnostics are incomplete.
- [ ] Duplicate-placement first-pass pattern (C run 2 `REQUIRED_DUPLICATED`, G run 3 `SOFT_DUPLICATED`): track its rate in future runs; currently absorbed by the validator plus one repair.
- [ ] Production observability / rollout criteria for the Planner endpoint (error codes, repair rate, latency, quota) before enabling it in production.
- [ ] After Luna passes: set `AI_PLANNER_MODEL=gpt-5.6-luna`, `AI_PLANNER_REASONING_EFFORT=high`, optionally `AI_PLANNER_DAILY_LIMIT`, then commit/push/deploy.
- Next phases (out of scope here): Accept/apply Preview to the itinerary, Place Discovery, free-text preferences.

## Fullscreen Trip Planning Workspace acceptance — 2026-09-16

- [x] Engineering Gate passed and pushed to `origin/main`/production this round: 行程規劃 rename, fullscreen desktop two-column layout, mobile drawer/handle, planning-constraint wheel sheet, auto-select-on-date-pick, unselect-clears-constraint, scroll-preservation (now real-browser-verified with 36 synthetic Places, not just unit math), and the migration-toast silencing fix all landed together.
- [ ] User production smoke (one pass, in production itself, no local preview needed first): open 行程規劃, exercise desktop two-column + mid-list select/unselect/FIXED_DAY/FIXED_TIME, mobile drawer open/close, reload the App and confirm no migration/backfill/marker toast appears at startup, and a quick existing-itinerary sanity pass (date switch, timeline, transport, add place). See the release commit message / final report for the full checklist.
- Next round (explicitly out of scope here): implement the actual AI Planner behind the CTA, now consuming both the HARD-selected set *and* each Place's UNSCHEDULED/FIXED_DAY/FIXED_TIME constraint. No OpenAI wiring exists yet.

## Selection-first Place Pool acceptance — 2026-09-16

- [ ] User review of `feat/selection-first-place-pool` (not committed/pushed/deployed): confirm click/tap-to-select, the always-visible Selected section, filter-independent selected visibility, the ⋯/＋日期 secondary manual-add path, the ⠿ drag handle, and the disabled CTA copy match intent before merging.
- Next round (explicitly out of scope here): implement the actual AI Planner behind the CTA (date/area/day-order assignment for HARD-selected Places plus SOFT choices from the rest of the pool and any future Discovery results). No OpenAI wiring exists yet.

## Safe auto-tag backfill acceptance — 2026-09-12

- [ ] Deploy this round's `app.js` change to production, then open the real trip in a normal authenticated browser session (this triggers `scheduleTagBackfillMigration()` automatically, once). Afterwards check a few previously-tagless restaurant Places now show a single sensible 類別 chip (and a single 地區 chip where containment/address evidence existed), and that every Place that already had either tag is completely unchanged.
- [ ] Open the browser devtools console during that first load and report back the `[tag-backfill]` line it logs (mutation counts), and in particular whether it logs the "N restaurant place(s) need an exact Google Place Details lookup; skipping that batch this run (cap is 20)" warning -- if so, the real backlog is bigger than the safe auto-run threshold and needs an explicit follow-up round to design a multi-session batching/resume plan (this round intentionally does not guess at one, since the real count was unknown while building it).
- [ ] Reload the trip a second time afterwards and confirm no further `[tag-backfill]` mutation log appears (idempotency holds in production, not just in the test suite).

## AI Planner Opening Hours (Phase 2A.5) — 2026-09-18

- [x] Engineering gate + real Luna High eval passed (see project_state.md): structured `regularOpeningPeriods` v1, lazy one-time Detail backfill, HARD validator + conservative preflight, no migration, no plan-time Google call.
- [ ] User: single iPhone production smoke. Open an older Google Place Detail (the display hours still show; this open may backfill structured hours once), then close and reopen it (should look normal). In the AI Planner, set an exact time clearly outside a known-hours Place's opening hours and confirm the opening-hours conflict copy (not "已排滿") appears before any model call. Adjust to a sensible time, confirm a Preview is produced, and confirm nothing is written to the itinerary.
- [ ] Future (not scheduled): holiday/special hours (`currentOpeningHours`, special days, temporary closure, `businessStatus`); a freshness/refresh policy for `fetchedAt`; optional hours display or unknown/closed hints in the Preview; hours warnings for existing locked itinerary items.

## Phase 2B — Interactive Planner Draft + Apply (2026-09-20)

Engineering implementation passed 892/892 tests (0 failures/skips); see documentation/planner-draft-apply-gate.md. Baseline 9461321360146a776792078e2279fdf8e10c7ff6; release branch feat/planner-draft-apply.

Preview becomes an in-memory editable Draft. AI cannot rewrite existing itinerary; humans can edit normal existing items. Flights retain canonical fixed day/time/duration rules, while same-day ordering remains permitted by the normal editor. Drag uses canonical array order; explicit day selection appends without changing time. Time uses the existing wheel; durations remain absent unless explicitly set. No Draft localStorage/IndexedDB/server storage. Footer: 套用此行程 / 重新規劃 / 修改規劃條件. Dirty discard requires confirmation; Replan uses original request snapshot.

POST action=applyPlan reloads canonical Trip, checks revision, resolves canonical Saved Place keys and revision/day/index existing refs, reconstructs metadata server-side, validates deterministic legality and uses one atomic Redis CAS write with one revision increment. No scripting means fail closed, no GET+SET fallback. Rejected Apply writes zero. Existing one-level memory Undo restores the entire Apply through revision-bound atomic PUT; stale Undo fails closed. Undo is session-only and expires on reload, consistent with existing history.

Known structured opening hours are revalidated; unknown hours do not block. Persistent readable Planner error cards preserve correctable Drafts. Human edits override original AI preferred/exact/date constraints; generation's five-place limit is not a manual itinerary limit. Plan remains no-write; Apply calls neither OpenAI nor Google. Model generation contract unchanged; no real Luna reevaluation, migration or new history store.

Workflow: Agent does not operate local or production App UI. User owns all UI/UX/manual interaction smoke. Engineering validation is code/test/static/API based; one production user smoke occurs after READY. Earlier browser observations are historical only, not the final engineering gate. USER_UI_SMOKE_REQUIRED=YES.

NEXT: Phase 2C — Discovery / Tourist Recommendations. NOT IMPLEMENTED in Phase 2B. Future unsaved recommendations must be marked and explicitly accepted/skipped; recommendations must not silently write Saved Places or itinerary.
