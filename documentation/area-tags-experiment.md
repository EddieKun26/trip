# Optional areaTags comparison experiment

Implementation baseline: `origin/main` at `4d778b5c3556a99a510c5b38664c0683d0132d2f`, in the new isolated `area-tags-experiment` worktree. This request overrides the older prototype-to-mirror workflow. The prototype, primary dirty tree and every preexisting worktree are protected.

## Contract and persistence

- `Place.areaTags?: string[]` is an optional user label list. Missing reads as `[]` without adding a property or migrating a record. Explicit `[]` is a valid manual clear.
- `lib/area-tags.js` trims, removes empty/non-string entries, and deduplicates by NFKC + locale-independent lowercase comparison, preserving the first trimmed display spelling. Arbitrary labels are accepted; no catalog, unique geographic assignment or polygon is required.
- The existing Place editor owns an independent draft. Only choose/remove/add/Enter or explicit Save with pending custom text changes that draft. Cancel leaves the Place untouched. Save writes the draft, including `[]`.
- A tag-only save modifies only `areaTags` on the existing Place and uses the existing persistence path, without address resolution or identity reconstruction. If restaurant tags were also explicitly edited, both label sets are saved together. Other edits continue through the existing editor with the area tag draft preserved.
- `api/trip.mjs` sanitizes only an explicit tag property. If an older client omits it, a unique matching existing `id` (or `placeId` when no app ID is supplied) preserves stored tags; there is no matching by name. Explicit `[]` always wins. No endpoint or database migration was added.
- Existing serialization, startup hydration and legacy Travel Area reclassification preserve this independent property. Tags are never copied from legacy area fields or regenerated from a resolver result.

## Suggestions and UI

- The main Place editor shows removable selected chips, matching current-trip tags in a focus/query autocomplete, saved-address suggestions, and a custom input with `＋新增地區`. It is optional for every Place kind. An otherwise unchanged existing record can save labels even if its old address is missing or unresolved.
- Trip suggestions read only actual persisted `areaTags` in the active trip. Already selected labels are excluded using the same Unicode/case comparison; no cross-trip/global learning exists.
- Address candidates read saved `addressComponents` with `neighborhood` or meaningful `sublocality`/levels types, supporting Google longText and long_name shapes. Pure numeric chome levels are omitted; named numeric chome suffixes are stripped.
- When usable structured candidates are absent, formatted-address fallback accepts only a Japanese named block with an explicit numeric 丁目 after a municipality delimiter, or a standalone named 丁目 fragment. Ambiguous address strings yield no suggestion. It does not parse every Japanese address format.
- Suggestions never call Google, geocode, use a semantic dictionary, infer nearby regions, inspect geometry, or use the Place name/legacy area. 神宮前、恵比寿西、外神田、青海、芝公園 remain literal candidates. Nothing is automatically persisted.
- Detail displays a separate `地區：` label row when tags exist; the entire new row is omitted otherwise. Legacy detail and the exact formatted-address display remain.

## Independent filter and legacy isolation

- `state.areaTagFilter` is shared by List, Map and fullscreen drawer. Its options are only the active trip's saved labels. Multi-tag Places match each of their tags. Untagged Places remain in All and match no specific tag. The state resets on trip change and stale options clear.
- Existing kind, Travel Area, restaurant and preference criteria still intersect with this filter. To compare tags alone, keep the old Travel Area filter at All.
- Tag selection and tag-only save use a redraw that skips legacy background split scheduling and coordinate enrichment. The tag filter never selects an area key, fetches a boundary or derives a polygon. The existing boundary renderer continues to respond only to an independently selected legacy Travel Area; if that old filter is selected it retains its old boundary behavior.
- Legacy catalog, geometry inputs/build tooling, union data, resolver logic and boundary loader/exterior renderer are unchanged. No 63-area audit or source research was repeated.

## Validation and user acceptance

Node regression coverage includes normalization, custom/clear persistence, actual editor chip actions and cancellation, optional-address validation, authenticated API PUT/GET, real application startup/serialization/reload, legacy resolver success/failure, shared filter membership, boundary isolation and Google/non-area identity preservation. Browser primitives and storage/network are test doubles; no browser smoke test or production App visit is performed.

For manual comparison, save two custom tags on a Place, reload, select each tag in List and Map, then remove every tag and save/reload. Confirm the Place still appears in All and its address/photos are unchanged. Compare the literal address suggestions with your preferred travel labels; record UI friction or semantic ambiguity outside the App. Semantic alias work remains deferred until user feedback.

Validation result: targeted **122/122**, full regression **393/393** in one full run; API functions **12**. All **1,805** protected worktree/prototype files matched the pre-implementation snapshot with no added or missing files.


### Address suggestion correction (2026-09-10)

Explicit administrative/locality, postal, street-number and country exclusions precede the positive geographic types. Japanese sublocality level 1 is excluded as ward/municipality; explicit City/Ward labels are excluded too. Numeric block names are checked with Unicode mark/hyphen normalization so chōme and chome are equally excluded, alongside 丁目/番/號.

For display localization, use the current saved component name or its unique exact-type counterpart in the same Place's saved original address array. Prefer existing localized text; ambiguous/missing counterparts keep the source spelling. No legacy area metadata, positional pairing, translation dictionary or semantic alias is used. The three production fixtures pass with literal Ginza / Ebisunishi / Shiba and reliable saved local equivalents. Targeted 93/93; one full run 398/398. This correction does not edit app.js, API, persistence, filters or legacy geography.


### UI acceptance polish (2026-09-10)

This supersedes the initial always-visible suggestion rows. Selected chips now share the category chip's dark solid/white rule and reserve a 44px empty row. The input/add row follows the selected container; autocomplete is an absolute overlay beneath it, so opening/closing it does not move the full address. Trip-used labels require nonempty substring-matching text; focus alone can show saved-address suggestions. The source, localization and persisted-tag contract are unchanged.

Detail data provenance was reviewed before moving anything:

| UI text | Data source | Treatment |
| --- | --- | --- |
| Primary 地區 | areaTags | Keep as primary label row; omit when empty |
| Old title kicker | travelAreaDisplayName(place) | Move to small muted 舊分區 below tags |
| Byline/category | fullName/name, category | Preserve |
| Restaurant chips | restaurantTagValues(place) | Preserve |
| Description | place.description | Preserve, including any geographic wording |
| Highlights | place.highlights | Preserve, even if a highlight repeats an area name |
| Full address | place.formattedAddress | Preserve |

The iPhone ↑/↓/✓ control is consistent with the native form accessory (Previous/Next/Done) described in [Apple's Designing Forms documentation](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/DesigningForms/DesigningForms.html). Source review finds no editor-rendered equivalent; app arrows elsewhere belong to itinerary reordering. No native-keyboard workaround was added. No production App or browser smoke test was run.

Validation: targeted 85/85; full regression once 403/403, including UI state/node and stylesheet layout contracts. Real-device visual acceptance remains with the user.


### Address suggestion decoupling and English chome fallback (2026-09-10)

Two production reports drove this round: saved-address suggestions only appeared while the trip-tag autocomplete had focus (so users closing/never opening it never saw them), and Booking-style English addresses (`1 Chome - 16 - 19 Okubo, Shinjuku - ku, Tōkyō - to 169 - 0072`) produced no candidate even though a Japanese city block was present.

- The saved-address row is now its own persistent element (`data-area-tag-address-suggestions`), rendered on every draft update independent of the trip-tag input's focus/query state. The trip-tag autocomplete dropdown only ever shows trip-used labels and still requires nonempty query text; it no longer carries address suggestions at all. Reserved 44px row height and no-content collapse (empty `innerHTML`) are unchanged.
- `formattedCandidates` gained a Latin fallback: a `chōme`/`chome` block (`\d+ ?ch[oō]me-\d+(-\d+)?`) matched against an immediately adjacent district name and an explicit municipality delimiter (`... City`, `-ku`, `-shi`), in either forward (`block district, City`) or reverse (`City, district, block`) order. A parser-only copy normalizes NFKC, Unicode dashes and whitespace before matching; the stored `formattedAddress`/`manualAddress`/`address` is never rewritten. Room/floor numbers, the block number itself, prefecture/postal text and bare building names are excluded by construction — the district must sit directly between the block and the municipality token, so `Room 202`, `Chome`, `Shinjuku-ku`, `Tokyo-to`, and `169-0072` never qualify as candidates.
- Added a working-identity-only romanization fold: `romanKey` strips the vowel macron combining mark (`̄`) after NFD decomposition, so `Ōkubo` and `Okubo` share one comparison/dedupe identity via a per-render `comparison(places)` context. This is scoped to Japanese address candidates only (built from evidence in `addressComponents`/`addressComponentsOriginal` and the formatted-address fallback) and never touches any other accented character (`Café` vs `Cafe`, `Mâcon` vs `Macon` remain distinct) or a non-Japanese place. `AreaTags.key`/`normalize`/`matches`/`tripTags` all accept an optional context; omitting it falls back to the unfolded exact-match behavior used everywhere else.
- Display label selection now follows a fixed precedence, exposed as `AreaTags.preferredLabel(candidate, places, context)`: (1) an existing persisted `areaTags` label on any place in the same romanization group, (2) a reliable exact localized counterpart evidenced by paired `addressComponents`/`addressComponentsOriginal` on some place in that group (ambiguous or absent counterparts are skipped), (3) the original romanized candidate untouched. Persisted labels and raw source addresses are never rewritten by comparison normalization — only the working `key`/grouping value changes, never the string stored on a `Place` or shown as `formattedAddress`.
- `AreaTags.queryMatches` lets the (currently unused, address suggestions no longer live in the query dropdown) trip-tag search also match a saved localized label via its evidenced romanized counterpart, without adding any translation dictionary. No semantic/travel-area alias exists or was added: 大久保 never suggests 新大久保, and the existing Ebisunishi/Jingumae/Sotokanda/Shiba/Nishishinjuku fixtures still assert their literal romanized or exact-local text only, never a neighborhood nickname.
- Regression fixture for the reported Booking address (`Room 202 , 1 Chome - 16 - 19 Okubo\nShinjuku - ku, Tōkyō - to 169 - 0072`) covers Unicode-dash and doubled-space variants, confirms structured `addressComponents` evidence still wins over the formatted fallback when both exist, and confirms the negative cases (`Shinjuku-ku` alone, `Room 202` alone, the postal code alone, `1 Chome-16-19 Room 202`) never produce a candidate.
- Targeted `tests/area-tags.test.mjs` 20/20, `tests/lodging-editor.test.mjs` 46/46; full canonical `node --test tests/*.test.mjs` 409/409. No API, persistence, legacy Travel Area, or geometry file changed. Frontend assets advanced to `20260910.5` (`app.js`, `styles.css` via `index.html`, `lib/area-tags.js`). No production App or browser smoke test was run in this round.


### Booking suggestion integration fix and detail chip-row merge (2026-09-10)

A real production Booking lodging ("自由之家", address `Room 202 , 1 Chome - 16 - 19 Okubo\nShinjuku - ku, Tōkyō - to 169 - 0072`) showed Travel Area correctly resolved to 新宿, but the areaTags suggestion row stayed empty — proving the previous round's unit-test coverage of `formattedCandidates`/`addressSuggestions` alone was not sufficient to catch a real integration bug.

- **Root cause**: the parser was re-verified correct in isolation (direct reproduction confirmed `addressSuggestions` still returns `Okubo`/`Ōkubo` for this exact address, structured or formatted-fallback). The bug was in the lodging editor's integration wiring: `renderAreaTagDraft` always read `session.areaTagSource`, a snapshot captured once when `bindAreaTagEditor` ran at editor-open time, and nothing ever refreshed it afterward. Two real paths change the address without ever updating that snapshot: (1) `fillPlaceEditorFromUrl`, used when a Booking/Airbnb share link is recognized, sets `form.elements.address.value` via a **direct DOM property assignment** — this fires no `"input"` event, so no listener anywhere saw the change; (2) the existing generic form `"input"` listener for the address field only called `session.invalidate()`/`session.schedule()` (the geocode debounce) — it never touched area-tag suggestions even for genuine keystrokes. So the suggestion row was frozen at whatever (often empty) evidence existed when the sheet first opened, regardless of what the address textarea showed or later resolved to. "地址已定位・新宿" succeeding is a *different* domain (Travel Area/geocode) from the areaTags suggestion pipeline and must never suppress or gate it.
- **Fix** (`app.js` only; `lib/area-tags.js` untouched this round): added `areaTagAddressSource(form)`, which compares the live address textarea to `session.areaTagBaseline` (the address captured the moment the editor opened). If unchanged, it reuses the originally-bound evidence (including any structured `addressComponents`). If the textarea has diverged, it drops the now-stale structured components (they describe a *different* address) and returns only the current typed/pasted text as `{ manualAddress, address }` — still genuine user-provided evidence, never async resolver output, preserving the existing "suggestions read saved evidence, never async resolver output" invariant. `renderAreaTagDraft` now derives suggestions from this live source and refreshes `session.areaTagComparison` on every render. The recompute is wired at every point the address can change outside the user's own keystrokes: the generic address `"input"` handler, `fillPlaceEditorFromUrl`'s draft-fill, and `syncSource`'s address-clear.
- **New integration regression** (`tests/lodging-editor.test.mjs`): drives the real `bindPlaceEditor` → `fillPlaceEditorFromUrl` → submit pipeline end-to-end for the exact reported address — typed/pasted input, async Booking-draft recognition with no input event, geocode resolving Travel Area to 新宿 without suppressing the Okubo candidate, and save-then-reopen reading from real persisted `manualAddress`/`formattedAddress`/`addressComponents`. This is deliberately a level above `addressSuggestions(address)` unit coverage, which the production failure proved insufficient on its own.
- **Detail chip-row merge**: the separate `地區：` areaTags section and the restaurant-only `類別` section are now one function, `placeTagsDetail(place)`, producing a single `.detail-area-tags` row: areaTags chips first, then (for `kind === "restaurant"` only) restaurant category chips — no label text, no invented `尚未設定` placeholder when a place has neither. Same `.highlight-tag` chip style and the same `.detail-area-tags`/`> div` flex-wrap CSS (already wraps with `min-width: 0`, no horizontal overflow) — no stylesheet change was needed. `舊分區：` (legacy Travel Area) keeps its exact separate `<p class="detail-legacy-area">` position and style, never merged into the chip row. Filters, the editor, and persisted data are unchanged. `tests/place-identity.test.mjs` and `tests/area-tags.test.mjs` were updated to the new merged markup and given ordering/no-invented-category coverage.
- **romanKey safety re-check**: all call sites (`key`, `comparison`, `queryMatches`) are unchanged from the prior round — folding only applies inside a per-render Japanese-address `comparison(places)` context; `Café`/`Cafe` and any non-Japanese place remain unaffected; no persisted label, display label, or source address is ever rewritten; no semantic/travel-area alias exists.
- Targeted `tests/area-tags.test.mjs` 20/20, `tests/lodging-editor.test.mjs` 47/47, `tests/place-identity.test.mjs` 13/13; full canonical `node --test tests/*.test.mjs` 411/411. API functions remain 12. `app.js` asset advanced to `20260910.6`; `lib/area-tags.js` and `styles.css` unchanged this round. No production App or browser smoke test was run in this round — the user performs real-device verification.
