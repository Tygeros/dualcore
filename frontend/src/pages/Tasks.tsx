import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getProjects,
  getPriorityLevels,
  getDifficultyLevels,
  getCategories,
} from "../services";
import type {
  Task,
  Project,
  Level,
  Status,
  TaskCreatePayload,
  Category,
} from "../types";
import StatusBadge from "../components/StatusBadge";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import CategoryPicker from "../components/CategoryPicker";
import CategoryBadges from "../components/CategoryBadges";
import CategoryManager from "../components/CategoryManager";
import {
  groupTasksByProject,
  flattenTree,
  findSubtree,
  buildTaskTree,
} from "../utils/taskTree";

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

export default function Tasks() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [priorities, setPriorities] = useState<Level[]>([]);
  const [difficulties, setDifficulties] = useState<Level[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterProject, setFilterProject] = useState<number | "">(() => {
    const p = searchParams.get("project");
    return p ? Number(p) : "";
  });
  const [filterStatus, setFilterStatus] = useState<Status | "">("");
  const [filterCategory, setFilterCategory] = useState<number | "">("");
  const [filterParent, setFilterParent] = useState<number | null>(() => {
    const p = searchParams.get("parent");
    return p ? Number(p) : null;
  });
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
    categories: [],
  });

  useEffect(() => {
    const p = searchParams.get("project");
    const parent = searchParams.get("parent");
    if (p) setFilterProject(Number(p));
    setFilterParent(parent ? Number(parent) : null);
  }, [searchParams]);

  const loadMeta = useCallback(async () => {
    const [projs, pris, diffs, cats] = await Promise.all([
      getProjects(),
      getPriorityLevels(),
      getDifficultyLevels(),
      getCategories(),
    ]);
    setProjects(projs);
    setPriorities(pris);
    setDifficulties(diffs);
    setCategories(cats);
    const activeProjs = projs.filter(
      (p) => p.status === "pending" || p.status === "in_progress"
    );
    setForm((f) => ({
      ...f,
      project: f.project || activeProjs[0]?.id || projs[0]?.id || 0,
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
      const params: {
        project?: number;
        status?: Status;
        category?: number;
      } = {};
      if (filterProject !== "") params.project = filterProject;
      if (filterStatus !== "") params.status = filterStatus;
      if (filterCategory !== "") params.category = filterCategory;
      const list = await getTasks(params);
      setTasks(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [filterProject, filterStatus, filterCategory]);

  useEffect(() => {
    loadMeta().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load meta")
    );
  }, [loadMeta]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function reloadCategories() {
    const cats = await getCategories();
    setCategories(cats);
  }

  const groups = useMemo(() => {
    const allGroups = groupTasksByProject(tasks, projects);
    if (filterParent == null) return allGroups;

    return allGroups
      .map((g) => {
        const node = findSubtree(g.roots, filterParent);
        if (!node) return null;
        return {
          ...g,
          roots: [node],
        };
      })
      .filter(Boolean) as typeof allGroups;
  }, [tasks, projects, filterParent]);

  const parentTaskInfo = useMemo(() => {
    if (filterParent == null) return null;
    return tasks.find((t) => t.id === filterParent) ?? null;
  }, [tasks, filterParent]);

  function updateFilters(project: number | "", parent: number | null) {
    setFilterProject(project);
    setFilterParent(parent);
    const next = new URLSearchParams();
    if (project !== "") next.set("project", String(project));
    if (parent != null) next.set("parent", String(parent));
    setSearchParams(next, { replace: true });
  }

  function openTaskChildren(t: Task) {
    navigate(`/tasks?project=${t.project}&parent=${t.id}`);
  }

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
        categories: form.categories || [],
      });
      setShowForm(false);
      setForm((f) => ({
        ...f,
        name: "",
        description: "",
        parent_task: null,
        status: "pending",
        due_date: null,
        categories: [],
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

  const isActiveStatus = (s: Status) =>
    s === "pending" || s === "in_progress";

  const activeProjects = useMemo(
    () => projects.filter((p) => isActiveStatus(p.status)),
    [projects]
  );

  const parentOptions = useMemo(() => {
    const inProject = tasks.filter(
      (t) => t.project === form.project && isActiveStatus(t.status)
    );
    return flattenTree(buildTaskTree(inProject));
  }, [tasks, form.project]);

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Tasks</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium shadow-lg shadow-blue-900/30 transition-all active:scale-[0.98]"
        >
          {showForm ? "Cancel" : "+ New"}
        </button>
      </div>

      <CategoryManager categories={categories} onChange={reloadCategories} />

      {filterParent != null && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <button
            type="button"
            onClick={() => updateFilters(filterProject, null)}
            className="text-sky-400 hover:text-sky-300 transition-colors"
          >
            {filterProject !== ""
              ? projects.find((p) => p.id === filterProject)?.name ?? "Project"
              : "All tasks"}
          </button>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-300 font-medium truncate">
            {parentTaskInfo?.name ?? `Task #${filterParent}`}
          </span>
          <span className="text-xs text-neutral-500 ml-1">(task con)</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
          value={filterProject}
          onChange={(e) => {
            const v = e.target.value === "" ? "" : Number(e.target.value);
            updateFilters(v, null);
          }}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
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
        <select
          className="rounded-xl bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
          value={filterCategory}
          onChange={(e) =>
            setFilterCategory(
              e.target.value === "" ? "" : Number(e.target.value)
            )
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
            placeholder="Task name *"
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
              Project
              <select
                className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-white"
                value={form.project}
                onChange={(e) =>
                  setForm({
                    ...form,
                    project: Number(e.target.value),
                    parent_task: null,
                  })
                }
              >
                {activeProjects.length === 0 && (
                  <option value={0}>— không có project active —</option>
                )}
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-neutral-400 space-y-1 block">
              Parent task
              <select
                className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm text-white"
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
                <option value="">— root —</option>
                {parentOptions.map(({ task: t, depth }) => (
                  <option key={t.id} value={t.id}>
                    {"—".repeat(depth)} {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
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
            disabled={submitting || !form.project}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium shadow-lg shadow-blue-900/20 transition-all"
          >
            {submitting ? "Creating..." : "Create task"}
          </button>
        </form>
      )}

      {loading ? (
        <Loading />
      ) : groups.length === 0 ? (
        <EmptyState
          title={
            filterParent != null
              ? "Task này chưa có task con"
              : "Chưa có task nào"
          }
          description={
            filterParent != null
              ? "Thêm subtask hoặc quay lại danh sách."
              : "Tạo task hoặc đổi bộ lọc."
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const rows = flattenTree(group.roots);
            return (
              <section key={group.projectId}>
                {filterParent == null && (
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <button
                      type="button"
                      onClick={() => updateFilters(group.projectId, null)}
                      className="text-sm font-semibold text-neutral-300 uppercase tracking-wide truncate hover:text-white transition-colors"
                    >
                      {group.project?.name ?? `Project #${group.projectId}`}
                    </button>
                    <span className="text-xs text-neutral-600 tabular-nums">
                      {rows.length}
                    </span>
                  </div>
                )}
                <ul className="space-y-2.5">
                  {rows.map(({ task: t, depth }) => {
                    const isFocusRoot =
                      filterParent != null &&
                      t.id === filterParent &&
                      depth === 0;
                    return (
                      <li
                        key={t.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openTaskChildren(t)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openTaskChildren(t);
                          }
                        }}
                        className={`group relative rounded-2xl border border-neutral-800/80 border-l-[3px] ${ACCENT[t.status]} bg-neutral-900/70 p-3.5 cursor-pointer
                          ${ACCENT_BG[t.status]} hover:border-neutral-700 hover:shadow-lg hover:shadow-black/30
                          active:scale-[0.995] transition-all duration-200
                          ${isFocusRoot ? "ring-1 ring-sky-500/30" : ""}`}
                        style={{ marginLeft: depth * 14 }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-[15px] tracking-tight truncate group-hover:text-white transition-colors">
                              {t.name}
                            </h3>
                            {t.description && (
                              <p className="text-sm text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                                {t.description}
                              </p>
                            )}
                            <CategoryBadges
                              categoryIds={t.categories || []}
                              categories={categories}
                              className="mt-1.5"
                            />
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[11px] text-neutral-500">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-neutral-800/80 text-neutral-400">
                                {levelName(priorities, t.priority)}
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-neutral-800/80 text-neutral-400">
                                {levelName(difficulties, t.difficulty)}
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400/90 font-medium">
                                {t.current_points?.toFixed(1)} pts
                              </span>
                              {t.due_date && (
                                <span className="text-neutral-500">
                                  due {t.due_date}
                                </span>
                              )}
                            </div>
                          </div>
                          <StatusBadge status={t.status} />
                        </div>
                        <div
                          className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-neutral-800/60"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            className="rounded-lg bg-neutral-950/80 border border-neutral-700/80 px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                            value={t.status}
                            onChange={(e) =>
                              handleStatusChange(
                                t.id,
                                e.target.value as Status
                              )
                            }
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          {(t.status === "pending" ||
                            t.status === "in_progress") && (
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
                              className="text-xs text-sky-400 hover:text-sky-300 px-2 py-1 rounded-lg hover:bg-sky-500/10 transition-colors"
                            >
                              + Subtask
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openTaskChildren(t)}
                            className="text-xs text-violet-400 hover:text-violet-300 px-2 py-1 rounded-lg hover:bg-violet-500/10 transition-colors"
                          >
                            Children →
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="text-xs text-rose-400/80 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors ml-auto"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
