import type { Category } from "../types";

interface Props {
  categoryIds: number[];
  categories: Category[];
  className?: string;
}

export default function CategoryBadges({
  categoryIds,
  categories,
  className = "",
}: Props) {
  if (!categoryIds?.length) return null;
  const list = categoryIds
    .map((id) => categories.find((c) => c.id === id))
    .filter(Boolean) as Category[];
  if (!list.length) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {list.map((c) => (
        <span
          key={c.id}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium"
          style={{
            backgroundColor: `${c.color}22`,
            color: c.color,
            border: `1px solid ${c.color}44`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: c.color }}
          />
          {c.name}
        </span>
      ))}
    </div>
  );
}
