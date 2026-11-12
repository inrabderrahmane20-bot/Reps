'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Building, Building2, Car, Check, Home, Bike, Waves, Zap, ChevronDown, Layers } from 'lucide-react';
import { getCategoryLabel, type SearchCategoryNode } from '@/lib/category-tree';

export function ServiceFinder({ categories, selected, onApply }: {
  categories: SearchCategoryNode[];
  selected: string | null;
  onApply: (category: string) => void;
}) {
  const locale = useLocale();
  const t = useTranslations('services');
  const [tradeId, setTradeId] = useState('');
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const group = categories.find(node => getCategoryLabel(node, locale) === selected);
  const trades = group?.children ?? [];
  const trade = trades.find(node => node.id === tradeId) ?? trades[0];
  const branch = trade?.children?.length === 1 && trade.children[0].children?.length
    ? trade.children[0] : trade;
  const choices = branch?.children ?? [];
  const choice = choiceId === null ? choices.find(node => node.slug === 'maison') : choices.find(node => node.id === choiceId);
  if (!group || !trade) return null;
  const icons = [Building, Home, Building2, Car, Bike, Waves];
  return (
    <section className="svc-finder" aria-label={t('refineService')}>
      <p className="svc-finder-path"><span>{getCategoryLabel(group, locale).toLocaleLowerCase(locale)}</span><span aria-hidden>/</span>{getCategoryLabel(trade, locale)}</p>
      <div className="svc-trade-select">
        <Zap aria-hidden size={30} />
        <label><span>{t('tradeLabel')}</span>
          <select value={trade.id} onChange={event => { setTradeId(event.target.value); setChoiceId(null); }}>
            {trades.map(node => <option key={node.id} value={node.id}>{getCategoryLabel(node, locale)}</option>)}
          </select>
        </label>
        <ChevronDown aria-hidden size={22} />
      </div>
      {choices.length > 0 && <>
        <h2>{branch !== trade && !/installation|intervention/i.test(branch!.slug) ? getCategoryLabel(branch!, locale) : t('refineService')}</h2>
        <div className="svc-installations">
          {choices.map((node, index) => {
            const Icon = /appartement/i.test(node.slug) ? Building : /maison/i.test(node.slug) ? Home : /immeuble/i.test(node.slug) ? Building2 : /auto/i.test(node.slug) ? Car : /moto|velo/i.test(node.slug) ? Bike : /piscine/i.test(node.slug) ? Waves : icons[index] ?? Layers;
            const active = choice?.id === node.id;
            return <button type="button" key={node.id} aria-pressed={active} onClick={() => setChoiceId(active ? '' : node.id)}>
              <Icon size={30} strokeWidth={1.6} aria-hidden />
              <span>{getCategoryLabel(node, locale)}</span>
              {active && <Check className="svc-option-check" size={19} aria-hidden />}
            </button>;
          })}
        </div>
      </>}
      <button type="button" className="svc-find-professionals" onClick={() => onApply((choice ?? trade).labels.fr)}>
        {t('seeProfessionals')}<ArrowRight size={23} className="flip-rtl" aria-hidden />
      </button>
    </section>
  );
}
