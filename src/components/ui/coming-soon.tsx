import type { LucideIcon } from 'lucide-react';

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-24 text-center md:px-8">
      <span className="grid h-14 w-14 place-items-center rounded-arch bg-majorelle-600/10 text-majorelle-700">
        <Icon size={24} />
      </span>
      <h1 className="font-display text-2xl font-semibold text-ink-900">{title}</h1>
      <p className="max-w-md text-sm text-ink-500">{description}</p>
    </div>
  );
}
