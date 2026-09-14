# Place Interaction UX Polish — review gate, 2026-09-14

1. Worktree: `C:/Users/user/OneDrive/桌面/旅遊APP/travel-app/prototype/place-interaction-ux-polish`.
2. Branch: `feat/place-interaction-ux-polish`.
3. HEAD and locally recorded origin/main: `2a73af41d9637b2e356fdff63e73d109c6f7be40`. No fetch or production request was needed. Deployment main checkout is a different older HEAD; it was not used or changed.
4. Reconciliation: five unstaged modified files, no staged/untracked: app.js, styles.css, tests/helpers/phase-c-browser.mjs, tests/places-filters.test.mjs, tests/planning-geography-ux-refinement.test.mjs. Existing diff already contained shared nested footer, pending content input, three display terminology replacements, inline vote DOM update, pending vote settlement/rollback and viewport sizing. app.js syntax complete.
5. Interrupted work: no dedicated polish tests existed; some legacy tests still expected the old labels/inline buttons/Save consuming pending area input. Fresh initial full run: 672 tests, 666 pass, 6 fail. Prior log is not substituted for current validation. This continuation adds normalization at content draft Add, scopes restaurant input collapse, keeps the focused field above keyboard/footer, completes tests and cache version.
6. Final changed files: app.js; styles.css; index.html (app/CSS cache 20260914.2); tests/area-tags.test.mjs; tests/candidate-draft.test.mjs; tests/helpers/phase-c-browser.mjs; tests/lodging-editor.test.mjs; tests/place-identity.test.mjs; tests/places-filters.test.mjs; tests/planning-geography-ux-refinement.test.mjs. New: tests/place-interaction-ux-polish.test.mjs; tests/place-interaction-smoke.cjs; memory/place-interaction-ux-polish.md (this report). All unstaged. Canonical deployment memory was read; this review-pending memory update stays in the isolated worktree to avoid modifying the deployment directory.
7. Nested root cause: pending input was outside the editor draft while the whole-editor Save footer remained visible, causing pending text loss and misleading confirmation.
8. Shared model: session.nestedTag is null / restaurant / area / content. NORMAL shows Cancel/Save; nested shows only Cancel Add/Add Tag. Add moves input to draft, clears pending input and restores NORMAL. Cancel discards only pending input. Empty trimmed input disables Add. Existing normalization/limits retained. Enter cannot submit the whole editor; IME completion is protected.
9. All three types share begin/confirm/finish/sync helpers and one footer: areaTags, restaurantTags, contentTags.
10. Add Tag: 0 persistence calls, 0 API/network writes. VM request/storage invariants and real-browser intercepted network confirm this. Final parent Save retains the existing persistence contract.
11. Cancel Add closes editor: no. Existing draft changes remain.
12. Mobile: desktop Chromium/Edge 390x844 and compressed 390x390 viewport PASS for all three modes; focused input and nested footer remain visible, input focus and form identity retained. Small internal scroll adjustment keeps the active field above sticky actions; no editor reopen or reset to top. Real iPhone hardware/OS keyboard was not exercised and is not claimed as verified.
13. Old terminology in user-facing app.js/index.html/styles.css: 0. Four source comments still mention the old term; they are internal only.
14. New terminology: 主要地區 in dropdown, detail summary and advanced helper text. Tests describing that UI updated.
15. Favorite root cause: click called full render, reopened detail and emitted success toast, resetting detail scroll.
16. Favorite full detail render: no. Only favorite/voter/count/current-member controls change.
17. Favorite detail reopen: no; browser DOM identity assertion passed.
18. Scroll: VM 437 unchanged; real mobile DOM 653 unchanged across both on and off. No scroll container replacement.
19. Favorite success toast calls: 0.
20. Normal favorite toggle: exactly 1 existing /api/trip PUT per completed normal toggle, 2 for on then off. votes schema/membership/API unchanged.
21. Rapid toggles: existing 120ms debounce coalesces clicks before PUT into latest state (one PUT for pre-debounce double toggle). During an active PUT, pending latest state is saved afterward. Tested all four first/final PUT success/failure combinations; no count drift, stale visual state, detail reopen, or success toast. This preserves baseline debounce behavior rather than forcing one request for each sub-120ms click.
22. Failure rollback: restores active visual, aria-pressed, count, current-user voter indicator and state.votes. Undo snapshot is corrected. In-flight newer edits rebase rollback on acknowledged server state. Existing error toast retained.
23. Favorite geocode/details/photo/address/resolver calls: 0; normal browser toggle network delta consists only of two Trip PUTs. Tag Add network delta: 0.
24. Added Node tests (15, in place-interaction-ux-polish.test.mjs):
    1. area nested exclusive footer/empty/Add/Cancel/draft/no writes.
    2. restaurant same contract.
    3. content same contract.
    4. one footer pair, no adjacent actions, display terminology.
    5. content Add normalization/dedupe.
    6. Enter/IME cannot submit whole editor.
    7. visual viewport sizing preserves form/scroll.
    8. favorite on/off immediate controls, scroll, one PUT each, zero success toast/lookups.
    9. favorite-on failure rollback.
    10. favorite-off failure rollback.
    11. rapid first success/final success.
    12. rapid first success/final failure.
    13. rapid first failure/final success.
    14. rapid first failure/final failure.
    15. pre-debounce double toggle latest payload/no drift.
    Additional standalone browser smoke script (not counted as a Node test): three nested types, real layout/focus/input and footer bounds, draft-only Add and Cancel, normal footer, terminology, actual detail node/scroll and network count. Uses synthetic fixtures and intercepts every request; no production access.
25. Removed tests: 0. Renamed tests: 13 display wording-only title changes, 大地區 → 主要地區, exact resulting declarations listed below. Existing candidate pattern and lodging Save tests were updated to the new explicit Add contract without removal.
26. Exact accounting: 672 + 15 added - 0 removed = 687 tests; 39 + 1 = 40 .test.mjs files. 13 title changes do not affect totals. Standalone .cjs smoke is separate.
27. Targeted polish: 15/15 pass, 0 fail.
28. Planning Geography UX refinement + places filters: 34/34 pass, 0 fail; four dropdown cascade, restaurant conditional, Canonical Area internal-only, locality-only area tags and grouping retained.
29. Phase B/C related: 151/151 pass across planning-geography, planning-geography-phase-c, canonical-area-hydration, canonical-area-migration-runtime, canonical-area-scheduler-gate.
30. Phase A safety: 18/18 pass, including derived locked fingerprints.
31. Final full regression: 687/687 pass, 0 fail, 0 skipped/cancelled/todo.
32. PRE unchanged: `1310fa0cb5086a07cbb7836022272f9113addfb1405f0f279bcdb1959616825f`.
33. POST unchanged: `dd2d0b930e7ed42da9a2c7389f44abe1c0de018b0af6c15ac2c35a949eeb6893`.
34. API functions: 12. lib/api/data have zero diff against HEAD; migration, manifest, catalog, taxonomy/schema and ambiguity contract untouched.
35. JS syntax: node --check app.js and new test/smoke scripts PASS. Full tests parse all changed test files.
36. git diff --check PASS. No .gitattributes/core.autocrlf changes or new line-ending-dependent source slicing.
37. Production untouched: deployment directory and its existing WIP not edited, no production App/network calls. Old AI家教 copies untouched.
38. No commit, push or deploy; no reset/stash/clean/rebase/merge/checkout. Ownership mismatch addressed with per-command safe.directory only, no global Git config change.
39. Place Interaction UX Polish Gate PASSED for the automated regression and local mobile viewport gate. Real iPhone keyboard verification remains an explicit validation limit, not a claimed device test.
40. STOP before commit. Await review.

## Renamed test declarations (wording only)

- `test('selected chip styling is shared with categories; detail has primary tags and a secondary 主要地區 summary',()=>{`
- `test("detail promotes manual areaTags, shows the 主要地區 summary instead of Canonical Area, and shows content tags as typed chips with independent category/description", () => {`
- `test("主要地區 choices use Planning Geography sections with stable sectionKey identity and include unresolved sections under all", () => {`
- `test("地點類別 → 主要地區 → 餐廳類別 cascade: hidden category resets, stale selections reset and nothing is resurrected", () => {`
- `test("category options derive from the selected 主要地區 only and reset unavailable selection", () => {`
- `test('UX dropdowns: the list renders 地點類別, 主要地區, 地區標籤 and 餐廳類別 as labelled single-select dropdowns without chip filters', async () => {`
- `test('主要地區 options use sectionKey identity and sectionLabel in list order, never grouped Canonical Areas', async () => {`
- `test('Canonical Area still drives the 主要地區 section and list grouping is unchanged', async () => {`
- `test('Place detail shows 主要地區 as its geography summary, typed tags, and never Canonical Area or source metadata', async () => {`
- `test('changing 主要地區 clears an incompatible 地區標籤 and preserves a compatible one', async () => {`
- `test('地點類別 is an upstream condition for 主要地區 and 地區標籤 options', async () => {`
- `test('Phase C same-parent ambiguity matches its shared 主要地區 without treating a candidate as identity', async () => {`
- `test('Phase C cross-parent ambiguity keeps its runtime candidates section and never joins a wrong 主要地區', async () => {`

## Evidence and local rerun

Logs at workspace root: place-polish-resume-targeted.log, place-polish-planning-ux.log, place-polish-phase-bc.log, place-polish-phase-a.log, place-polish-resume-full.log.
Browser artifacts at workspace root: place-polish-mobile-result.json, place-polish-mobile-nested.png, place-polish-mobile-normal.png.

Run from this isolated worktree: `node --test tests/*.test.mjs`.
For standalone smoke, expose the installed Playwright package through NODE_PATH and run `node tests/place-interaction-smoke.cjs`; POLISH_SMOKE_OUTPUT optionally chooses the evidence directory. It uses headless local Edge and a fully intercepted loopback origin, not a live backend.
