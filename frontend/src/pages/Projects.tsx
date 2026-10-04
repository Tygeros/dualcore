import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getPriorityLevels,
  getDifficultyLevels,
  getCategories,
} from "../services";
import type {
  Project,
  Level,
  Status,
  ProjectCreatePayload,
  Category,
} from "../types";
import StatusBadge from "../components/StatusBadge";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import CategoryPicker from "../components/CategoryPicker";
import CategoryBadges from "../components/CategoryBadges";
import CategoryManager from "../components/CategoryManager";
import { localDateString } from "../utils/date";

const STATUS_OPTIONS: Status[] = [
  "pending",
  "in_progress",
  "completed",
  "canceled",
];

const ACCENT: Record<Status, string> = {
  pending: "border-l-neutral-500",
  in_progress: "border-l-sky-400",
  completed: "border-l-emerald-400",
  canceled: "border-l-rose-400",
};

const ACCENT_BG: Record<Status, string> = {
  pending: "hover:bg-neutral-800/50",
  in_progress: "hover:bg-sky-950/30",
  completed: "hover:bg-emerald-950/20",
  canceled: "hover:bg-rose-950/20",
};

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [priorities, setPriorities] = useState<Level[]>([]);
  const [difficulties, setDifficulties] = useState<Level[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<ProjectCreatePayload>({
    name: "",
    description: "",
    priority: 0,
    difficulty: 0,
    status: "pending",
    due_date: null,
    categories: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params =
        filterCategory !== "" ? { category: filterCategory } : undefined;
      const [projs, pris, diffs, cats] = await Promise.all([
        getProjects(params),
        getPriorityLevels(),
        getDifficultyLevels(),
        getCategories(),
      ]);
      setProjects(projs);
      setPriorities(pris);
      setDifficulties(diffs);
      setCategories(cats);
      setForm((f) => ({
        ...f,
        priority:
          f.priority ||
          pris.find((p) => p.coefficient === 1)?.id ||
          pris[0]?.id ||
          0,
        difficulty:
          f.difficulty ||
          diffs.find((d) => d.coefficient === 1)?.id ||
          diffs[0]?.id ||
          0,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    load();
  }, [load]);

  async function reloadCategories() {
    const cats = await getCategories();
    setCategories(cats);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.priority || !form.difficulty) return;
    setSubmitting(true);
    try {
      await createProject({
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || "",
        due_date: form.due_date || null,
        categories: form.categories || [],
      });
      setShowForm(false);
      setForm((f) => ({
        ...f,
        name: "",
        description: "",
        status: "pending",
        due_date: null,
        categories: [],
      }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: number, status: Status) {
    try {
      const payload: Partial<{ status: Status; terminated_date: string | null }> =
        { status };
      if (status === "completed" || status === "canceled") {
        // Local calendar date (not UTC) so it matches backend timezone.localdate()
        payload.terminated_date = localDateString();
      } else {
        payload.terminated_date = null;
      }
      await updateProject(id, payload);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa project này?")) return;
    try {
      await deleteProject(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function levelName(list: Level[], id: number) {
    return list.find((l) => l.id === id)?.name ?? `#${id}`;
  }

  function openProjectTasks(id: number) {
    navigate(`/tasks?project=${id}`);
  }

  if (loading && projects.length === 0) return <Loading />;

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Projects</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium shadow-lg shadow-blue-900/30 transition-all active:scale-[0.98]"
        >
          {showForm ? "Cancel" : "+ New"}
        </button>
      </div>

      <CategoryManager categories={categories} onChange={reloadCategories} />

      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
          value={filterCategory}
          onChange={(e) =>
            setFilterCategory(e.target.value === "" ? "" : Number(e.target.value))
          }
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4 space-y-3 shadow-xl shadow-black/20"
        >
          <input
            className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-colors"
            placeholder="Project name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <textarea
            className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 min-h-[72px] transition-colors"
            placeholder="Description"
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <CategoryPicker
            categories={categories}
            selected={form.categories || []}
            onChange={(ids) => setForm({ ...form, categories: ids })}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-neutral-400 space-y-1 block">
              Priority
              <select
                className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-white"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: Number(e.target.value) })
                }
              >
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (×{p.coefficient})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-neutral-400 space-y-1 block">
              Difficulty
              <select
                className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-white"
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: Number(e.target.value) })
                }
              >
                {difficulties.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (×{d.coefficient})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-neutral-400 space-y-1 block">
              Status
              <select
                className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-white"
                value={form.status || "pending"}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as Status })
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-neutral-400 space-y-1 block">
              Due date
              <input
                type="date"
                className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-white"
                value={form.due_date || ""}
                onChange={(e) =>
                  setForm({ ...form, due_date: e.target.value || null })
                }
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium shadow-lg shadow-blue-900/20 transition-all"
          >
            {submitting ? "Creating..." : "Create project"}
          </button>
        </form>
      )}

      {projects.length === 0 ? (
        <EmptyState
          title="Chưa có project nào"
          description="Tạo project đầu tiên để bắt đầu."
        />
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => openProjectTasks(p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openProjectTasks(p.id);
                }
              }}
              className={`group relative rounded-2xl border border-neutral-800/80 border-l-[3px] ${ACCENT[p.status]} bg-neutral-900/70 p-4 cursor-pointer
                ${ACCENT_BG[p.status]} hover:border-neutral-700 hover:shadow-lg hover:shadow-black/30
                active:scale-[0.995] transition-all duration-200`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[15px] tracking-tight truncate group-hover:text-white transition-colors">
                    {p.name}
                  </h3>
                  {p.description && (
                    <p className="text-sm text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                  <CategoryBadges
                    categoryIds={p.categories || []}
                    categories={categories}
                    className="mt-2"
                  />
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2.5 text-[11px] text-neutral-500">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-neutral-800/80 text-neutral-400">
                      {levelName(priorities, p.priority)}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-neutral-800/80 text-neutral-400">
                      {levelName(difficulties, p.difficulty)}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400/90 font-medium">
                      {p.current_points?.toFixed(1)} pts
                    </span>
                    {p.due_date && (
                      <span className="text-neutral-500">due {p.due_date}</span>
                    )}
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div
                className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-neutral-800/60"
                onClick={(e) => e.stopPropagation()}
              >
                <select
                  className="rounded-lg bg-neutral-950/80 border border-neutral-700/80 px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                  value={p.status}
                  onChange={(e) =>
                    handleStatusChange(p.id, e.target.value as Status)
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="ml-auto text-xs text-rose-400/80 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-950/40 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
