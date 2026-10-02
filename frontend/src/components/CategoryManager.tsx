import { useState } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services";
import type { Category, CategoryCreatePayload } from "../types";

const PRESET_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#64748b",
];

interface Props {
  categories: Category[];
  onChange: () => Promise<void> | void;
}

export default function CategoryManager({ categories, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setColor(PRESET_COLORS[0]);
    setNote("");
    setEditingId(null);
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setName(c.name);
    setColor(c.color || PRESET_COLORS[0]);
    setNote(c.note || "");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const payload: CategoryCreatePayload = {
        name: name.trim(),
        color,
        note: note.trim(),
      };
      if (editingId != null) {
        await updateCategory(editingId, payload);
      } else {
        await createCategory(payload);
      }
      resetForm();
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu category thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa category này? (sẽ gỡ khỏi project/task)")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCategory(id);
      if (editingId === id) resetForm();
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800/50 transition-colors"
      >
        <span className="font-medium">
          Categories{" "}
          <span className="text-neutral-500 font-normal">
            ({categories.length})
          </span>
        </span>
        <span className="text-neutral-500 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-neutral-800 p-3 space-y-3">
          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-2.5 py-1.5">
              {error}
            </div>
          )}

          {categories.length > 0 && (
            <ul className="space-y-1.5 max-h-40 overflow-y-auto">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg bg-neutral-950/60 border border-neutral-800 px-2.5 py-1.5"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="flex-1 text-sm truncate">{c.name}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    className="text-[11px] text-sky-400 hover:text-sky-300 px-1.5"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    disabled={busy}
                    className="text-[11px] text-rose-400 hover:text-rose-300 px-1.5 disabled:opacity-40"
                  >
                    Xóa
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder={editingId ? "Đổi tên..." : "Tên category mới"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-neutral-700 bg-neutral-950 cursor-pointer p-0.5"
                title="Màu"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    color === c
                      ? "border-white scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input
              className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="Ghi chú (tuỳ chọn)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy || !name.trim()}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium"
              >
                {busy
                  ? "Đang lưu..."
                  : editingId
                    ? "Cập nhật"
                    : "Thêm category"}
              </button>
              {editingId != null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 rounded-xl border border-neutral-700 text-sm text-neutral-400 hover:text-white"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
