import { api } from "./api";
import type { Profile, TodayPoints } from "../types";

export async function getProfiles(): Promise<Profile[]> {
  return api.get<Profile[]>("/profiles/");
}

/** Single-user mode: lấy profile đầu tiên (duy nhất). */
export async function getCurrentProfile(): Promise<Profile | null> {
  const list = await getProfiles();
  return list[0] ?? null;
}

export async function updateProfile(
  id: number,
  data: Partial<Pick<Profile, "display_name" | "commit_points">>
): Promise<Profile> {
  return api.patch<Profile>(`/profiles/${id}/`, data);
}

export async function getTodayPoints(): Promise<TodayPoints> {
  return api.get<TodayPoints>("/profiles/today-points/");
}
