import { formatDueLabel, getDueKind, type DueKind } from "../utils/date";

const STYLES: Record<Exclude<DueKind, "none">, string> = {
  overdue: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/35",
  today: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/35",
  soon: "bg-orange-500/12 text-orange-300 ring-1 ring-orange-500/30",
  upcoming: "bg-neutral-800/80 text-neutral-400 ring-1 ring-neutral-600/40",
  done: "bg-neutral-800/50 text-neutral-500 ring-1 ring-neutral-700/40",
};

const DOT: Record<Exclude<DueKind, "none">, string> = {
  overdue: "bg-rose-400",
  today: "bg-amber-400",
  soon: "bg-orange-400",
  upcoming: "bg-neutral-500",
  done: "bg-neutral-600",
};

type Props = {
  dueDate: string | null | undefined;
  status?: string;
  className?: string;
  /** Show short date only when kind is upcoming/done (default true via formatDueLabel). */
  compact?: boolean;
};

export default function DueBadge({ dueDate, status, className = "" }: Props) {
  const kind = getDueKind(dueDate, status);
  if (kind === "none") return null;

  const label = formatDueLabel(dueDate, status);
  if (!label) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium tracking-wide ${STYLES[kind]} ${className}`}
      title={dueDate ? `Due date: ${dueDate}` : undefined}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[kind]}`} />
      {label}
    </span>
  );
}
