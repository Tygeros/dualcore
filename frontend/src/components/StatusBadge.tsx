import type { Status } from "../types";

const STYLES: Record<Status, string> = {
  pending: "bg-neutral-700 text-neutral-300",
  in_progress: "bg-blue-900/60 text-blue-300",
  completed: "bg-emerald-900/60 text-emerald-300",
  canceled: "bg-red-900/60 text-red-300",
};

const LABELS: Record<Status, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  canceled: "Canceled",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
