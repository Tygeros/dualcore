import { api } from "./api";
import type { Project, ProjectCreatePayload, Status } from "../types";

export async function getProjects(params?: {
  category?: number;
  status?: Status;
}): Promise<Project[]> {
  const search = new URLSearchParams();
  if (params?.category != null) search.set("category", String(params.category));
  if (params?.status) search.set("status", params.status);
  const qs = search.toString();
  return api.get<Project[]>(`/projects/${qs ? `?${qs}` : ""}`);
}

export async function getProject(id: number): Promise<Project> {
  return api.get<Project>(`/projects/${id}/`);
}

export async function createProject(
  data: ProjectCreatePayload
): Promise<Project> {
  return api.post<Project>("/projects/", data);
}

export async function updateProject(
  id: number,
  data: Partial<
    ProjectCreatePayload & { status: Status; terminated_date: string | null }
  >
): Promise<Project> {
  return api.patch<Project>(`/projects/${id}/`, data);
}

export async function deleteProject(id: number): Promise<void> {
  return api.delete(`/projects/${id}/`);
}
