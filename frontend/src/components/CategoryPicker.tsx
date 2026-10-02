import type { Category } from "../types";

interface Props {
  categories: Category[];
  selected: number[];
  onChange: (ids: number[]) => void;
  label?: string;
}

export default function CategoryPicker({
  categories,
  selected,
  onChange,
  label = "Categories",
}: Props) {
  function toggle(id: number) {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  if (categories.length === 0) {
    return (
      <div className="text-xs text-neutral-500">
        Chưa có category. Mở panel quản lý để tạo.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <span className="text-xs text-neutral-400">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => {
          const active = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                active
                  ? "border-transparent text-white shadow-sm"
                  : "border-neutral-700 bg-neutral-950 text-neutral-400 hover:border-neutral-500"
              }`}
              style={
                active
                  ? {
                      backgroundColor: c.color,
                      boxShadow: `0 0 0 1px ${c.color}`,
                    }
                  : undefined
              }
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: active ? "#fff" : c.color }}
              />
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
