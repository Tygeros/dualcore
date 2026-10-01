import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getCurrentProfile, getProjects, getTasks } from "../services";
import type { Profile, Project, Task } from "../types";
import StatusBadge from "../components/StatusBadge";
import Loading from "../components/Loading";

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [p, projs, tsks] = await Promise.all([
          getCurrentProfile(),
          getProjects(),
          getTasks(),
        ]);
        if (cancelled) return;
        setProfile(p);
        setProjects(projs);
        setTasks(tsks);
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
              Level {profile?.level ?? 0} · Commit{" "}
              {profile?.commit_points ?? 0} pts/day
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
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.name}</div>
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
