'use client';

import { useTranslations } from 'next-intl';

export default function PlacesPage() {
  const t = useTranslations('places');

  const sections = [
    { key: 'jardin', title: t('jardin'), items: ['Jardin Majorelle', 'Jardin de la Ménara', 'Jardins de l\'Agdal', 'Le Jardin Secret', 'Cyber Park Arsat Moulay Abdeslam', 'Palmeraie de Marrakech', 'Parc Lalla Hasna', 'Oliveraie de la Ménara'] },
    { key: 'monuments', title: t('monuments'), items: ['Koutoubia', 'Médersa Ben Youssef', 'Palais de la Bahia', 'Palais El Badiî', 'Tombeaux Saadiens', 'Bab Agnaou', 'Bab Boujloud', 'Musée de Marrakech', 'Musée de Mouassine', 'Dar El Bacha', 'Maison de la Photographie', 'Musée Dar Si Saïd', 'Musée de la Femme', 'Souk Semmarine', 'Souk des Teinturiers', 'Souk des Bijoutiers', 'Souk Haddadine', 'Place des Épices', 'Place des Ferblantiers', 'Quartier de la Kasbah', 'Quartier de Mouassine', 'Quartier Mellah', 'Synagogue Lazama'] },
    { key: 'musees', title: t('musees'), items: ['Musée Yves Saint Laurent Marrakech', 'Musée Mohammed VI pour la civilisation de l\'eau au Maroc', 'Musée des Confluences – Dar El Bacha', 'Musée de Marrakech', 'Maison de la Photographie', 'Musée Dar Si Saïd', 'Musée de la Femme de Marrakech', 'Musée MACAAL', 'Musée Tiskiwin'] },
    { key: 'excursions', title: t('excursions'), items: ['Désert d\'Agafay', 'Vallée de l\'Ourika', 'Setti Fatma', 'Cascades d\'Ouzoud', 'Lac Lalla Takerkoust', 'Plateau du Kik', 'Imlil', 'Parc national du Toubkal', 'Asni', 'Ouirgane', 'Aït Ben Haddou', 'Ouarzazate', 'Vallée du Zat', 'Palmeraie de Marrakech', 'Circuit en quad dans la Palmeraie', 'Balade à dos de chameau', 'Vol en montgolfière autour de Marrakech', 'Excursion en buggy'] },
    { key: 'experiences', title: t('experiences'), items: ['Dîner traditionnel marocain', 'Spectacle de fantasia', 'Hammam marocain traditionnel', 'Rooftop avec vue sur la médina', 'Coucher de soleil à Jemaa el-Fna', 'Dîner dans le désert d\'Agafay', 'Balade en calèche', 'Spa traditionnel marocain', 'Dégustation de thé à la menthe', 'Découverte de la cuisine de rue de la médina', 'Balade nocturne dans la médina'] },
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
