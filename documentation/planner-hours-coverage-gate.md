# Phase 2A.6 engineering evidence

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
