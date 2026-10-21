'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChevronLeft, BadgeCheck, MapPin, Wallet } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Rating } from '@/components/ui/rating';
import { AvailabilityBadge } from '@/components/ui/availability-badge';
import { ReportButton } from '@/components/ui/report-modal';
import { RequestServiceModal } from '@/components/ui/request-service-modal';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { useRouter } from '@/i18n/navigation';

export default function ProviderDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('services');
  const common = useTranslations('common');
  const [provider, setProvider] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  async function messageProvider() {
    if (!user) return router.push('/login');
    const res = await api.post<{ id: string }>('/conversations', { userId: provider.id });
    router.push('/messages');
  }

  useEffect(() => {
    api
      .get<{ provider: any }>(`/providers/${params.id}`)
      .then((r) => setProvider(r.provider))
      .catch(() => setNotFound(true));
  }, [params.id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-ink-500">
        Provider not found. <Link href="/services" className="font-semibold text-majorelle-700">Back to services</Link>
      </div>
    );
  }
  if (!provider) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-ink-500">{common('loading')}</div>;
  }

  const name = `${provider.firstName} ${provider.lastName}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <Link href="/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-majorelle-700 hover:text-majorelle-800">
        <ChevronLeft size={16} className="flip-rtl" />
        {t('backToServices')}
      </Link>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <img src={provider.avatar} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-ink-900">{name}</h1>
            <BadgeCheck size={19} className="shrink-0 text-zellige-500" aria-label={common('verified')} />
          </div>
          <p className="mt-0.5 text-sm text-ink-500">{provider.provider.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Rating value={provider.rating ?? 0} count={provider.reviews?.length ?? 0} />
            <AvailabilityBadge status={provider.provider.availability} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowRequest(true)}
          className="shrink-0 rounded-full bg-majorelle-600 px-6 py-3 text-sm font-semibold text-white hover:bg-majorelle-700"
        >
          {t('requestService')}
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          <section>
            <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">{t('about')}</h2>
            <p className="text-sm leading-relaxed text-ink-700">{provider.provider.description}</p>
          </section>

          {provider.provider.specialties?.length > 0 && (
            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">{t('specialties')}</h2>
              <ul className="flex flex-wrap gap-2">
                {provider.provider.specialties.map((s: string) => (
                  <li key={s} className="rounded-full bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink-700">
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {provider.provider.portfolio?.length > 0 && (
            <section>
              <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">{t('portfolio')}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {provider.provider.portfolio.map((src: string, i: number) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-2xl">
                    <Image src={src} alt="" fill className="object-cover" sizes="(min-width: 768px) 33vw, 50vw" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {provider.reviews?.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">{t('clientReviews')}</h2>
              <div className="space-y-3">
                {provider.reviews.map((review: any) => (
                  <article key={review.id} className="rounded-2xl bg-white p-4 shadow-card">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink-900">{review.authorName}</p>
                      <Rating value={review.rating} />
                    </div>
                    {review.content && <p className="mt-2 text-sm leading-relaxed text-ink-700">{review.content}</p>}
                    <p className="mt-2 text-xs text-ink-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                <MapPin size={13} /> {t('serviceAreaLabel')}
              </p>
              <p className="mt-1 text-sm text-ink-700">{provider.provider.serviceArea}</p>
            </div>
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                <Wallet size={13} /> {t('priceRangeLabel')}
              </p>
              <p className="mt-1 text-sm text-ink-700">{provider.provider.priceRange}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowRequest(true)}
              className="mt-1 w-full rounded-full bg-majorelle-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700"
            >
              {t('contactProvider')}
            </button>
            <button
              type="button"
              onClick={messageProvider}
              className="w-full rounded-full border border-ink-900/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-sand-100"
            >
              {common('message')}
            </button>
          </div>

          <div className="rounded-full border border-ink-900/10 bg-white px-4 py-2.5 text-center">
            <ReportButton targetType="provider" targetId={provider.id} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-clay-500" />
          </div>
        </aside>
      </div>

      {showRequest && (
        <RequestServiceModal providerId={provider.id} category={provider.provider.category} onClose={() => setShowRequest(false)} />
      )}
    </div>
  );
}
