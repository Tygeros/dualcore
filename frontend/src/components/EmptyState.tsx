export default function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-500">
      <p className="font-medium text-neutral-400">{title}</p>
      {description && <p className="mt-1 text-sm">{description}</p>}
    </div>
  );
}
