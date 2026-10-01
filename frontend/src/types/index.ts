export type Status = "pending" | "in_progress" | "completed" | "canceled";

export interface Level {
  id: number;
  name: string;
  coefficient: number;
  note: string;
}

export interface Profile {
  id: number;
  user: number;
  display_name: string;
  commit_points: number;
  level: number;
  exp: number;
  exp_threshold: number;
}

export interface Project {
  id: number;
  owner: number;
  name: string;
  description: string;
  priority: number;
  difficulty: number;
  status: Status;
  due_date: string | null;
  terminated_date: string | null;
  current_points: number;
  final_points: number | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  owner: number;
  name: string;
  description: string;
  project: number;
  parent_task: number | null;
  task_level: number;
  priority: number;
  difficulty: number;
  status: Status;
  due_date: string | null;
  terminated_date: string | null;
  current_points: number;
  final_points: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreatePayload {
  name: string;
  description?: string;
  priority: number;
  difficulty: number;
  status?: Status;
  due_date?: string | null;
}

export interface TaskCreatePayload {
  name: string;
  description?: string;
  project: number;
  parent_task?: number | null;
  priority: number;
  difficulty: number;
  status?: Status;
  due_date?: string | null;
}
