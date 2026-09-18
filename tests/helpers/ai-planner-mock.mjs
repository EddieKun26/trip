// Deterministic stand-in for the model: builds a hard-valid plan for a planner context so tests
// and the eval harness's --mock mode never need a real OpenAI call.
import { PLANNER_PERIOD_RANGES } from "../../lib/ai-trip-planner-schema.mjs";

export function mockValidPlan(context, { softPerDay = 1, durationMinutes = 90 } = {}) {
  const days = new Map(context.days.map((day) => [day.dayKey, []]));
  const used = new Map(context.days.map((day) => [day.dayKey, 0]));
  const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  // Occupied starts (existing items without a duration only block their exact start) and windows.
  const starts = new Map(context.days.map((day) => [day.dayKey, new Set((context.existingByDay.get(day.dayKey) || []).map((item) => item.time).filter(Boolean))]));
  const windows = new Map(context.days.map((day) => [day.dayKey, (context.existingByDay.get(day.dayKey) || [])
    .filter((item) => item.time && Number.isInteger(item.durationMinutes)).map((item) => [toMinutes(item.time), toMinutes(item.time) + item.durationMinutes])]));
  // Known opening hours (Phase 2A.5): the whole visit must sit inside one of that day's windows.
  const open = (candidate, dayKey, start) => {
    const hours = candidate?.openingWindows?.[dayKey];
    return !hours || hours.some((window) => window.startMinute <= start && start + durationMinutes <= window.endMinute);
  };
  const free = (dayKey, start, candidate) => start + durationMinutes <= 24 * 60 && !starts.get(dayKey).has(toTime(start))
    && windows.get(dayKey).every(([a, b]) => !(start < b && a < start + durationMinutes)) && open(candidate, dayKey, start);
  const nextFree = (dayKey, from, candidate) => {
    for (let minutes = toMinutes(from); minutes + durationMinutes <= 24 * 60; minutes += 15) if (free(dayKey, minutes, candidate)) return toTime(minutes);
    return null;
  };
  const place = (candidate, dayKey, time) => {
    starts.get(dayKey).add(time);
    windows.get(dayKey).push([toMinutes(time), toMinutes(time) + durationMinutes]);
    used.set(dayKey, used.get(dayKey) + 1);
    days.get(dayKey).push({ candidateRef: candidate.ref, startTime: time, durationMinutes });
  };
  const required = context.candidates.filter((candidate) => candidate.required);
  // Exact anchors first so a free Place never takes an anchored slot.
  required.sort((a, b) => Number(b.dateOptions.some((option) => option.mode === "exact")) - Number(a.dateOptions.some((option) => option.mode === "exact")));
  for (const candidate of required) {
    const options = candidate.dateOptions.length ? candidate.dateOptions : context.days.map((day) => ({ dayKey: day.dayKey, mode: "none" }));
    for (const option of options) {
      if (used.get(option.dayKey) >= context.capacityByDay.get(option.dayKey)) continue;
      const time = option.mode === "exact" ? (free(option.dayKey, toMinutes(option.exactTime), candidate) ? option.exactTime : null)
        : nextFree(option.dayKey, option.mode === "preferred" ? PLANNER_PERIOD_RANGES[option.preferredPeriods[0]][0] : "10:00", candidate)
          ?? nextFree(option.dayKey, "00:00", candidate);
      if (time) { place(candidate, option.dayKey, time); break; }
    }
  }
  for (const day of context.days) {
    let added = 0;
    for (const candidate of context.candidates.filter((entry) => !entry.required)) {
      if (added >= softPerDay || used.get(day.dayKey) >= context.capacityByDay.get(day.dayKey)) break;
      if ([...days.values()].flat().some((item) => item.candidateRef === candidate.ref)) continue;
      const time = nextFree(day.dayKey, "13:00", candidate);
      if (!time) continue;
      place(candidate, day.dayKey, time);
      added += 1;
    }
  }
  return { days: [...days].map(([dayKey, items]) => ({ dayKey, items })) };
}

export function responsesPayload(plan, { status = "completed", usage = { input_tokens: 1200, output_tokens: 800, output_tokens_details: { reasoning_tokens: 500 } } } = {}) {
  return {
    id: "resp_mock",
    model: "mock-planner",
    status,
    usage,
    output: [{ type: "message", content: [{ type: "output_text", text: typeof plan === "string" ? plan : JSON.stringify(plan) }] }],
  };
}
