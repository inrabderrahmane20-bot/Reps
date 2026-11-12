'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePuck, type Data, setDeep } from '@measured/puck';

type Leaf = { path: string; value: string | boolean };
function leaves(value: unknown, prefix = ''): Leaf[] {
  if (typeof value === 'string' || typeof value === 'boolean') return [{ path: prefix, value }];
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
}
function flatten(items: Data['content']): Data['content'] {
  return items.flatMap(item => [item, ...Object.values(item.props).flatMap(value => Array.isArray(value) && value.every(child => child?.type && child?.props) ? flatten(value) : [])]);
}
function read(value: unknown, path: string): unknown {
  return path.split('.').reduce<any>((node, key) => node?.[key], value);
}
function updateItems(items: Data['content'], id: string, path: string, value: string | boolean): Data['content'] {
  return items.map(item => item.props.id === id ? { ...item, props: { ...item.props, content: setDeep(structuredClone(item.props.content), path, value) } } : { ...item, props: Object.fromEntries(Object.entries(item.props).map(([key, child]) => [key, Array.isArray(child) && child.every(node => node?.type && node?.props) ? updateItems(child, id, path, value) : child])) as typeof item.props });
}
export function ElementInspector({ defaults }: { defaults: Data }) {
  const { appState, dispatch } = usePuck();
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [path, setPath] = useState('');
  const [blockId, setBlockId] = useState('');
  const [computed, setComputed] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const blocks = useMemo(() => flatten(appState.data.content).filter(item => item.props.content), [appState.data.content]);
  const block = blocks.find(item => item.props.id === blockId) ?? blocks[0];
  const entries = leaves(block?.props.content);
  const selected = entries.find(item => item.path === path);
  const original = read(flatten(defaults.content).find(item => item.type === block?.type)?.props.content, path);
  const stopPicking = useCallback(() => {
    setPicking(false);
    dispatch({ type: 'setUi', ui: { previewMode: 'edit' }, recordHistory: false });
  }, [dispatch]);
  useEffect(() => {
    if (!picking) return;
    const frames = Array.from(document.querySelectorAll('iframe'));
    const cleanups: (() => void)[] = [];
    for (const frame of frames) {
      const doc = frame.contentDocument;
      if (!doc) continue;
      const pick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const root = target.closest<HTMLElement>('[data-visual-block]');
        if (!root) return;
        event.preventDefault(); event.stopImmediatePropagation();
        const item = blocks.find(item => item.props.id === root.dataset.visualBlock);
        if (!item) return;
        setBlockId(item.props.id);
        const all = leaves(item.props.content);
        const text = target.textContent?.trim();
        const link = target.closest('a');
        const image = target.closest('img,svg');
        let match = all.find(entry => typeof entry.value === 'string' && entry.value !== '' && entry.value.trim() === text);
        if (image) match = all.find(entry => entry.path === 'brandImage' || entry.path === 'src');
        if (!match && link) match = all.find(entry => entry.path.endsWith('.label') && entry.value === link.textContent?.trim());
        setPath(match?.path ?? '');
        setNotice(match ? '' : target.closest('.svc-cat-card,[data-category-tree-browser]') ? 'Category labels and images are managed in Admin Categories. This block uses that same live category tree.' : 'This is a live site control or layout element. Its appearance is shown below; its behavior stays managed by the site. Select an editable content item from the list.');
        doc.querySelectorAll('[data-ve-picked]').forEach(element => element.removeAttribute('data-ve-picked'));
        target.setAttribute('data-ve-picked', 'true');
        const css = frame.contentWindow!.getComputedStyle(target);
        setComputed(Object.fromEntries(['font-family','font-size','font-weight','color','background-color','border','border-radius','padding','margin','width','height','text-align','box-shadow'].map(key => [key, css.getPropertyValue(key)])));
        stopPicking(); setOpen(true);
      };
      doc.addEventListener('click', pick, true);
      cleanups.push(() => doc.removeEventListener('click', pick, true));
    }
    return () => cleanups.forEach(cleanup => cleanup());
  }, [picking, blocks, stopPicking]);
  function update(value: string | boolean) {
    if (!block || !selected) return;
    dispatch({ type: 'setData', data: previous => ({ ...previous, content: updateItems(previous.content, block.props.id, path, value) }) });
  }
  return <>
    <button type="button" onClick={() => setOpen(!open)}>Individual elements</button>
    <button type="button" aria-pressed={picking} onClick={() => { if (picking) stopPicking(); else { setOpen(false); setPicking(true); dispatch({ type: 'setUi', ui: { previewMode: 'interactive' }, recordHistory: false }); } }}>{picking ? 'Cancel picker' : 'Pick an element'}</button>
    {picking && <div className="ve-pick-message" role="status">Click text, a link, or the logo inside the preview to inspect it.</div>}
    {open && <aside className="ve-inspector" aria-label="Individual element inspector">
      <div className="ve-inspector-title"><strong>Individual elements</strong><button type="button" onClick={() => setOpen(false)}>Close</button></div>
      <p>Select an item to edit it independently. Changes remain drafts until you publish.</p>
      <label>Component<select aria-label="Component" value={block?.props.id ?? ''} onChange={event => { setBlockId(event.target.value); setPath(''); setComputed({}); }}>{blocks.map(item => <option key={item.props.id} value={item.props.id}>{item.type} / {item.props.id}</option>)}</select></label>
      <label>Content item<select aria-label="Content item" size={8} value={path} onChange={event => { setPath(event.target.value); setComputed({}); setNotice(''); }}><option value="">Select an item</option>{entries.map(entry => <option key={entry.path} value={entry.path}>{entry.path} — {String(entry.value) || '(empty)'}</option>)}</select></label>
      {notice && <p>{notice}</p>}
      {selected && <>
        <label>Original site default<output>{String(original ?? '(no default)') || '(empty)'}</output></label>
        <label>Current value {typeof selected.value === 'boolean' ? <input type="checkbox" checked={selected.value} onChange={event => update(event.target.checked)} /> : <textarea value={selected.value} onChange={event => update(event.target.value)} />}</label>
        <p>{selected.value === original ? 'Matches original default' : 'Changed from original default'}</p>
        <button type="button" disabled={original === undefined || selected.value === original} onClick={() => update(original as string | boolean)}>Restore this value</button>
        {path === 'brandImage' && <p>Use Logo image in the component fields to upload a replacement. An empty URL uses the original site logo.</p>}
      </>}
      {Object.keys(computed).length > 0 && <details open><summary>Existing appearance at this preview size</summary><p>Resolved from the site styles. These are reference values, not new overrides.</p><dl>{Object.entries(computed).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></details>}
    </aside>}
  </>;
}

