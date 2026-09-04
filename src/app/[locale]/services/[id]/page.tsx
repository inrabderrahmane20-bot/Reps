import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, BadgeCheck, MapPin, Wallet, Flag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Rating } from '@/components/ui/rating';
import { AvailabilityBadge } from '@/components/ui/availability-badge';
import { providers } from '@/data/mock';

export function generateStaticParams() {
  return providers.map((p) => ({ id: p.id }));
}

export default async function ProviderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const provider = providers.find((p) => p.id === params.id);
  if (!provider) notFound();

  const t = await getTranslations('services');
  const common = await getTranslations('common');

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <Link
        href="/services"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-majorelle-700 hover:text-majorelle-800"
      >
        <ChevronLeft size={16} className="flip-rtl" />
        {t('backToServices')}
      </Link>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-majorelle-600/10 font-display text-2xl font-semibold text-majorelle-700">
          {provider.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-ink-900">{provider.name}</h1>
            {provider.verified && (
              <BadgeCheck size={19} className="shrink-0 text-zellige-500" aria-label={common('verified')} />
            )}
          </div>
          <p className="mt-0.5 text-sm text-ink-500">{provider.title ?? provider.category}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Rating value={provider.rating} count={provider.reviews} />
            <AvailabilityBadge status={provider.availability} />
            <span className="inline-flex items-center gap-1 text-xs text-ink-500">
              <MapPin size={13} /> {provider.distanceKm} {common('away')}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full bg-majorelle-600 px-6 py-3 text-sm font-semibold text-white hover:bg-majorelle-700"
        >
          {t('requestService')}
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          {provider.description && (
            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">{t('about')}</h2>
              <p className="text-sm leading-relaxed text-ink-700">{provider.description}</p>
            </section>
          )}

          {provider.specialties && provider.specialties.length > 0 && (
            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">{t('specialties')}</h2>
              <ul className="flex flex-wrap gap-2">
                {provider.specialties.map((s) => (
                  <li key={s} className="rounded-full bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink-700">
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {provider.portfolio && provider.portfolio.length > 0 && (
            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">{t('portfolio')}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {provider.portfolio.map((src, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-2xl">
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 33vw, 50vw"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {provider.reviewsList && provider.reviewsList.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">{t('clientReviews')}</h2>
              <div className="space-y-3">
                {provider.reviewsList.map((review, i) => (
                  <article key={i} className="rounded-2xl bg-white p-4 shadow-card">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink-900">{review.author}</p>
                      <Rating value={review.rating} />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-700">{review.content}</p>
                    <p className="mt-2 text-xs text-ink-500">{review.date}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
            {provider.serviceArea && (
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                  <MapPin size={13} /> {t('serviceAreaLabel')}
                </p>
                <p className="mt-1 text-sm text-ink-700">{provider.serviceArea}</p>
              </div>
            )}
            {provider.priceRange && (
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                  <Wallet size={13} /> {t('priceRangeLabel')}
                </p>
                <p className="mt-1 text-sm text-ink-700">{provider.priceRange}</p>
              </div>
            )}
            <button
              type="button"
              className="mt-1 w-full rounded-full bg-majorelle-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700"
            >
              {t('contactProvider')}
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
