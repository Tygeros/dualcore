import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getProjects,
  getPriorityLevels,
  getDifficultyLevels,
} from "../services";
import type {
  Task,
  Project,
  Level,
  Status,
  TaskCreatePayload,
} from "../types";
import StatusBadge from "../components/StatusBadge";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { groupTasksByProject, flattenTree } from "../utils/taskTree";

const STATUS_OPTIONS: Status[] = [
  "pending",
  "in_progress",
  "completed",
  "canceled",
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [priorities, setPriorities] = useState<Level[]>([]);
  const [difficulties, setDifficulties] = useState<Level[]>([]);
  const [filterProject, setFilterProject] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<Status | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<TaskCreatePayload>({
    name: "",
    description: "",
    project: 0,
    parent_task: null,
    priority: 0,
    difficulty: 0,
    status: "pending",
    due_date: null,
  });

  const loadMeta = useCallback(async () => {
    const [projs, pris, diffs] = await Promise.all([
      getProjects(),
      getPriorityLevels(),
      getDifficultyLevels(),
    ]);
    setProjects(projs);
    setPriorities(pris);
    setDifficulties(diffs);
    setForm((f) => ({
      ...f,
      project: f.project || projs[0]?.id || 0,
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
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { project?: number; status?: Status } = {};
      if (filterProject !== "") params.project = filterProject;
      if (filterStatus !== "") params.status = filterStatus;
      const list = await getTasks(params);
      setTasks(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [filterProject, filterStatus]);

  useEffect(() => {
    loadMeta().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load meta")
    );
  }, [loadMeta]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const groups = useMemo(
    () => groupTasksByProject(tasks, projects),
    [tasks, projects]
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.project || !form.priority || !form.difficulty)
      return;
    setSubmitting(true);
    try {
      await createTask({
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || "",
        parent_task: form.parent_task || null,
        due_date: form.due_date || null,
      });
      setShowForm(false);
      setForm((f) => ({
        ...f,
        name: "",
        description: "",
        parent_task: null,
        status: "pending",
        due_date: null,
      }));
      await loadTasks();
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
        payload.terminated_date = new Date().toISOString().slice(0, 10);
      } else {
        payload.terminated_date = null;
      }
      await updateTask(id, payload);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa task này?")) return;
    try {
      await deleteTask(id);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function levelName(list: Level[], id: number) {
    return list.find((l) => l.id === id)?.name ?? `#${id}`;
  }

  /** Parent options: only tasks in selected project (roots + nested ok). */
  const parentOptions = tasks.filter((t) => t.project === form.project);

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Tasks</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium"
        >
          {showForm ? "Cancel" : "+ New"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-sm text-white"
          value={filterProject}
          onChange={(e) =>
            setFilterProject(e.target.value === "" ? "" : Number(e.target.value))
          }
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-sm text-white"
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus((e.target.value || "") as Status | "")
          }
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
            placeholder="Task name *"
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
              Project *
              <select
                className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-white"
                value={form.project}
                onChange={(e) =>
                  setForm({
                    ...form,
                    project: Number(e.target.value),
                    parent_task: null,
                  })
                }
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-neutral-400 space-y-1 block">
              Parent task
              <select
                className="w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-white"
                value={form.parent_task ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    parent_task: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              >
                <option value="">None (root)</option>
                {parentOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {"  ".repeat(Math.max(0, (t.task_level || 1) - 1))}
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
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
            disabled={submitting || !form.project}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium"
          >
            {submitting ? "Creating..." : "Create task"}
          </button>
        </form>
      )}

      {loading ? (
        <Loading />
      ) : groups.length === 0 ? (
        <EmptyState
          title="Chưa có task nào"
          description="Tạo task hoặc đổi bộ lọc."
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const rows = flattenTree(group.roots);
            return (
              <section key={group.projectId}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide truncate">
                    {group.project?.name ?? `Project #${group.projectId}`}
                  </h2>
                  <span className="text-xs text-neutral-600">
                    {rows.length} task{rows.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <ul className="space-y-2">
                  {rows.map(({ task: t, depth }) => (
                    <li
                      key={t.id}
                      className="rounded-xl bg-neutral-900 border border-neutral-800 p-3"
                      style={{ marginLeft: depth * 16 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {depth > 0 && (
                              <span
                                className="text-neutral-600 shrink-0 select-none"
                                aria-hidden
                              >
                                └
                              </span>
                            )}
                            <h3 className="font-semibold truncate">{t.name}</h3>
                          </div>
                          {t.description && (
                            <p className="text-sm text-neutral-400 mt-1 line-clamp-2">
                              {t.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1.5 text-xs text-neutral-500">
                            <span>L{t.task_level}</span>
                            <span>·</span>
                            <span>{levelName(priorities, t.priority)}</span>
                            <span>·</span>
                            <span>{levelName(difficulties, t.difficulty)}</span>
                            <span>·</span>
                            <span>{t.current_points?.toFixed(1)} pts</span>
                            {t.due_date && (
                              <>
                                <span>·</span>
                                <span>due {t.due_date}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <select
                          className="rounded-lg bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs text-white"
                          value={t.status}
                          onChange={(e) =>
                            handleStatusChange(t.id, e.target.value as Status)
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
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              project: t.project,
                              parent_task: t.id,
                            }));
                            setShowForm(true);
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1"
                        >
                          + Subtask
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
