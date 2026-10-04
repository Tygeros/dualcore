import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getCurrentProfile,
  getProjects,
  getTasks,
  getTodayPoints,
  getCategories,
  getPriorityLevels,
  getDifficultyLevels,
} from "../services";
import type {
  Profile,
  Project,
  Task,
  TodayPoints,
  Category,
  Level,
} from "../types";
import StatusBadge from "../components/StatusBadge";
import Loading from "../components/Loading";
import {
  LineChart,
  BarChart,
  PieChart,
  Heatmap,
  HBarChart,
  COLORS,
} from "../components/charts/SimpleCharts";
import {
  buildDashboardSeries,
  buildHeatmapDays,
  countByCategory,
  countByStatus,
  countByLevel,
  type RangeKey,
} from "../utils/chartData";

const ACCENT: Record<string, string> = {
  pending: "border-l-neutral-500",
  in_progress: "border-l-sky-400",
  completed: "border-l-emerald-400",
  canceled: "border-l-rose-400",
};

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "12m", label: "12 months" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [today, setToday] = useState<TodayPoints | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Level[]>([]);
  const [difficulties, setDifficulties] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");

  useEffect(() => {
    let cancelled = false;

    async function load(showLoading = true) {
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const [p, projs, tsks, tp, cats, pris, diffs] = await Promise.all([
          getCurrentProfile(),
          getProjects(),
          getTasks(),
          getTodayPoints(),
          getCategories(),
          getPriorityLevels(),
          getDifficultyLevels(),
        ]);
        if (cancelled) return;
        setProfile(p);
        setProjects(projs);
        setTasks(tsks);
        setToday(tp);
        setCategories(cats);
        setPriorities(pris);
        setDifficulties(diffs);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load data");
        }
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    }

    load(true);

    // Refetch when tab becomes visible again (e.g. after completing a task
    // on another page) so Today points stay in sync.
    function onVisible() {
      if (document.visibilityState === "visible") {
        load(false);
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const series = useMemo(
    () =>
      buildDashboardSeries(
        projects,
        tasks,
        range,
        profile?.level ?? 0,
        profile?.exp ?? 0
      ),
    [projects, tasks, range, profile]
  );

  const pointsSeries = useMemo(
    () =>
      series.map((b) => ({
        label: b.label,
        value: Math.round(b.points * 10) / 10,
      })),
    [series]
  );

  const levelSeries = useMemo(
    () => series.map((b) => ({ label: b.label, value: b.level })),
    [series]
  );

  const activitySeries = useMemo(
    () =>
      series.map((b) => ({
        label: b.label,
        values: [
          b.projectsCreated,
          b.projectsCompleted,
          b.tasksCreated,
          b.tasksCompleted,
        ],
      })),
    [series]
  );

  const totalPointsInRange = useMemo(
    () => series.reduce((s, b) => s + b.points, 0),
    [series]
  );

  const heatDays = useMemo(
    () => buildHeatmapDays(projects, tasks, 100),
    [projects, tasks]
  );

  const heatCells = useMemo(
    () =>
      heatDays.map((d) => ({
        key: d.key,
        date: d.date,
        value: Math.round(d.points * 10) / 10,
        label:
          d.created || d.completed
            ? `${d.created} created · ${d.completed} done`
            : undefined,
      })),
    [heatDays]
  );

  const projectByCategory = useMemo(
    () => countByCategory(projects, categories),
    [projects, categories]
  );
  const taskByCategory = useMemo(
    () => countByCategory(tasks, categories),
    [tasks, categories]
  );
  const projectByStatus = useMemo(() => countByStatus(projects), [projects]);
  const taskByStatus = useMemo(() => countByStatus(tasks), [tasks]);

  const priorityBars = useMemo(() => {
    const pCounts = countByLevel(projects, priorities, "priority");
    const tCounts = countByLevel(tasks, priorities, "priority");
    const ids = new Set([
      ...pCounts.map((s) => s.id),
      ...tCounts.map((s) => s.id),
    ]);
    return priorities
      .filter((l) => ids.has(l.id))
      .map((l) => ({
        label: l.name,
        values: [
          {
            name: "Projects",
            value: pCounts.find((s) => s.id === l.id)?.value ?? 0,
            color: COLORS.sky,
          },
          {
            name: "Tasks",
            value: tCounts.find((s) => s.id === l.id)?.value ?? 0,
            color: COLORS.violet,
          },
        ],
      }));
  }, [projects, tasks, priorities]);

  const difficultyBars = useMemo(() => {
    const pCounts = countByLevel(projects, difficulties, "difficulty");
    const tCounts = countByLevel(tasks, difficulties, "difficulty");
    const ids = new Set([
      ...pCounts.map((s) => s.id),
      ...tCounts.map((s) => s.id),
    ]);
    return difficulties
      .filter((l) => ids.has(l.id))
      .map((l) => ({
        label: l.name,
        values: [
          {
            name: "Projects",
            value: pCounts.find((s) => s.id === l.id)?.value ?? 0,
            color: COLORS.amber,
          },
          {
            name: "Tasks",
            value: tCounts.find((s) => s.id === l.id)?.value ?? 0,
            color: COLORS.emerald,
          },
        ],
      }));
  }, [projects, tasks, difficulties]);

  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="p-4 text-red-400 text-sm">
        {error}
        <p className="mt-2 text-neutral-500">
          Check that the backend is running and CORS / VITE_API_URL are set.
        </p>
      </div>
    );
  }

  const activeProjects = projects.filter(
    (p) => p.status === "pending" || p.status === "in_progress"
  );
  const activeTasks = tasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  );
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const expPct =
    profile && profile.exp_threshold > 0
      ? Math.min(100, (profile.exp / profile.exp_threshold) * 100)
      : 0;

  const commit = today?.commit_points ?? profile?.commit_points ?? 0;
  const todayPts = today?.today_points ?? 0;
  const todayPct =
    commit > 0 ? Math.min(100, (todayPts / commit) * 100) : todayPts > 0 ? 100 : 0;
  const metCommit = todayPts >= commit && commit > 0;

  return (
    <div className="p-4 pb-24 space-y-6 max-w-3xl mx-auto">
      {/* Profile card */}
      <section className="rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-neutral-800 p-4 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {profile?.display_name ?? "User"}
            </h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Level {profile?.level ?? 0} · Commit {commit} pts/day
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-sky-400 tabular-nums">
              {profile?.exp?.toFixed(1) ?? 0}
            </div>
            <div className="text-xs text-neutral-500">
              / {profile?.exp_threshold ?? 0} EXP
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-neutral-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-400 transition-all"
            style={{ width: `${expPct}%` }}
          />
        </div>
      </section>

      {/* Today points */}
      <section className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
            Today
          </h2>
          <span className="text-xs text-neutral-500">
            {today?.date ?? "—"}
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div
              className={`text-2xl font-bold tabular-nums ${
                metCommit ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {todayPts.toFixed(1)}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              / {commit} commit pts
              {today && (today.tasks_count || today.projects_count) ? (
                <span>
                  {" "}
                  · {(today.projects_count ?? 0) + (today.tasks_count ?? 0)}{" "}
                  items done
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-sm text-neutral-400 tabular-nums">
            {todayPct.toFixed(0)}%
          </div>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-neutral-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              metCommit
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                : "bg-gradient-to-r from-amber-500 to-amber-400"
            }`}
            style={{ width: `${todayPct}%` }}
          />
        </div>
        {!metCommit && commit > 0 && (
          <p className="text-xs text-neutral-500 mt-2">
            {(commit - todayPts).toFixed(1)} pts left to hit today&apos;s commit.
          </p>
        )}
        {metCommit && (
          <p className="text-xs text-emerald-500/80 mt-2">
            Daily commit points reached.
          </p>
        )}
      </section>

      {/* Activity heatmap — last 100 days */}
      <section className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
            Activity
          </h2>
          <span className="text-[11px] text-neutral-500">100 days</span>
        </div>
        <p className="text-[11px] text-neutral-500 mb-3">
          Daily points from completed / canceled items (green = positive, red =
          negative)
        </p>
        <Heatmap days={heatCells} />
      </section>

      {/* Charts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
            Analytics
          </h2>
          <div className="flex rounded-xl border border-neutral-800 overflow-hidden bg-neutral-900/60">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setRange(opt.key)}
                className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  range === opt.key
                    ? "bg-sky-600 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Points over time */}
        <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-neutral-200">
              Points over time
            </h3>
            <span className="text-xs text-amber-400/90 font-medium tabular-nums">
              Σ {totalPointsInRange.toFixed(1)} pts
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mb-2">
            Points from projects/tasks completed or canceled in this period
          </p>
          <LineChart data={pointsSeries} color={COLORS.amber} />
        </div>

        {/* Level over time */}
        <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-neutral-200">
              Level over time
            </h3>
            <span className="text-xs text-violet-400 font-medium">
              Lv {profile?.level ?? 0}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mb-2">
            Estimated level from completion points (EXP replay)
          </p>
          <LineChart data={levelSeries} color={COLORS.violet} />
        </div>

        {/* Created / completed */}
        <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4">
          <h3 className="text-sm font-medium text-neutral-200 mb-1">
            Created &amp; completed
          </h3>
          <p className="text-[11px] text-neutral-500 mb-2">
            Projects and tasks created vs completed in this period
          </p>
          <BarChart
            data={activitySeries}
            series={[
              { name: "Proj created", color: COLORS.sky },
              { name: "Proj done", color: COLORS.emerald },
              { name: "Task created", color: COLORS.violet },
              { name: "Task done", color: COLORS.amber },
            ]}
          />
        </div>

        {/* By category */}
        <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4">
          <h3 className="text-sm font-medium text-neutral-200 mb-1">
            By category
          </h3>
          <p className="text-[11px] text-neutral-500 mb-3">
            Items tagged with each category (one item can count in multiple)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-neutral-400 text-center mb-2">
                Projects
              </div>
              <PieChart data={projectByCategory} />
            </div>
            <div>
              <div className="text-xs text-neutral-400 text-center mb-2">
                Tasks
              </div>
              <PieChart data={taskByCategory} />
            </div>
          </div>
        </div>

        {/* By status */}
        <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4">
          <h3 className="text-sm font-medium text-neutral-200 mb-1">
            By status
          </h3>
          <p className="text-[11px] text-neutral-500 mb-3">
            Current status distribution
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-neutral-400 text-center mb-2">
                Projects
              </div>
              <PieChart data={projectByStatus} />
            </div>
            <div>
              <div className="text-xs text-neutral-400 text-center mb-2">
                Tasks
              </div>
              <PieChart data={taskByStatus} />
            </div>
          </div>
        </div>

        {/* Priority & difficulty */}
        <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4">
          <h3 className="text-sm font-medium text-neutral-200 mb-1">
            Priority
          </h3>
          <p className="text-[11px] text-neutral-500 mb-3">
            Projects vs tasks by priority level
          </p>
          <HBarChart series={priorityBars} />
        </div>

        <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4">
          <h3 className="text-sm font-medium text-neutral-200 mb-1">
            Difficulty
          </h3>
          <p className="text-[11px] text-neutral-500 mb-3">
            Projects vs tasks by difficulty level
          </p>
          <HBarChart series={difficultyBars} />
        </div>
      </section>

      {/* Quick add */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/projects"
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-medium transition-all shadow-lg shadow-blue-900/30 active:scale-[0.98]"
        >
          <span className="text-lg leading-none">+</span>
          New Project
        </Link>
        <Link
          to="/tasks"
          className="flex items-center justify-center gap-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]"
        >
          <span className="text-lg leading-none">+</span>
          New Task
        </Link>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Projects" value={activeProjects.length} sub="active" />
        <StatCard label="Tasks" value={activeTasks.length} sub="active" />
        <StatCard label="Done" value={completedTasks.length} sub="tasks" />
      </section>

      {/* Recent projects */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
            Projects
          </h2>
          <Link
            to="/projects"
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
          >
            View all
          </Link>
        </div>
        {activeProjects.length === 0 ? (
          <p className="text-sm text-neutral-500">No active projects.</p>
        ) : (
          <ul className="space-y-2">
            {activeProjects.slice(0, 5).map((p) => (
              <li
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/tasks?project=${p.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/tasks?project=${p.id}`);
                  }
                }}
                className={`flex items-center justify-between gap-2 rounded-xl bg-neutral-900/70 border border-neutral-800 border-l-[3px] ${ACCENT[p.status]} px-3 py-2.5 cursor-pointer
                  hover:bg-neutral-800/60 hover:border-neutral-700 hover:shadow-md transition-all active:scale-[0.99]`}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate text-[14px]">{p.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    <span className="text-amber-400/90 font-medium">
                      {p.current_points?.toFixed(1)} pts
                    </span>
                    {p.due_date ? ` · due ${p.due_date}` : ""}
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent tasks */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
            Tasks
          </h2>
          <Link
            to="/tasks"
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
          >
            View all
          </Link>
        </div>
        {activeTasks.length === 0 ? (
          <p className="text-sm text-neutral-500">No active tasks.</p>
        ) : (
          <ul className="space-y-2">
            {activeTasks.slice(0, 8).map((t) => (
              <li
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  navigate(`/tasks?project=${t.project}&parent=${t.id}`)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/tasks?project=${t.project}&parent=${t.id}`);
                  }
                }}
                className={`flex items-center justify-between gap-2 rounded-xl bg-neutral-900/70 border border-neutral-800 border-l-[3px] ${ACCENT[t.status]} px-3 py-2.5 cursor-pointer
                  hover:bg-neutral-800/60 hover:border-neutral-700 hover:shadow-md transition-all active:scale-[0.99]`}
                style={{
                  marginLeft: Math.max(0, (t.task_level || 1) - 1) * 12,
                }}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate text-[14px]">
                    {(t.task_level || 1) > 1 && (
                      <span className="text-neutral-600 mr-1 text-xs">└</span>
                    )}
                    {t.name}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    L{t.task_level} ·{" "}
                    <span className="text-amber-400/90 font-medium">
                      {t.current_points?.toFixed(1)} pts
                    </span>
                    {t.due_date ? ` · due ${t.due_date}` : ""}
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="rounded-2xl bg-neutral-900/70 border border-neutral-800 p-3.5 text-center hover:border-neutral-700 transition-colors">
      <div className="text-2xl font-bold tabular-nums tracking-tight">{value}</div>
      <div className="text-xs text-neutral-400 mt-0.5">{label}</div>
      <div className="text-[10px] text-neutral-600">{sub}</div>
    </div>
  );
}
