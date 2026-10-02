import { api } from "./api";
import type { Task, TaskCreatePayload, Status } from "../types";

export async function getTasks(params?: {
  project?: number;
  status?: Status;
  category?: number;
}): Promise<Task[]> {
  const search = new URLSearchParams();
  if (params?.project != null) search.set("project", String(params.project));
  if (params?.status) search.set("status", params.status);
  if (params?.category != null) search.set("category", String(params.category));
  const qs = search.toString();
  return api.get<Task[]>(`/tasks/${qs ? `?${qs}` : ""}`);
}

export async function getTask(id: number): Promise<Task> {
  return api.get<Task>(`/tasks/${id}/`);
}

export async function createTask(data: TaskCreatePayload): Promise<Task> {
  return api.post<Task>("/tasks/", data);
}

export async function updateTask(
  id: number,
  data: Partial<
    TaskCreatePayload & { status: Status; terminated_date: string | null }
  >
): Promise<Task> {
  return api.patch<Task>(`/tasks/${id}/`, data);
}

export async function deleteTask(id: number): Promise<void> {
  return api.delete(`/tasks/${id}/`);
}
