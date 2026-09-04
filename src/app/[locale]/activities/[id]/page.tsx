import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ChevronLeft, CalendarDays, MapPin, Users, Gauge, MessageCircle, Flag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { activities } from '@/data/mock';

export function generateStaticParams() {
  return activities.map((a) => ({ id: a.id }));
}

export default async function ActivityDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(params.locale);
  const activity = activities.find((a) => a.id === params.id);
  if (!activity) notFound();

  const t = await getTranslations('activities');
  const common = await getTranslations('common');
  const spotsLeft = activity.max - activity.participants;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <Link
        href="/activities"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-majorelle-700 hover:text-majorelle-800"
      >
        <ChevronLeft size={16} className="flip-rtl" />
        {t('backToActivities')}
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          <div>
            <span className="w-fit rounded-full bg-clay-400/10 px-2.5 py-1 text-[11px] font-semibold text-clay-500">
              {activity.category}
            </span>
            <h1 className="mt-3 font-display text-3xl font-semibold text-ink-900">{activity.title}</h1>
            <p className="mt-2 text-sm text-ink-500">
              {t('hostedBy')} <span className="font-medium text-ink-700">{activity.host}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-3.5 shadow-card">
              <CalendarDays size={16} className="text-majorelle-600" />
              <p className="mt-2 text-xs font-medium text-ink-700">{activity.date}</p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 shadow-card">
              <MapPin size={16} className="text-majorelle-600" />
              <p className="mt-2 text-xs font-medium text-ink-700">{activity.location}</p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 shadow-card">
              <Users size={16} className="text-majorelle-600" />
              <p className="mt-2 text-xs font-medium text-ink-700">
                {activity.participants}/{activity.max} · {spotsLeft} {common('spotsLeft')}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3.5 shadow-card">
              <Gauge size={16} className="text-majorelle-600" />
              <p className="mt-2 text-xs font-medium text-ink-700">{activity.level}</p>
            </div>
          </div>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">{t('about')}</h2>
            <p className="text-sm leading-relaxed text-ink-700">{activity.description}</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">{t('equipment')}</h2>
            <ul className="flex flex-wrap gap-2">
              {activity.equipment.map((item) => (
                <li key={item} className="rounded-full bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink-700">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <p className="text-xs text-ink-500">{t('minParticipants')}</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{activity.minParticipants}</p>
            <button
              type="button"
              className="mt-4 w-full rounded-full bg-majorelle-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700"
            >
              {t('joinActivity')}
            </button>
            <button
              type="button"
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-sand-100"
            >
              <MessageCircle size={15} /> {t('groupChat')}
            </button>
          </div>

          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-4 py-2.5 text-xs font-semibold text-ink-500 hover:bg-sand-100"
          >
            <Flag size={13} /> {common('report')}
          </button>
        </aside>
      </div>
    </div>
  );
}
