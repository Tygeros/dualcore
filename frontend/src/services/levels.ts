import { api } from "./api";
import type { Level } from "../types";

export async function getPriorityLevels(): Promise<Level[]> {
  return api.get<Level[]>("/base/priority-levels/");
}

export async function getDifficultyLevels(): Promise<Level[]> {
  return api.get<Level[]>("/base/difficulty-levels/");
}
