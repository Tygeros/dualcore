/** Local calendar date as YYYY-MM-DD (not UTC). */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD as local calendar date (noon avoids DST edge cases). */
export function parseLocalDate(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Whole calendar days from today to due (negative = overdue). */
export function daysUntilDue(dueDate: string | null | undefined, today = new Date()): number | null {
  const due = dueDate ? parseLocalDate(dueDate) : null;
  if (!due) return null;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
  return Math.round((due.getTime() - t.getTime()) / (24 * 60 * 60 * 1000));
}

export type DueKind =
  | "none"
  | "overdue"
  | "today"
  | "soon" // within SOON_DAYS inclusive, excluding today
  | "upcoming"
  | "done"; // item already completed/canceled — no urgency

export const DUE_SOON_DAYS = 3;

export function getDueKind(
  dueDate: string | null | undefined,
  status?: string,
  today = new Date()
): DueKind {
  if (!dueDate) return "none";
  if (status === "completed" || status === "canceled") return "done";
  const days = daysUntilDue(dueDate, today);
  if (days === null) return "none";
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= DUE_SOON_DAYS) return "soon";
  return "upcoming";
}

export function formatDueLabel(
  dueDate: string | null | undefined,
  status?: string,
  today = new Date()
): string | null {
  if (!dueDate) return null;
  const kind = getDueKind(dueDate, status, today);
  const days = daysUntilDue(dueDate, today);

  switch (kind) {
    case "overdue": {
      const n = days !== null ? Math.abs(days) : 0;
      return n === 1 ? "1 day overdue" : `${n} days overdue`;
    }
    case "today":
      return "Due today";
    case "soon":
      return days === 1 ? "Due tomorrow" : `Due in ${days} days`;
    case "upcoming":
      return `Due ${dueDate}`;
    case "done":
      return `Due was ${dueDate}`;
    default:
      return null;
  }
}
