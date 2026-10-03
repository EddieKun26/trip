# Travel workspace layout refresh — 2026-10-03

The user reported crowded layouts, unclear page allocation and common functions buried too deeply. This change uses the installed Product Design audit workflow and the existing vanilla JavaScript/CSS implementation.

## Result

- Five permanent destinations: 旅程、地圖、行程、地點、採買. Overview/member/flight information and private Shopping are directly accessible.
- Desktop Places and Itinerary each occupy their own focused page. Map has its own canvas and a separate 350px results column. Mobile retains a compact map sheet (28% initial height) with explicit expand/collapse controls.
- Places exposes Add, name/address/area search, canonical broad-area selection and category filtering before the list. AI planning is an explicit upper-page action; optional legacy regional/tag filters remain advanced.
- Place detail initially shows information, navigation, votes, hours, contact information and notes. Its visible “安排行程” control opens a separate date/time/duration pane. Timeline time editing opens that pane directly. AI multi-date constraints remain optional and retain their expanded state during edits.
- Unsaved scheduling values and notes survive switching detail panes. Cancel does not write. Known opening windows still validate the entire visit and disable an invalid save. Existing atomic Apply, revision conflict protection, Undo and stable Place identity are retained.
- Shopping's three creation methods move above its summary and filters. Overview, Shopping and timeline spacing and text are expanded; narrow screens stack controls. Restaurant reservation remains an orange fixed-height button directly below the phone card at the same width.

## Validation

- Canonical source: `travel-app/prototype/workspace-layout-refresh`, based on released main `d5620726b16070ffa2a44b8a6c0af774ed4b808a`.
- Deployment mirror: `trip-deploy-layout-refresh`, branch `feat/workspace-layout-refresh`. Existing dirty worktrees were preserved.
- Full regression: **905/905**, zero failures, cancellations or skips. JavaScript syntax checks pass. Eight new fake-DOM interaction tests exercise the shipped renderer and event handlers. Existing presentation assertions now reflect five destinations and focused desktop pages.
- Only frontend presentation, corresponding tests and project memory change. API function count remains 12. Backend, schemas, migration, geometry, map adapters and network persistence contracts are unchanged.
- No live App/browser/computer UI automation or production data edits. These checks establish interaction and source correctness; device-level visual acceptance remains with the user under the existing project restriction.
- Source changes are validated before mirroring. Git main deployment and exact-commit Vercel production READY/alias verification are recorded in the local post-release receipt.
