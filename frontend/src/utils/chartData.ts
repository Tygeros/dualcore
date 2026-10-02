import type { Project, Task, Status, Category, Level } from "../types";

export type RangeKey = "7d" | "30d" | "90d" | "12m";

export interface DayBucket {
  key: string; // YYYY-MM-DD or YYYY-Www or YYYY-MM
  label: string;
  date: Date;
  points: number;
  projectsCreated: number;
  tasksCreated: number;
  projectsCompleted: number;
  tasksCompleted: number;
  level: number;
  exp: number;
}

export interface HeatDay {
  key: string; // YYYY-MM-DD
  date: Date;
  points: number;
  created: number;
  completed: number;
}

export interface PieSlice {
  id: string | number;
  label: string;
  value: number;
  color: string;
}

const DONE: Status[] = ["completed", "canceled"];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  // date-only or ISO
  const d = new Date(s.length <= 10 ? s + "T12:00:00" : s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayLabel(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatMonthLabel(d: Date): string {
  return `${d.getMonth() + 1}/${d.getFullYear()}`;
}

function weekStart(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  x.setDate(x.getDate() + diff);
  return x;
}

function formatWeekLabel(d: Date): string {
  return `W${formatDayLabel(d)}`;
}

export function rangeStart(range: RangeKey, now = new Date()): Date {
  const d = startOfDay(now);
  if (range === "7d") {
    d.setDate(d.getDate() - 6);
  } else if (range === "30d") {
    d.setDate(d.getDate() - 29);
  } else if (range === "90d") {
    d.setDate(d.getDate() - 89);
  } else {
    d.setMonth(d.getMonth() - 11);
    d.setDate(1);
  }
  return d;
}

function bucketKey(d: Date, range: RangeKey): string {
  if (range === "12m") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  if (range === "90d") {
    return formatDay(weekStart(d));
  }
  return formatDay(d);
}

function bucketLabel(d: Date, range: RangeKey): string {
  if (range === "12m") return formatMonthLabel(d);
  if (range === "90d") return formatWeekLabel(weekStart(d));
  return formatDayLabel(d);
}

function bucketDate(d: Date, range: RangeKey): Date {
  if (range === "12m") return new Date(d.getFullYear(), d.getMonth(), 1);
  if (range === "90d") return weekStart(d);
  return startOfDay(d);
}

/** Fibonacci-like exp thresholds matching backend. */
export function expToNextLevel(level: number): number {
  if (level <= 1) return 10;
  let a = 10;
  let b = 10;
  for (let i = 2; i <= level; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return b;
}

export function applyExp(
  level: number,
  exp: number,
  bonus: number
): { level: number; exp: number } {
  if (bonus < 0) {
    return { level, exp: exp + bonus };
  }
  let refLevel = level;
  let refExp = exp + bonus;
  let threshold = expToNextLevel(refLevel);
  while (refExp >= threshold) {
    refExp -= threshold;
    refLevel += 1;
    threshold = expToNextLevel(refLevel);
  }
  return { level: refLevel, exp: refExp };
}

function emptyBucket(key: string, label: string, date: Date): DayBucket {
  return {
    key,
    label,
    date,
    points: 0,
    projectsCreated: 0,
    tasksCreated: 0,
    projectsCompleted: 0,
    tasksCompleted: 0,
    level: 0,
    exp: 0,
  };
}

/** Build ordered empty buckets covering the range. */
function buildTimeline(range: RangeKey, now = new Date()): DayBucket[] {
  const start = rangeStart(range, now);
  const end = startOfDay(now);
  const map = new Map<string, DayBucket>();
  const cursor = new Date(start);

  if (range === "12m") {
    while (cursor <= end) {
      const key = bucketKey(cursor, range);
      if (!map.has(key)) {
        map.set(key, emptyBucket(key, bucketLabel(cursor, range), bucketDate(cursor, range)));
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else if (range === "90d") {
    while (cursor <= end) {
      const key = bucketKey(cursor, range);
      if (!map.has(key)) {
        map.set(key, emptyBucket(key, bucketLabel(cursor, range), bucketDate(cursor, range)));
      }
      cursor.setDate(cursor.getDate() + 7);
    }
    // ensure current week
    const k = bucketKey(end, range);
    if (!map.has(k)) {
      map.set(k, emptyBucket(k, bucketLabel(end, range), bucketDate(end, range)));
    }
  } else {
    while (cursor <= end) {
      const key = bucketKey(cursor, range);
      map.set(key, emptyBucket(key, bucketLabel(cursor, range), bucketDate(cursor, range)));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function buildDashboardSeries(
  projects: Project[],
  tasks: Task[],
  range: RangeKey,
  currentLevel: number,
  currentExp: number
): DayBucket[] {
  const now = new Date();
  const start = rangeStart(range, now);
  const buckets = buildTimeline(range, now);
  const byKey = new Map(buckets.map((b) => [b.key, b]));

  // Created counts
  for (const p of projects) {
    const d = parseDate(p.created_at);
    if (!d || d < start) continue;
    const b = byKey.get(bucketKey(d, range));
    if (b) b.projectsCreated += 1;
  }
  for (const t of tasks) {
    const d = parseDate(t.created_at);
    if (!d || d < start) continue;
    const b = byKey.get(bucketKey(d, range));
    if (b) b.tasksCreated += 1;
  }

  // Completions + points (terminated_date)
  type Event = { date: Date; points: number; kind: "project" | "task"; status: Status };
  const events: Event[] = [];

  for (const p of projects) {
    if (!DONE.includes(p.status)) continue;
    const d = parseDate(p.terminated_date);
    if (!d) continue;
    const pts = p.final_points ?? 0;
    events.push({ date: d, points: pts, kind: "project", status: p.status });
    if (d >= start) {
      const b = byKey.get(bucketKey(d, range));
      if (b) {
        b.points += pts;
        if (p.status === "completed") b.projectsCompleted += 1;
      }
    }
  }
  for (const t of tasks) {
    if (!DONE.includes(t.status)) continue;
    const d = parseDate(t.terminated_date);
    if (!d) continue;
    const pts = t.final_points ?? 0;
    events.push({ date: d, points: pts, kind: "task", status: t.status });
    if (d >= start) {
      const b = byKey.get(bucketKey(d, range));
      if (b) {
        b.points += pts;
        if (t.status === "completed") b.tasksCompleted += 1;
      }
    }
  }

  // Reconstruct level timeline: replay all events chronologically from level 0
  // then align ending with current profile (snap end), fill buckets with level at end of bucket
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  let level = 0;
  let exp = 0;
  let ei = 0;
  for (const bucket of buckets) {
    const bucketEnd = new Date(bucket.date);
    if (range === "12m") {
      bucketEnd.setMonth(bucketEnd.getMonth() + 1);
      bucketEnd.setMilliseconds(-1);
    } else if (range === "90d") {
      bucketEnd.setDate(bucketEnd.getDate() + 7);
      bucketEnd.setMilliseconds(-1);
    } else {
      bucketEnd.setHours(23, 59, 59, 999);
    }
    while (ei < events.length && events[ei].date <= bucketEnd) {
      const r = applyExp(level, exp, events[ei].points);
      level = r.level;
      exp = r.exp;
      ei += 1;
    }
    bucket.level = level;
    bucket.exp = exp;
  }

  // If reconstructed end differs from profile (e.g. daily commit bonus),
  // gently scale last point to currentLevel for display consistency
  if (buckets.length > 0 && currentLevel > 0) {
    const last = buckets[buckets.length - 1];
    if (last.level !== currentLevel) {
      // keep reconstructed path; only set final to current if no events in range
      if (events.filter((e) => e.date >= start).length === 0) {
        for (const b of buckets) {
          b.level = currentLevel;
          b.exp = currentExp;
        }
      } else {
        last.level = currentLevel;
        last.exp = currentExp;
      }
    }
  }

  return buckets;
}

/** Daily activity (points) for last `days` days — used by heatmap. */
export function buildHeatmapDays(
  projects: Project[],
  tasks: Task[],
  days = 100,
  now = new Date()
): HeatDay[] {
  const end = startOfDay(now);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  const map = new Map<string, HeatDay>();
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = formatDay(cursor);
    map.set(key, {
      key,
      date: new Date(cursor),
      points: 0,
      created: 0,
      completed: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const p of projects) {
    const created = parseDate(p.created_at);
    if (created && created >= start) {
      const b = map.get(formatDay(created));
      if (b) b.created += 1;
    }
    if (DONE.includes(p.status)) {
      const d = parseDate(p.terminated_date);
      if (d && d >= start) {
        const b = map.get(formatDay(d));
        if (b) {
          b.points += p.final_points ?? 0;
          if (p.status === "completed") b.completed += 1;
        }
      }
    }
  }
  for (const t of tasks) {
    const created = parseDate(t.created_at);
    if (created && created >= start) {
      const b = map.get(formatDay(created));
      if (b) b.created += 1;
    }
    if (DONE.includes(t.status)) {
      const d = parseDate(t.terminated_date);
      if (d && d >= start) {
        const b = map.get(formatDay(d));
        if (b) {
          b.points += t.final_points ?? 0;
          if (t.status === "completed") b.completed += 1;
        }
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}

const STATUS_LABELS: Record<Status, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  canceled: "Canceled",
};

const STATUS_COLORS: Record<Status, string> = {
  pending: "#737373",
  in_progress: "#38bdf8",
  completed: "#34d399",
  canceled: "#fb7185",
};

/** Count items by category (M2M ids). Uncategorized bucket if empty. */
export function countByCategory(
  items: { categories: number[] }[],
  categories: Category[]
): PieSlice[] {
  const counts = new Map<number, number>();
  let uncategorized = 0;
  for (const item of items) {
    const ids = item.categories ?? [];
    if (ids.length === 0) {
      uncategorized += 1;
      continue;
    }
    for (const id of ids) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  const slices: PieSlice[] = categories
    .filter((c) => (counts.get(c.id) ?? 0) > 0)
    .map((c) => ({
      id: c.id,
      label: c.name,
      value: counts.get(c.id) ?? 0,
      color: c.color || "#6366f1",
    }))
    .sort((a, b) => b.value - a.value);
  if (uncategorized > 0) {
    slices.push({
      id: "none",
      label: "Uncategorized",
      value: uncategorized,
      color: "#525252",
    });
  }
  return slices;
}

export function countByStatus(
  items: { status: Status }[]
): PieSlice[] {
  const order: Status[] = ["pending", "in_progress", "completed", "canceled"];
  const counts = new Map<Status, number>();
  for (const item of items) {
    counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
  }
  return order
    .filter((s) => (counts.get(s) ?? 0) > 0)
    .map((s) => ({
      id: s,
      label: STATUS_LABELS[s],
      value: counts.get(s) ?? 0,
      color: STATUS_COLORS[s],
    }));
}

/** Count by level FK (priority or difficulty). */
export function countByLevel(
  items: { priority?: number; difficulty?: number }[],
  levels: Level[],
  field: "priority" | "difficulty"
): PieSlice[] {
  const counts = new Map<number, number>();
  for (const item of items) {
    const id = item[field];
    if (id == null) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const palette = [
    "#38bdf8",
    "#a78bfa",
    "#fbbf24",
    "#34d399",
    "#fb7185",
    "#f97316",
    "#14b8a6",
    "#64748b",
  ];
  return levels
    .map((l, i) => ({
      id: l.id,
      label: l.name,
      value: counts.get(l.id) ?? 0,
      color: palette[i % palette.length],
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
}
