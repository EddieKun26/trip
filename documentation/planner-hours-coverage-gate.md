# Phase 2A.6 engineering evidence

## Production-truth stabilization — 2026-09-22

- Starting functional release: `315cd49d6c6164933bbdf2dbb2d270379fd03693`. Diagnostic/reconciliation baseline: `dd178242407d74cd88e78010e0de7addd9b49ae4` (deployment `dpl_CbbZUerjmVqzJ8NcK3jeZVh2JitM`). Existing authoritative worktree/branch reused; no unrelated worktree touched.
- Existing uncorrelated logs were insufficient. After diagnostic-only deployment, USER supplied screenshots and generated correlated events at 05:28:37–05:29:25 UTC: selected direct Google ID matches server; candidate 9/24 exact 09:00; addressExcluded=true; hydrationRequired/Started=false; sidecar miss; no embedded data/windows; conflict computation ran but was not evaluable; main and drawer mounted without warning; summary empty and CTA enabled. Candidate date maps to Thursday, independent of active itinerary tab 9/20. No Plan submission observed. No claim is made that production Google returned known/unavailable; it was never called for this candidate.
- Cause: reuse of general Detail/address-refresh exclusion in hours-only eligibility. Previous mocks lacked the exclusion flags. Fix separates hours-only identity eligibility on both client and authenticated canonical-Place server path. General Detail protection untouched. Address flags are not hours identity evidence; direct current Google ID remains authoritative per approved contract.
- Before correction, four variants of the observed aggregate exclusion failed with 0 hydration requests instead of 1. After correction they pass a vertical non-GUI path: canonical serialized Place, actual selected state, 9/24 exact 09:00, mocked Google/Redis transports, real exact parser/field mask (`id,regularOpeningHours`), actual serialized API response, awaited sidecar write/batch read, UTC-safe server-normalized windows, active state, both render branches, summary and disabled CTA. Known conflict produces zero client Plan requests; independent server preflight rejects with modelCalls=0. Tests do not claim which private address flag or Google periods were observed in production.
- Known hours are the only hard source. Exact feasible start requires 30 continuous minutes; split, closed, overnight, 24/7 and close boundary semantics unchanged. Time picker retains immediate warning strategy. Legal time/date changes clear/recreate conflict without refetch; preferred periods remain soft. Known/unavailable cache, transient retry, identity mismatch, no-identity custom behavior, dedupe and concurrency 3 regressions pass.
- Unavailable exact result now shows persistent nonblocking 營業時間無法確認 in both selected surfaces; transient failure shows 營業時間暫時無法確認. No fake closed/open assumption. No display parser, business heuristics, timezone system, TTL or migration.
- Sidecar key remains `tokyo-family-trip:opening-hours:v1:<SHA-256(placeId)>`; record remains v/status/placeId/periods/fetchedAt only. Hydration leaves Trip bytes, revision, itinerary, ordinary serialization and actual Undo snapshot/baseline unchanged. Plan Google=0/Trip writes=0; Apply Google=0/OpenAI=0; canonical CAS/one-write/revision/Undo behavior retained.
- Temporary client snapshots/endpoint/module/exact observer removed, with their eight diagnostic tests. Eight functional regressions replace them. Existing safe hydration outcome and Planner result/model-count logs remain; no user content or identifiers.
- Focused gate: **138/138**. Final full regression: **931/931**, zero failures/skips. Syntax, diff whitespace, secret/privacy/artifact audit PASS. API count **12**. No migration, Trip-schema, model prompt/input/output, Apply architecture or Vercel duration diff. Full result capture repeated once after a Windows Unicode output-wrapper error; no implementation failure.
- Frozen PRE `1310fa0cb5086a07cbb7836022272f9113addfb1405f0f279bcdb1959616825f`; POST `dd2d0b930e7ed42da9a2c7389f44abe1c0de018b0af6c15ac2c35a949eeb6893`; source/manifest unchanged and regression PASS.
- ENGINEERING_GATE=PASS. MODEL_GENERATION_CONTRACT_CHANGED=NO. REAL_LUNA_REEVAL_REQUIRED=NO. PRODUCTION_ACCEPTANCE=PENDING USER. USER_UI_SMOKE_REQUIRED=YES. Phase 2A.6 NOT COMPLETE. Agent production App data writes/UI operation=NO; no real Google/Luna engineering test. Map/Discovery/Planner V2/External AI NOT STARTED.
- USER acceptance: select a known Google candidate at 9/24 exact 09:00 without opening Detail. Known illegal => visible conflict + blocked Planner; exact unavailable or transient failure => clear nonblocking notice. If known, legal time clears warning and restoring illegal time recreates it without another Google fetch. Weekly regular hours still do not guarantee holiday/temporary/seasonal exceptions; no freshness TTL.

## Historical initial sidecar release

Baseline: `2ee672ff6856cfb224be3911c09d90650d248cbe`; isolated worktree `planner-hours-coverage`, branch `feat/planner-hours-coverage`.

## Architecture

The previous exact Place Details path returned normalized periods, but hours-only Detail backfill persisted through the Trip PUT path. Saved Places are embedded in Trip, so that path increments Trip revision. The new path writes only a `regularOpeningPeriods` v1 value to existing Redis, keyed by `tokyo-family-trip:opening-hours:v1:<SHA-256(placeId)>`. The record itself carries placeId and is checked against the current identity. No Trip ID, selection, itinerary, notes, tags, photos or generic Place metadata is stored in the sidecar.

`resolveStructuredOpeningPeriods` chooses a valid matching sidecar record, then a valid matching embedded record, otherwise unknown. Plan and Apply use one batched `MGET` read and this overlay before opening-hours validation. A failed read falls back to embedded data. Apply restores the original Places array before its existing atomic CAS write. Plan has no Google calls or Trip writes; Apply has no Google or OpenAI calls. The model prompt, input contract, response schema and one-repair limit are unchanged.

The client starts hours hydration on Planner selection, shares same-place in-flight requests (including hours-only Detail), caps concurrency at three, and blocks Planner until selected attempts settle. Server auth checks membership and resolves the exact Saved Place ref; clients cannot submit periods for persistence. Exact successful usable periods become known; exact successful missing/unusable periods become unavailable. Transport, timeout, quota, server or Redis write failures never become unavailable. Client uses only server-returned metadata and excludes transient sidecar fields from ordinary Trip saves. Failed attempts are retry-eligible.

## Non-GUI gate

- Focused opening-hours, sidecar, Place Pool, Draft and Apply tests: 166/166.
- Full Node regression: 909/909; zero failures and zero skips.
- Changed JS/MJS `node --check`: pass. `git diff --check`: pass. API entry files: 12.
- Frozen PRE: `1310fa0cb5086a07cbb7836022272f9113addfb1405f0f279bcdb1959616825f`.
- Frozen POST: `dd2d0b930e7ed42da9a2c7389f44abe1c0de018b0af6c15ac2c35a949eeb6893`.
- No migration diff, model prompt/schema diff, real Google test or real Luna evaluation. Secret and generated artifact audit: pass.
- ENGINEERING_GATE=PASS. USER_UI_SMOKE_REQUIRED=YES. Agent App/browser UI operation: NO. Production App data touched by Agent: NO.

Weekly regular hours do not guarantee holiday, temporary or seasonal exceptions. There is no freshness TTL. Phase 2C Discovery is NOT IMPLEMENTED.
