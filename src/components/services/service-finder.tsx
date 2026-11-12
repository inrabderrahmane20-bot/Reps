'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Building, Building2, Car, Check, Home, Bike, Waves, Zap, ChevronDown, Layers } from 'lucide-react';
import { getCategoryLabel, type SearchCategoryNode } from '@/lib/category-tree';

function optionIcon(node: SearchCategoryNode) {
  const key = node.slug;
  return /appartement/.test(key) ? Building : /maison/.test(key) ? Home : /immeuble/.test(key) ? Building2
    : /auto|voiture/.test(key) ? Car : /moto|velo/.test(key) ? Bike : /piscine/.test(key) ? Waves : Layers;
}

export function ServiceFinder({ group, onApply, onChange }: {
  group: SearchCategoryNode;
  onApply: (category: SearchCategoryNode) => void;
  onChange: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations('services');
  const [tradeId, setTradeId] = useState('');
  const [selection, setSelection] = useState<string[]>([]);
  const trades = group.children ?? [];
  const trade = trades.find(node => node.id === tradeId) ?? trades[0] ?? group;
  const levels: { parent: SearchCategoryNode; choices: SearchCategoryNode[]; selected?: SearchCategoryNode }[] = [];
  let selected = trade;
  // Walk every level of the current admin tree. Single wrapper nodes become headings.
  while (selected.children?.length) {
    const parent: SearchCategoryNode = selected.children.length === 1 && selected.children[0].children?.length
      ? selected.children[0] : selected;
    const choices = parent.children ?? [];
    const next = choices.find(node => node.id === selection[levels.length]);
    levels.push({ parent, choices, selected: next });
    if (!next) break;
    selected = next;
  }
  const Icon = /electric/.test(trade.slug) ? Zap : optionIcon(trade);
  return (
    <section className="svc-finder" aria-label={getCategoryLabel(group, locale)}>
      <p className="svc-finder-path"><span>{getCategoryLabel(group, locale)}</span>
        {trade.id !== group.id && <><span aria-hidden="true">/</span>{getCategoryLabel(trade, locale)}</>}
      </p>
      <div className="svc-trade-select">
        <Icon aria-hidden="true" size={30} />
        {trades.length ? <>
          <label><span>{t('tradeLabel')}</span>
            <select value={trade.id} onChange={event => { setTradeId(event.target.value); setSelection([]); onChange(); }}>
              {trades.map(node => <option key={node.id} value={node.id}>{getCategoryLabel(node, locale)}</option>)}
            </select>
          </label>
          <ChevronDown aria-hidden="true" size={22} />
        </> : <span>{getCategoryLabel(group, locale)}</span>}
      </div>
      <div className="svc-option-levels">
        {levels.map((level, depth) => <fieldset className="svc-option-level" key={level.parent.id}>
          <legend>{getCategoryLabel(level.parent, locale)}</legend>
          <div className="svc-installations">
            {level.choices.map(node => {
              const OptionIcon = optionIcon(node);
              const active = level.selected?.id === node.id;
              return <button type="button" key={node.id} aria-pressed={active} onClick={() => {
                setSelection([...selection.slice(0, depth), ...(active ? [] : [node.id])]);
                onChange();
              }}>
                <OptionIcon size={30} strokeWidth={1.6} aria-hidden="true" />
                <span>{getCategoryLabel(node, locale)}</span>
                {active && <Check className="svc-option-check" size={19} aria-hidden="true" />}
              </button>;
            })}
          </div>
        </fieldset>)}
      </div>
      <button type="button" className="svc-find-professionals" onClick={() => onApply(selected)}>
        {t('seeProfessionals')}<ArrowRight size={23} className="flip-rtl" aria-hidden="true" />
      </button>
    </section>
  );
}
