import type { Task, Project } from "../types";

export interface TaskNode extends Task {
  children: TaskNode[];
}

export interface ProjectTaskGroup {
  project: Project | null;
  projectId: number;
  roots: TaskNode[];
}

/** Build parent→children tree from a flat task list. */
export function buildTaskTree(tasks: Task[]): TaskNode[] {
  const map = new Map<number, TaskNode>();
  for (const t of tasks) {
    map.set(t.id, { ...t, children: [] });
  }

  const roots: TaskNode[] = [];
  for (const node of map.values()) {
    if (node.parent_task != null && map.has(node.parent_task)) {
      map.get(node.parent_task)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Stable-ish: keep API order within siblings
  const order = new Map(tasks.map((t, i) => [t.id, i]));
  const sortRec = (nodes: TaskNode[]) => {
    nodes.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

/** Group tasks by project, each group with a parent-child tree. */
export function groupTasksByProject(
  tasks: Task[],
  projects: Project[]
): ProjectTaskGroup[] {
  const byProject = new Map<number, Task[]>();
  for (const t of tasks) {
    const list = byProject.get(t.project) ?? [];
    list.push(t);
    byProject.set(t.project, list);
  }

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const groups: ProjectTaskGroup[] = [];

  // Prefer project list order, then any remaining ids from tasks
  const seen = new Set<number>();
  for (const p of projects) {
    const list = byProject.get(p.id);
    if (!list?.length) continue;
    seen.add(p.id);
    groups.push({
      project: p,
      projectId: p.id,
      roots: buildTaskTree(list),
    });
  }
  for (const [pid, list] of byProject) {
    if (seen.has(pid)) continue;
    groups.push({
      project: projectMap.get(pid) ?? null,
      projectId: pid,
      roots: buildTaskTree(list),
    });
  }

  return groups;
}

/** Flatten tree for rendering with depth. */
export function flattenTree(
  roots: TaskNode[],
  depth = 0
): Array<{ task: TaskNode; depth: number }> {
  const out: Array<{ task: TaskNode; depth: number }> = [];
  for (const node of roots) {
    out.push({ task: node, depth });
    out.push(...flattenTree(node.children, depth + 1));
  }
  return out;
}

/** Find a node by id in a forest; returns that node (with its subtree) or null. */
export function findSubtree(
  roots: TaskNode[],
  taskId: number
): TaskNode | null {
  for (const node of roots) {
    if (node.id === taskId) return node;
    const found = findSubtree(node.children, taskId);
    if (found) return found;
  }
  return null;
}
