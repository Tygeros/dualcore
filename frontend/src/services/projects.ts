import { api } from "./api";
import type { Project, ProjectCreatePayload, Status } from "../types";

export async function getProjects(): Promise<Project[]> {
  return api.get<Project[]>("/projects/");
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
  data: Partial<ProjectCreatePayload & { status: Status; terminated_date: string | null }>
): Promise<Project> {
  return api.patch<Project>(`/projects/${id}/`, data);
}

export async function deleteProject(id: number): Promise<void> {
  return api.delete(`/projects/${id}/`);
}
