import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink-900/15 bg-white px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-sand-100 text-ink-500">
        <Icon size={22} />
      </span>
      <p className="max-w-sm text-sm text-ink-500">{title}</p>
      {action}
    </div>
  );
}
