import Image from 'next/image';
import { Link } from '@/i18n/navigation';

export function NewsCard({
  id,
  title,
  category,
  neighborhood,
  date,
  image,
}: {
  id: string;
  title: string;
  category: string;
  neighborhood: string;
  date: string;
  image: string;
}) {
  return (
    <Link
      href={`/news/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-transform hover:-translate-y-0.5"
    >
      <div className="relative h-40 w-full overflow-hidden">
        <Image
          src={image}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(min-width: 768px) 33vw, 100vw"
        />
        <span className="absolute start-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-majorelle-700">
          {category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-base font-semibold leading-snug text-ink-900">{title}</h3>
        <p className="mt-auto text-xs text-ink-500">
          {neighborhood} · {date}
        </p>
      </div>
    </Link>
  );
}
