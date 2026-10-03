# Travel App V3 preflight — 2026-10-02

Implementation completed: see [integrated Engineering Gate](travel-app-v3-engineering-gate.md). All statements below describe the historical preflight.

Status: **RESOLVED by user on 2026-10-02**: option 1, one confirmed canonical area; familiar broad areas are sufficient (上野、原宿、新宿、代代木). The evidence below is historical preflight, not a current blocker or an Engineering Gate pass.

## Isolation

- Required fetch completed successfully. Authoritative `origin/main` and new worktree HEAD: `d286c15fe12658072ca6bc36c451d6992e832e45`.
- New worktree: `C:/Users/user/OneDrive/桌面/旅遊APP/travel-app-v3`; branch: `feat/travel-app-v3`.
- No older working files/indexes changed. No production data, deployment, browser or App UI operation.

## Evidence and decision boundary

The V3 request explicitly says: “If existing semantics truly cannot choose multiple legitimate areas and product decision required, HARD STOP.”

1. `lib/planning-region.mjs`, `resolveJapan`, explicitly rejects `恵比寿西`, `惠比壽西`, and `Ebisunishi` with `AMBIGUOUS_EBISU_DAIKANYAMA`. Synthetic Google-shaped components containing `恵比寿西` at `sublocality_level_2`, `渋谷区` at `locality`, and country JP reproduce an empty canonical key. Existing tests expressly preserve this behavior.
2. A separate, reliable same-level exact-label tie (`恵比寿` and `代官山`, both `neighborhood`) produces the existing valid automatic state `travelAreaCandidateKeys: ['ebisu', 'daikanyama']`, `travelAreaResolutionStatus: 'ambiguous'`, empty singular key. `PlanningGeography.getPlacePlanningGeography` accepts it with `primaryAreaKey: null` and group `shibuya-harajuku-ebisu`. This is established semantics, not malformed data or evidence that all Ebisunishi belongs to both areas.
3. The checked-in verified Ebisu, Daikanyama and Shibuya polygons each explicitly state: “Verified core coverage is partial; union is not an official tourism perimeter.” Existing pure containment helpers return Ebisu at synthetic `[35.643,139.709]` and Daikanyama at `[35.649,139.699]`; a separate synthetic fixture coordinate `[35.6428156,139.6972423]` hits none of these three. These are repository test coordinates, not production observations, and the last point is not evidence of an actual Ebisunishi business address. Unique verified containment can resolve some records; it cannot define the product treatment of missing/tied evidence.
4. The catalog's `shibuya` is the existing travel-area identity with partial core geometry. Treating any Google `渋谷区` as that travel area would choose a broader fallback policy rather than establish a unique Ebisu/Daikanyama identity. No such new policy was invented.
5. The ingestion integrity defect is independent and confirmed in source: `app.js` `importCanBeAdded` checks candidate eligibility/selection/duplicate business identity, not canonical geography completeness. The batch submit finalizes candidates then pushes additions and persists. `api/trip.mjs` PUT calls `PlanningGeography.normalizePlace`, which validates candidate-state consistency but permits ordinary unresolved records. The implementation must close both boundaries after the admissible geography states are decided.

## Minimal pending product decision

Recommended: require one canonical area at import. Resolve only from reliable existing rules/unique verified evidence; otherwise keep the candidate unpersisted and ask the user to confirm one existing canonical area through the existing manual-area mechanism. Do not silently choose a candidate, invent an area, or persist unclassified geography.

Alternative: retain reliable multiple-canonical-candidate geography as import eligible and render it once under a combined canonical heading; genuinely unresolved evidence remains blocked. This preserves Phase C's current valid ambiguity contract but does not provide one singular canonical key.

No decision is implied by the recommendation. The user's answer is required before changing this contract. No legacy migration has been established as necessary; no production dataset was inspected. Any future legacy repair requires evidence and a safe plan, never automatic execution in this task.

## Verification actually performed

From this worktree:

```powershell
node --test --test-name-pattern='unsafe candidate resolution|no reliable candidate|new resolver keeps|split uses evidence|ambiguous Ebisu' tests/planning-geography.test.mjs tests/planning-geography-phase-c.test.mjs tests/travel-area-audit.test.mjs
```

Result: 5 tests, 5 passed, 0 failed, 0 skipped. These establish baseline behavior only; they do not validate V3.

- Pure resolver/normalization and checked-in polygon probes: reproduced the evidence above.
- `api/*.mjs`: exactly 12; unchanged.
- Product implementation files: unchanged.
- Full regression / integrated Engineering Gate: not run because the integrated V3 tree does not exist yet.
- No claim of marker fix, accessibility audit, Planner AI removal, snapshot/parser, or production readiness.
- Production release: not attempted; Vercel metadata not queried.

## Resume

Apply the user's geography decision, then continue the full integrated A–E task in this worktree. Keep all UI interaction reserved for the user. Existing native JS, Google OverlayView/Leaflet, structured-hours sidecar, deterministic validator, atomic Apply and Undo are available to evolve without a framework rewrite. The map audit also found explicit `pinOffsetX`/`pinOffsetY` addition in Google overlay projection and Leaflet icon anchors; this remains an unfixed V3 task, not a completed correction.

Run the complete Engineering Gate only after the integrated implementation is complete. Before release, fetch again and enforce the exact original `origin/main` baseline. No release has been consumed.
