// Shared deterministic planning limits; no model prompt, quota or response schema.
export const PLANNER_PERIOD_KEYS = ["early_morning", "morning", "noon", "afternoon", "evening", "late_night"];

// Same deterministic boundaries the client's POOL_PREFERRED_PERIOD_RANGES defines (inclusive).
export const PLANNER_PERIOD_RANGES = {
  early_morning: ["00:00", "05:59"],
  morning: ["06:00", "11:29"],
  noon: ["11:30", "13:29"],
  afternoon: ["13:30", "17:29"],
  evening: ["17:30", "21:59"],
  late_night: ["22:00", "23:59"],
};

export const PLANNER_PERIOD_LABELS = { early_morning: "凌晨", morning: "上午", noon: "中午", afternoon: "下午", evening: "晚上", late_night: "深夜" };

// Hard daily maximum (never a target): at most this many Place stops per trip day, existing itinerary Places included.
export const PLANNER_DAILY_CAPACITY = 5;
export const PLANNER_MIN_DURATION = 30;
export const PLANNER_MAX_DURATION = 240;
export const PLANNER_DURATION_STEP = 15;
// Extended local timeline of one trip day for opening-hours windows: the latest legal start
// (23:59) plus the longest visit. Minutes past 1440 are the next day's early hours; this only
// describes existing item semantics and adds no day-boundary rule.
export const PLANNER_DAY_HORIZON = 24 * 60 + PLANNER_MAX_DURATION;
export const PLANNER_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
