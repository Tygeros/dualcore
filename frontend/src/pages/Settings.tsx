import { useCallback, useEffect, useState } from "react";

import { getCategories } from "../services";
import type { Category } from "../types";
import CategoryManager from "../components/CategoryManager";
import Loading from "../components/Loading";

export default function Settings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && categories.length === 0) return <Loading />;

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Categories
        </h2>
        <p className="text-xs text-neutral-500">
          Tạo, sửa, xóa category. Category có thể gắn vào Project và Task.
        </p>
        <CategoryManager
          categories={categories}
          onChange={load}
          defaultOpen
        />
      </section>
    </div>
  );
}
