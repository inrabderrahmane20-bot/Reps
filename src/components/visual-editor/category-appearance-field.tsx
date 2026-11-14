'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Field } from '@measured/puck';
import type { Locale } from '@/i18n/config';
import { getCategoryLabel, type SearchCategoryNode } from '@/lib/category-tree';
import { homeSections } from '@/lib/home-categories';
import { serviceRoots } from '@/lib/services-browser';
import { CATEGORY_ICONS, type CategoryAppearance } from '@/lib/category-appearance';
import { ImageUpload } from './content-blocks';

function CategoryAppearanceField({ value = [], onChange, page, locale }: {
  value?: CategoryAppearance[]; onChange: (value: CategoryAppearance[]) => void;
  page: 'home' | 'services'; locale: Locale;
}) {
  const [tree, setTree] = useState<SearchCategoryNode[]>([]);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const latestValue = useRef(value);
  latestValue.current = value;
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/categories/tree/', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => setTree(data.categories))
      .catch(() => { if (!controller.signal.aborted) setError('Categories could not be loaded. Reopen these settings to try again.'); });
    return () => controller.abort();
  }, []);
  const choices = useMemo(() => {
    if (page === 'home') return homeSections(tree).flatMap(section => [
      { id: section.root.id, label: getCategoryLabel(section.root, locale) },
      ...section.items.map(node => ({ id: node.id, label: `${getCategoryLabel(section.root, locale)} / ${getCategoryLabel(node, locale)}` })),
    ]).filter((node, index, nodes) => nodes.findIndex(other => other.id === node.id) === index);
    const flatten = (nodes: SearchCategoryNode[], parent = ''): { id: string; label: string }[] => nodes.flatMap(node => {
      const label = `${parent}${getCategoryLabel(node, locale)}`;
      return [{ id: node.id, label }, ...flatten(node.children ?? [], `${label} / `)];
    });
    return flatten(serviceRoots(tree));
  }, [tree, page, locale]);
  const selected = value.find(entry => entry.categoryId === selectedId);
  const setting: CategoryAppearance = selected ?? { categoryId: selectedId, mobileSize: 'regular', icon: 'Grid', iconSrc: '' };
  function update(patch: Partial<CategoryAppearance>) {
    onChange([...value.filter(entry => entry.categoryId !== selectedId), { ...setting, ...patch }]);
  }
  function updateIcon(categoryId: string, iconSrc: string) {
    const current = latestValue.current.find(entry => entry.categoryId === categoryId);
    // Uploads can finish after another category is selected or reset.
    if (current) onChange([...latestValue.current.filter(entry => entry.categoryId !== categoryId), { ...current, iconSrc }]);
  }
  return <div className="ve-category-appearance">
    <p>Set each category separately for this page and language. Changes apply on phones only. Switch back to Regular to restore its photo.</p>
    {error && <p role="alert">{error}</p>}
    <label>Find a category<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <label>Category<select value={selectedId} onChange={event => setSelectedId(event.target.value)}>
      <option value="">Choose a category</option>
      {choices.filter(node => node.id === selectedId || node.label.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale))).map(node => <option key={node.id} value={node.id}>{node.label}{value.find(entry => entry.categoryId === node.id)?.mobileSize === 'icon' ? ' · Icon' : ''}</option>)}
    </select></label>
    {selectedId && <>
      <label>Mobile image size<select value={setting.mobileSize} onChange={event => update({ mobileSize: event.target.value as CategoryAppearance['mobileSize'] })}>
        <option value="regular">Regular photo</option><option value="icon">Icon sized</option>
      </select></label>
      {setting.mobileSize === 'icon' && <>
        <label>Icon<select value={setting.icon} onChange={event => update({ icon: event.target.value as CategoryAppearance['icon'] })}>
          {CATEGORY_ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
        </select></label>
        <p>Or upload your own icon (a transparent PNG works well). It takes priority over the icon above.</p>
        <ImageUpload key={selectedId} value={setting.iconSrc} onChange={iconSrc => updateIcon(setting.categoryId, iconSrc)} />
        {setting.iconSrc && <button type="button" onClick={() => update({ iconSrc: '' })}>Use the built-in icon</button>}
      </>}
      {selected && <button type="button" onClick={() => onChange(value.filter(entry => entry.categoryId !== selectedId))}>Reset this category</button>}
    </>}
  </div>;
}

export function categoryAppearanceField(page: 'home' | 'services', locale: Locale): Field {
  return { type: 'custom', label: 'Category images · mobile', render: ({ value, onChange }) => <CategoryAppearanceField value={value} onChange={onChange} page={page} locale={locale} /> };
}
