'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api-client';

export default function PlacesPage() {
  const t = useTranslations('places');
  const [places, setPlaces] = useState<any[]>([]);
  const [city, setCity] = useState<string>('');
  const [category, setCategory] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get<{ places?: any[] }>('/places');
        if (!cancelled && res.places) {
          setPlaces(res.places);
        }
      } catch {
        // ignore
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return places.filter((p) => {
      let ok = true;
      if (city && city !== '') {
        const pc = (p.city || '').toString().toLowerCase();
        const c = city.toLowerCase();
        if (!(pc.includes(c) || c.includes(pc) || pc === c)) ok = false;
      }
      if (ok && category && category !== '') {
        const pc = (p.category || p.subcategory || '').toString().toLowerCase();
        const cc = category.toLowerCase();
        if (!(pc.includes(cc) || cc.includes(pc))) ok = false;
      }
      if (p.status && p.status !== 'active') ok = false;
      return ok;
    });
  }, [places, city, category]);

  const sections = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const p of filtered) {
      const key = p.category || p.subcategory || 'autres';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, title: key, items }));
  }, [filtered]);

  // Fallback to static sections if no dynamic data
  const fallbackSections = [
    { key: 'jardin', title: t('jardin'), items: ['Jardin Majorelle', 'Jardin de la Ménara', "Jardins de l'Agdal", 'Le Jardin Secret', 'Cyber Park Arsat Moulay Abdeslam', 'Palmeraie de Marrakech', 'Parc Lalla Hasna', "Oliveraie de la Ménara"] },
    { key: 'monuments', title: t('monuments'), items: ['Koutoubia', 'Médersa Ben Youssef', 'Palais de la Bahia', 'Palais El Badiî', 'Tombeaux Saadiens', 'Bab Agnaou', 'Bab Boujloud', 'Musée de Marrakech', 'Musée de Mouassine', 'Dar El Bacha', 'Maison de la Photographie', 'Musée Dar Si Saïd', "Musée de la Femme", 'Souk Semmarine', 'Souk des Teinturiers', 'Souk des Bijoutiers', 'Souk Haddadine', "Place des Épices", 'Place des Ferblantiers', 'Quartier de la Kasbah', 'Quartier de Mouassine', 'Quartier Mellah', 'Synagogue Lazama'] },
    { key: 'musees', title: t('musees'), items: ['Musée Yves Saint Laurent Marrakech', "Musée Mohammed VI pour la civilisation de l'eau au Maroc", 'Musée des Confluences – Dar El Bacha', 'Musée de Marrakech', 'Maison de la Photographie', 'Musée Dar Si Saïd', 'Musée de la Femme de Marrakech', 'Musée MACAAL', 'Musée Tiskiwin'] },
    { key: 'excursions', title: t('excursions'), items: ["Désert d'Agafay", "Vallée de l'Ourika", 'Setti Fatma', "Cascades d'Ouzoud", 'Lac Lalla Takerkoust', 'Plateau du Kik', 'Imlil', 'Parc national du Toubkal', 'Asni', 'Ouirgane', 'Aït Ben Haddou', 'Ouarzazate', 'Vallée du Zat', 'Palmeraie de Marrakech', 'Circuit en quad dans la Palmeraie', 'Balade à dos de chameau', 'Vol en montgolfière autour de Marrakech', 'Excursion en buggy'] },
    { key: 'experiences', title: t('experiences'), items: ['Dîner traditionnel marocain', 'Spectacle de fantasia', 'Hammam marocain traditionnel', 'Rooftop avec vue sur la médina', "Coucher de soleil à Jemaa el-Fna", "Dîner dans le désert d'Agafay", 'Balade en calèche', 'Spa traditionnel marocain', 'Dégustation de thé à la menthe', 'Découverte de la cuisine de rue de la médina', 'Balade nocturne dans la médina'] },
    { key: 'autres', title: t('autres'), items: ['Cafés', 'Restaurants', 'Parcs', 'Piscines', 'Hôtels', 'Salles de sport (Karaté, Yoga, Musculation)'] },
  ];

  const displaySections = sections.length > 0 ? sections : fallbackSections;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="font-display text-3xl font-semibold text-ink-900">{t('title')}</h1>
      <p className="mt-1.5 text-sm text-ink-500">{t('subtitle')}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <select className="rounded-full border border-ink-900/10 bg-white px-3 py-2 text-sm" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Ville</option>
          <option value="Marrakech">Marrakech</option>
          <option value="Casablanca">Casablanca</option>
          <option value="Rabat">Rabat</option>
          <option value="Fès">Fès</option>
          <option value="Agadir">Agadir</option>
        </select>
        <select className="rounded-full border border-ink-900/10 bg-white px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Catégorie</option>
          <option value="Jardin">Jardin</option>
          <option value="Monuments">Monuments</option>
          <option value="Musées">Musées</option>
          <option value="Excursions">Excursions</option>
          <option value="Expériences">Expériences</option>
        </select>
      </div>

      <div className="mt-10 space-y-12">
        {displaySections.map((section, idx) => (
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
              {(section.items as any[]).map((item: any) => (
                <article key={item.id || item.name || item} className="rounded-2xl border border-ink-900/[0.06] bg-white p-4 shadow-card transition-shadow hover:shadow-float">
                  <h3 className="font-medium text-ink-900">{item.name || item}</h3>
                  {item.city && <p className="mt-1 text-xs text-ink-400">{item.city}</p>}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
