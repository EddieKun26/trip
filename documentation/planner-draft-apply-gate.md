# Phase 2B engineering evidence

Baseline: `9461321360146a776792078e2279fdf8e10c7ff6`. Branch: `feat/planner-draft-apply`.
Source: `travel-app/prototype/planner-draft-apply`; isolated release worktree: `planner-draft-apply`.

## Implementation and invariants

- Client `placePoolPlanner.draft` is a clone of validated Preview, separate from canonical state. Manual edits set `draftDirty`; scrolling, opening editors and unchanged values do not. Preferences persistence is suppressed while Draft exists. Refresh discards Draft.
- Existing normal items display 原有行程; proposed Saved Places display AI 規劃; flights display 固定項目. Flights cannot change day/time/duration. Same-day flight reordering follows existing normal drag permission.
- Canonical ordering is per-day array order. Handle-only pointer drag changes that array without synthesizing time. Cross-day movement uses explicit date selection, preserving time and appending. No cross-day drag or ordering schema is introduced.
- Time reuses the existing HH:MM wheel and stable time sorting on confirmation. Duration displays 停留 X 分鐘. AI duration is 30–240 in 15-minute steps; existing positive integer durations up to 1440 are supported without guessing absent durations. Formal itinerary also displays stored duration.
- Footer primary 套用此行程; secondary 重新規劃; tertiary 修改規劃條件. Dirty Replan/conditions changes use an explicit discard dialog. Replan retains the original request snapshot, never hidden manual constraints.
- POST `/api/trip?id=…`: `{action:"applyPlan", expectedRevision, days:[{dayKey,items:[{ref,startTime,durationMinutes}]}]}`. Array position is ordering intent. Client names, coordinates, hours and other metadata are ignored.
- Existing refs are revision/day/index scoped and must resolve against the reloaded Trip. Saved Place refs use canonical keys. Existing records are cloned from canonical Trip; new records use canonical Saved Place name and server-created ID. Model candidateRef is not durable identity. No migration.
- Authentication/membership, revision, complete/unique valid days, complete original-item coverage, duplicate/unknown identities, time, duration, protected fields, canonical Place ambiguity, overlap and trusted structured opening hours are validated before persistence. Durationless items retain start-only collision semantics; no guessed intervals.
- Stale Apply returns HTTP 409 TRIP_STALE and preserves Draft. Correctable failures preserve Draft with persistent role=alert cards. OPENING_HOURS_CONFLICT renders 營業時間不符合 and separated canonical details. Unknown hours do not hard-fail. Apply does not enforce original preferred/exact/date selections or a five-stop manual cap.
- Redis EVAL compares revision and writes the complete candidate once. Successful Apply = one Trip SET + one revision increment. Read-only capability probe is not a persistence operation. No scripting => fail closed; no non-atomic fallback. Rejected Apply leaves Trip bytes unchanged; concurrent CAS conflict preserves the competing write.
- Existing one-level Undo snapshot is reused for the whole Apply. Undo sends one PUT with expectedRevision and requireAtomic, receives canonical state, increments revision once; stale Undo writes nothing. This is session-memory history and is lost on refresh, as before. No new history store.
- Plan remains no-write. Apply makes zero OpenAI/Google requests; test transport rejects all unexpected external requests. Preview enrichment changes only safe server response metadata, not model input/prompt/schema.

## Verification

- Focused Apply API + deterministic Draft UI logic: 44 tests passing.
- Full Node regression: 892 passing, 0 failures, 0 skipped (baseline 855).
- Coverage includes auth, identities, invalid edits, hours, protected flight, race-at-CAS, unavailable EVAL, one-write success, canonical GET reload, more than five manual stops, metadata forgery, one-operation Undo and stale Undo, no-write Draft edits, dirty confirmation, loading/double submit, preserved errors, footer and persistent structured error rendering.
- Full suite also covers normal itinerary/drag/time, Place Pool, Planner, geography, auth/identity, opening hours, migration/startup and existing Phase A/B/C regressions.
- Frozen PRE: `1310fa0cb5086a07cbb7836022272f9113addfb1405f0f279bcdb1959616825f`.
- Frozen POST: `dd2d0b930e7ed42da9a2c7389f44abe1c0de018b0af6c15ac2c35a949eeb6893`.
- Frozen manifest and model generation modules unchanged; API functions remain 12. No migration/config/model-retuning diff. Changed JS/MJS syntax and diff whitespace are checked before commit. Release staging excludes harnesses, logs, screenshots, credentials and unrelated work.

## Workflow and limitations

ENGINEERING_GATE is code/test/static/API based. USER_UI_SMOKE_REQUIRED=YES. Agent does not operate App/browser UI after the user's workflow correction; previous browser observations are historical evidence only. User owns one iPhone visual/gesture smoke after Git-triggered production READY. Production App data is not touched by Agent.

Draft and Undo are memory-only; refresh loses both. A network timeout can leave persistence outcome uncertain, so the UI asks for canonical reload. Known durations enable interval checks; absent durations are not fabricated. Cross-day dragging is not implemented; date selection performs day moves. Phase 2C Discovery / Tourist Recommendations is NOT IMPLEMENTED. MODEL_GENERATION_CONTRACT_CHANGED=NO; REAL_LUNA_REEVAL_REQUIRED=NO.
