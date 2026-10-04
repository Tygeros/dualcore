import type { Status } from "../types";

type Props = {
  status: Status;
  onChange: (status: Status) => void;
  className?: string;
};

const btnBase =
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Status workflow actions (no free-form selector):
 * - pending → Start (in_progress)
 * - in_progress → Complete | Cancel
 * - completed / canceled → no actions
 */
export default function StatusActions({ status, onChange, className = "" }: Props) {
  if (status === "pending") {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={() => onChange("in_progress")}
          className={`${btnBase} bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30 hover:bg-sky-500/25`}
          title="Start"
        >
          <PlayIcon />
          Start
        </button>
      </div>
    );
  }

  if (status === "in_progress") {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={() => onChange("completed")}
          className={`${btnBase} bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25`}
          title="Complete"
        >
          <CheckIcon />
          Complete
        </button>
        <button
          type="button"
          onClick={() => onChange("canceled")}
          className={`${btnBase} bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-500/25`}
          title="Cancel"
        >
          <XIcon />
          Cancel
        </button>
      </div>
    );
  }

  return null;
}
