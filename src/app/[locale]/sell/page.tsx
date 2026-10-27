'use client';

import { useTranslations } from 'next-intl';

export default function SellPage() {
  const t = useTranslations('sell');

  const groups = [
    {
      title: t('voitures'),
      items: [t('voitures_list'), t('pieces_voiture'), t('roues_voiture')],
    },
    {
      title: t('motos'),
      items: [t('motos_list'), t('pieces_moto'), t('roues_moto')],
    },
    {
      title: t('velos'),
      items: [t('velos_list'), t('pieces_velo'), t('roues_velo')],
    },
    {
      title: t('camions'),
      items: [t('camions_list'), t('remorques'), t('pieces_accessoires')],
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>
      <p className="mt-1.5 text-sm text-ink-500">{t('subtitle')}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => (
          <section key={group.title} className="rounded-2xl border border-ink-900/[0.06] bg-white shadow-card">
            <header className="border-b border-ink-900/[0.05] px-4 py-3">
              <h2 className="font-display text-lg font-semibold text-ink-900">{group.title}</h2>
            </header>
            <ul className="divide-y divide-ink-900/[0.04]">
              {group.items.map((item) => (
                <li key={item} className="px-4 py-2.5 text-sm text-ink-700 hover:bg-sand-50">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
