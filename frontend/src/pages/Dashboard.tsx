import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getCurrentProfile,
  getProjects,
  getTasks,
  getTodayPoints,
} from "../services";
import type { Profile, Project, Task, TodayPoints } from "../types";
import StatusBadge from "../components/StatusBadge";
import Loading from "../components/Loading";

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [today, setToday] = useState<TodayPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [p, projs, tsks, tp] = await Promise.all([
          getCurrentProfile(),
          getProjects(),
          getTasks(),
          getTodayPoints(),
        ]);
        if (cancelled) return;
        setProfile(p);
        setProjects(projs);
        setTasks(tsks);
        setToday(tp);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="p-4 text-red-400 text-sm">
        {error}
        <p className="mt-2 text-neutral-500">
          Kiểm tra backend đang chạy và CORS / VITE_API_URL.
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
      <section className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">
              {profile?.display_name ?? "User"}
            </h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Level {profile?.level ?? 0} · Commit {commit} pts/day
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-blue-400">
              {profile?.exp?.toFixed(1) ?? 0}
            </div>
            <div className="text-xs text-neutral-500">
              / {profile?.exp_threshold ?? 0} EXP
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-neutral-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${expPct}%` }}
          />
        </div>
      </section>

      {/* Today points */}
      <section className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
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
              className={`text-2xl font-bold ${
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
          <div className="text-sm text-neutral-400">
            {todayPct.toFixed(0)}%
          </div>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-neutral-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              metCommit ? "bg-emerald-500" : "bg-amber-500"
            }`}
            style={{ width: `${todayPct}%` }}
          />
        </div>
        {!metCommit && commit > 0 && (
          <p className="text-xs text-neutral-500 mt-2">
            Còn {(commit - todayPts).toFixed(1)} pts để đạt commit hôm nay.
          </p>
        )}
        {metCommit && (
          <p className="text-xs text-emerald-500/80 mt-2">
            Đã đạt commit points hôm nay.
          </p>
        )}
      </section>

      {/* Quick add */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/projects"
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-medium transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          New Project
        </Link>
        <Link
          to="/tasks"
          className="flex items-center justify-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-4 py-3 text-sm font-medium transition-colors"
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
            Projects
          </h2>
          <Link
            to="/projects"
            className="text-xs text-blue-400 hover:text-blue-300"
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
                className="flex items-center justify-between gap-2 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-neutral-500">
                    {p.current_points?.toFixed(1)} pts
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
            Tasks
          </h2>
          <Link
            to="/tasks"
            className="text-xs text-blue-400 hover:text-blue-300"
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
                className="flex items-center justify-between gap-2 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2"
                style={{
                  marginLeft: Math.max(0, (t.task_level || 1) - 1) * 12,
                }}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {(t.task_level || 1) > 1 && (
                      <span className="text-neutral-600 mr-1">└</span>
                    )}
                    {t.name}
                  </div>
                  <div className="text-xs text-neutral-500">
                    L{t.task_level} · {t.current_points?.toFixed(1)} pts
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
    <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-3 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-neutral-400 mt-0.5">{label}</div>
      <div className="text-[10px] text-neutral-600">{sub}</div>
    </div>
  );
}
