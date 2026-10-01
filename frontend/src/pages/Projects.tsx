import { useCallback, useEffect, useState } from "react";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getPriorityLevels,
  getDifficultyLevels,
} from "../services";
import type { Project, Level, Status, ProjectCreatePayload } from "../types";
import StatusBadge from "../components/StatusBadge";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

const STATUS_OPTIONS: Status[] = [
  "pending",
  "in_progress",
  "completed",
  "canceled",
];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [priorities, setPriorities] = useState<Level[]>([]);
  const [difficulties, setDifficulties] = useState<Level[]>([]);
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
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projs, pris, diffs] = await Promise.all([
        getProjects(),
        getPriorityLevels(),
        getDifficultyLevels(),
      ]);
      setProjects(projs);
      setPriorities(pris);
      setDifficulties(diffs);
      // default form levels
      setForm((f) => ({
        ...f,
        priority: f.priority || pris.find((p) => p.coefficient === 1)?.id || pris[0]?.id || 0,
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      });
      setShowForm(false);
      setForm((f) => ({
        ...f,
        name: "",
        description: "",
        status: "pending",
        due_date: null,
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
      const payload: Partial<{ status: Status; terminated_date: string | null }> = {
        status,
      };
      if (status === "completed" || status === "canceled") {
        payload.terminated_date = new Date().toISOString().slice(0, 10);
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

  if (loading) return <Loading />;

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Projects</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium"
        >
          {showForm ? "Cancel" : "+ New"}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 space-y-3"
        >
          <input
            className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Project name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <textarea
            className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-blue-500 min-h-[72px]"
            placeholder="Description"
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-neutral-400 space-y-1 block">
              Priority
              <select
                className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-white"
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
                className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-white"
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
                className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-white"
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
                className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-white"
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
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium"
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
              className="rounded-xl bg-neutral-900 border border-neutral-800 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{p.name}</h3>
                  {p.description && (
                    <p className="text-sm text-neutral-400 mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-neutral-500">
                    <span>{levelName(priorities, p.priority)}</span>
                    <span>·</span>
                    <span>{levelName(difficulties, p.difficulty)}</span>
                    <span>·</span>
                    <span>{p.current_points?.toFixed(1)} pts</span>
                    {p.due_date && (
                      <>
                        <span>·</span>
                        <span>due {p.due_date}</span>
                      </>
                    )}
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <select
                  className="rounded-lg bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs text-white"
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
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
