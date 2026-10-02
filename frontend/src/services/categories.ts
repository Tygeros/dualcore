import { api } from "./api";
import type { Category, CategoryCreatePayload } from "../types";

export async function getCategories(): Promise<Category[]> {
  return api.get<Category[]>("/categories/");
}

export async function getCategory(id: number): Promise<Category> {
  return api.get<Category>(`/categories/${id}/`);
}

export async function createCategory(
  data: CategoryCreatePayload
): Promise<Category> {
  return api.post<Category>("/categories/", data);
}

export async function updateCategory(
  id: number,
  data: Partial<CategoryCreatePayload>
): Promise<Category> {
  return api.patch<Category>(`/categories/${id}/`, data);
}

export async function deleteCategory(id: number): Promise<void> {
  return api.delete(`/categories/${id}/`);
}
