import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { CommunityCard } from '@/components/cards/community-card';
import { communities } from '@/data/mock';

export default function CommunitiesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = useTranslations('communities');

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>
          <p className="mt-1.5 max-w-xl text-sm text-ink-500">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-majorelle-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700"
        >
          {t('createGroup')}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Partenaires d'activité", items: ["Aide au déménagement", "Recherche d'un partenaire d'entraînement", "Recherche d'un partenaire linguistique", "Tournoi de football", "Tournoi de basketball", "Recherche d'un partenaire de tennis", "Recherche d'un compagnon de vélo"] },
          { title: "Garde d'enfants", items: ["Garderie", "Parc de jeux", "Service de garde d'enfants à domicile"] },
          { title: "Classes et ateliers", items: ["Cours de jardinage gratuit", "Cours de préparation fiscale", "Cours de cuisine marocaine", "Atelier de création de poterie", "Atelier de création de parfum personnalisé"] },
          { title: "Événements", items: ["Conférences", "Théâtre", "Ventes aux enchères", "Événements annuels", "Festival annuel de golf", "Marrakech Air Show"] },
        ].map((group) => (
          <section key={group.title} className="rounded-2xl border border-ink-900/[0.06] bg-white shadow-card">
            <header className="border-b border-ink-900/[0.05] px-4 py-3">
              <h2 className="font-display text-lg font-semibold text-ink-900">{group.title}</h2>
            </header>
            <ul className="divide-y divide-ink-900/[0.04]">
              {group.items.map((item) => (
                <li key={item} className="px-4 py-2.5 text-sm text-ink-700">{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-ink-900">{t('title')}</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[...communities, ...communities].map((c, i) => (
          <CommunityCard key={`${c.id}-${i}`} {...c} />
        ))}
      </div>
    </div>
  );
}
