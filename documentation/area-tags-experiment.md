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
