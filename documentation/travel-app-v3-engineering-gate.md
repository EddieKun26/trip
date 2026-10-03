# Travel App V3 — integrated Engineering Gate

Date: 2026-10-03. Engineering Gate: **PASS**. USER_UI_SMOKE_REQUIRED=YES.

## Scope and isolation

Integrated A–E completed in travel-app-v3, branch feat/travel-app-v3, based on exactly d286c15fe12658072ca6bc36c451d6992e832e45. The user's V3 isolation and single-release instruction overrides the normal prototype/mirror workflow. Other checkouts and production Trip data were not operated on. No browser, App UI, computer-use, live model evaluation or real Google lookup was used for validation.

## Implemented contract and evidence

| Milestone | Result | Deterministic evidence |
|---|---|---|
| A — map-first navigation and visual system | Map / Itinerary / Places; secondary trip/shopping; warm contrast-tested palette, 16px form inputs, 44px controls, safe-area/reduced-motion styling, three-column desktop and mobile sheet | startup, v3-workspace, v3-ui; CSS and DOM assertions, not measured browser geometry |
| B — accurate map and geography | Native Google/Leaflet markers at original coordinates; no pin offsets; clustering with exact co-location chooser; selection and ordered day routes; nearby/location context; one confirmed canonical import area | v3-workspace geometry and v3-ui native engine fakes through zoom/resize; client direct and URL-only import gates; API PUT tests; existing geography/migration tests |
| C — shared Place workspace and itinerary | Same stable identity from list/map/timeline; details, multi-date none/preferred/exact, duration, manual atomic scheduling; whole-visit hours checks, protected flights, edit/reorder/delete and one-level Undo retained | v3-ui, place-identity/editor, hours ingestion/hotfix/sidecar, deterministic validator/Apply, Draft/UI regression |
| D — external planning | Built-in planner model/config/quota runtime removed; old action=plan authenticated 410; read-only immutable snapshot + hash + stable P references; human-readable PLAN-TEXT-V1 export/import; malformed/stale/duplicate/missing/time/hours validation; editable preview before Apply | v3-external-planner; rewritten API tests with model/quota/write spies; retained deterministic feasibility/validator/preview tests |
| E — proposed places and Apply | Unresolved suggestions stay in-memory and block Apply; explicit Google result selection, area confirmation, dedupe, canonical atomic insertion, keep schedule, revalidate; canonical Apply and revision-bound Undo | v3-ui existing/new binding tests; API no-write failures + CAS tests; protected-flight/conflict/stale/Undo regressions |

## Gate actually run

- node --test tests/*.test.mjs: **897 tests, 897 passed, 0 failed, 0 cancelled, 0 skipped**, from this worktree.
- JavaScript syntax checks over changed/new source and tests plus all 12 API modules: PASS.
- git diff --check: PASS. No repository line-ending configuration change.
- API route count: exactly 12; no added serverless route.
- Canonical migration manifest/runner, verified geometry data, structured-hours core/sidecar and deterministic Apply/validator modules unchanged from baseline. No schema migration, production backfill or repair executed.
- Added-content credential-pattern scan: PASS for common API/token/private-key formats; this is a heuristic, not a general secret-proof claim.
- Temporary test logs and intermediate files excluded from release. Explicit file staging only; staged-tree audit required before commit.
- Release gate: fresh fetch must leave origin/main at the exact baseline above. If moved, stop with REMOTE_MAIN_MOVED. Publish once by normal git push origin HEAD:main only; never force/rebase/reconcile or CLI production deployment. Verify project trip, Git main, exact release SHA, production READY through read-only deployment metadata.

## Test migration, not backward UI compatibility

The model call/repair/quota harness and paid evaluation scripts were removed with the retired built-in model feature. Pure feasibility, weekly-hours, overlap, protected items, selection identity, atomic CAS, stale revision and Undo tests remain. Old fullscreen drawer/Selected column/date-modal/map-offset layout assertions were retired or rewritten for the shared workspace, canonical broad-area sections and map bottom sheet. Their replacement coverage is in v3-ui, v3-workspace and v3-external-planner; the narrower identity/editor fixtures execute the shipped V3 renderer. Synthetic migration fixtures now use actual canonical labels instead of key-as-label placeholders. Frozen real migration fingerprints were not changed to make tests pass.

897 is the current suite count, not an unchanged historical-suite count. The retired UI assertion ledger is in travel-app-v3-retired-ui-tests.md.

## Explicit evidence limits and user acceptance

Engineering tests use synthetic data, fake DOM/native map interfaces and HTTP/Redis fixtures. They establish code contracts and projection inputs, not production pixel alignment, device keyboard behavior, Google basemap availability, live external-AI output quality or real network success. This is not a visual or real-device accessibility certification. The user alone performs one final production acceptance after READY:

1. Mobile/PWA Map default: pan/zoom, coincident pins, location, nearby/today filters, sheet states; desktop three panels; keyboard navigation, text sizing and safe areas.
2. Places and map/timeline open the same Place; choose a broad area when an import is uncertain; verify full name/address/photo and edit/vote behavior.
3. Multiple allowed dates, preferred/exact time, duration, cancel; known-hours conflicts block and unknown hours remain nonblocking; manual timeline edit and map link; protected flight remains fixed.
4. Export instructions to the external AI of choice; paste raw or one fenced PLAN-TEXT-V1. Verify line errors preserve text and stale snapshots require regeneration.
5. Resolve or remove a new suggestion, verify preserved timing and canonical identity, Apply once, then Undo. No Trip changes occur merely from export/import/preview.

Public entry: https://trip-eddie23.vercel.app . Publication state must be verified separately against the exact Git SHA. A local memory/travel-app-v3-release.json receipt, if present, records the one release after metadata verification.
