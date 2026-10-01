import type { Status } from "../types";

const STYLES: Record<Status, string> = {
  pending: "bg-neutral-800/80 text-neutral-300 ring-1 ring-neutral-600/50",
  in_progress: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  canceled: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
};

const LABELS: Record<Status, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  canceled: "Canceled",
};

const DOT: Record<Status, string> = {
  pending: "bg-neutral-400",
  in_progress: "bg-sky-400",
  completed: "bg-emerald-400",
  canceled: "bg-rose-400",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${STYLES[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[status]}`} />
      {LABELS[status]}
    </span>
  );
}
