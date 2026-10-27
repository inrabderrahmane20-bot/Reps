import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';

export default function PlacesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = useTranslations('places');

  const sections = [
    { key: 'jardin', title: t('jardin'), items: ['Jardin Majorelle', 'Jardin de la Ménara', 'Jardins de l\'Agdal', 'Jardin Secret', 'Cyber Park Arsat Moulay Abdeslam', 'Palmeraie de Marrakech', 'Parc Lalla Hasna', 'Oliveraie de la Ménara'] },
    { key: 'monuments', title: t('monuments'), items: ['Koutoubia', 'Médersa Ben Youssef', 'Palais de la Bahia', 'Palais El Badiî', 'Tombeaux Saadiens', 'Porte Bab Agnaou', 'Bab Boujloud'] },
    { key: 'musees', title: t('musees'), items: ['Musée Yves Saint Laurent Marrakech', 'Musée MACAAL', 'Musée Tiskiwin', 'Maison de la Photographie'] },
    { key: 'excursions', title: t('excursions'), items: ['Désert d\'Agafay', 'Vallée de l\'Ourika', 'Cascades d\'Ouzoud', 'Imlil', 'Aït Ben Haddou', 'Ouarzazate'] },
    { key: 'experiences', title: t('experiences'), items: ['Hammam marocain traditionnel', 'Spectacle de fantasia', 'Dîner dans le désert d\'Agafay', 'Vol en montgolfière autour de Marrakech', 'Balade en calèche'] },
    { key: 'autres', title: t('autres'), items: ['Cafés', 'Restaurants', 'Parcs', 'Piscines', 'Hôtels', 'Salles de sport (Karaté, Yoga, Musculation)'] },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>
      <p className="mt-1.5 text-sm text-ink-500">{t('subtitle')}</p>

      <div className="mt-10 space-y-12">
        {sections.map((section, idx) => (
          <section key={section.key}>
            <h2 className="font-display text-xl font-semibold text-ink-900">{section.title}</h2>
            <div
              className={`mt-2 h-px w-full ${
                idx === 0
                  ? 'bg-gradient-to-r from-sunset-400 via-ink-900/10 to-transparent'
                  : 'bg-gradient-to-r from-ink-900/10 via-ink-900/10 to-transparent'
              }`}
            />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <article key={item} className="rounded-2xl border border-ink-900/[0.06] bg-white p-4 shadow-card transition-shadow hover:shadow-float">
                  <h3 className="font-medium text-ink-900">{item}</h3>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
