'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { NextIntlClientProvider } from 'next-intl';
import { Puck, usePuck, type Data, type Overrides } from '@measured/puck';
import '@measured/puck/puck.css';
import './visual-editor.css';
import { AuthProvider } from '@/context/auth-context';
import { ElementInspector } from '@/components/visual-editor/element-inspector';
import { visualConfig } from '@/components/visual-editor/config';
import { editorMessages } from '@/lib/visual-editor/defaults';
import { DOCUMENTS, documentPath, PAGE_DOCUMENTS } from '@/lib/visual-editor/types';
import type { DocumentId, EditorAction, VisualDocument } from '@/lib/visual-editor/types';
import type { Locale } from '@/i18n/config';

function EditorActions({ busy, save, reset, defaults }: { defaults: Data; busy: boolean; save: (action: EditorAction, data: Data) => void; reset: () => void }) {
  const { appState, dispatch } = usePuck();
  return <div className="ve-actions">
    <ElementInspector defaults={defaults} />
    <button type="button" onClick={() => dispatch({ type: 'setUi', ui: { leftSideBarVisible: !appState.ui.leftSideBarVisible, rightSideBarVisible: !appState.ui.rightSideBarVisible }, recordHistory: false })}>Toggle side panels</button>
    <button type="button" onClick={event => {
      const width = Math.max(320, Math.floor(event.currentTarget.closest('.ve-shell')!.getBoundingClientRect().width - 64));
      dispatch({ type: 'setUi', ui: { leftSideBarVisible: false, rightSideBarVisible: false, viewports: { ...appState.ui.viewports, current: { width, height: 'auto' } } }, recordHistory: false });
    }}>Actual-size canvas</button>
    <button type="button" onClick={() => dispatch({ type: 'setUi', ui: { viewports: { ...appState.ui.viewports, current: { width: 960, height: 'auto' } } }, recordHistory: false })}>960px preview</button>
    <button type="button" disabled={busy} onClick={() => save('draft', appState.data)}>Save draft</button>
    <button type="button" disabled={busy} className="ve-publish" onClick={() => save('publish', appState.data)}>Publish</button>
    <button type="button" disabled={busy} onClick={reset}>Reset to default</button>
  </div>;
}
export default function VisualEditorClient({ id, locale, initial, defaults, fontClass }: { id: DocumentId; locale: Locale; initial: VisualDocument; defaults: Data; fontClass: string }) {
  const [expanded, setExpanded] = useState(false);
  const [document, setDocument] = useState(initial);
  const [initialData, setInitialData] = useState(initial.draft ?? initial.published ?? defaults);
  const [editorKey, setEditorKey] = useState(0);
  const [previewPath, setPreviewPath] = useState(documentPath(id));
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const currentData = useRef(initialData);
  const savedData = useRef(JSON.stringify(initialData));
  const config = useMemo(() => visualConfig(id, locale, previewPath), [id, locale, previewPath]);
  const overrides: Partial<Overrides> = useMemo(() => ({ iframe: ({ children }) => (
    <div className={`${fontClass} moroccan-canvas`} dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: 300, fontFamily: 'var(--font-sans), sans-serif' }}
      onClickCapture={event => { if ((event.target as HTMLElement).closest('a,button')) { event.preventDefault(); } }}
      onSubmitCapture={event => { event.preventDefault(); event.stopPropagation(); }}><style>{'[data-ve-picked="true"] { outline: 2px solid #00a58a !important; outline-offset: 3px; }'}</style>{children}</div>
  ) }), [fontClass, locale]);
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) { if (dirty) { event.preventDefault(); event.returnValue = ''; } }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const save = useCallback(async (action: EditorAction, data: Data) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/admin/visual-editor/documents/${id}/?locale=${locale}`, {
        method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, revision: document.revision, ...(action !== 'reset' ? { data } : {}) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Save failed.');
      setDocument(result.document);
      if (action === 'reset') {
        setInitialData(defaults); currentData.current = defaults; savedData.current = JSON.stringify(defaults); setEditorKey(key => key + 1); setDirty(false);
      } else {
        savedData.current = JSON.stringify(data); setDirty(JSON.stringify(currentData.current) !== savedData.current);
      }
      setMessage(action === 'draft' ? 'Draft saved. The public site is unchanged.' : action === 'publish' ? (PAGE_DOCUMENTS.some(page => page.id === id) ? 'Page published in this language.' : 'Published to all pages in this language.') : (PAGE_DOCUMENTS.some(page => page.id === id) ? 'Original page restored on the public site.' : 'Default component restored on the public site.'));
    } catch (error) { setError(error instanceof Error ? error.message : 'Save failed.'); }
    finally { setBusy(false); }
  }, [defaults, document.revision, id, locale]);
  const reset = useCallback(() => {
    if (window.confirm('Restore the original component? This clears its saved draft and published layout for this language.')) void save('reset', currentData.current);
  }, [save]);
  const editorOverrides = useMemo(() => ({ ...overrides, headerActions: () => <EditorActions defaults={defaults} busy={busy} save={(action: EditorAction, data: Data) => void save(action, data)} reset={reset} /> }), [overrides, defaults, busy, save, reset]);
  return <div className={`ve-shell${expanded ? " ve-expanded" : ""}`}>
    <div className="ve-toolbar">
      <Link href={`/admin/visual-editor?locale=${locale}`}>← Visual Editor</Link>
      <strong>{DOCUMENTS.find(document => document.id === id)!.label} · {locale.toUpperCase()}</strong>
      {!PAGE_DOCUMENTS.some(page => page.id === id) && <label>Preview page <select value={previewPath} onChange={event => setPreviewPath(event.target.value)}><option value="/services">Standard page</option><option value="/">Home page</option></select></label>}
      <button type="button" onClick={() => setExpanded(value => !value)}>{expanded ? "Exit expanded workspace" : "Expand workspace"}</button>
      <span>{dirty ? 'Unsaved changes' : document.published ? 'Published' : 'Site default'}</span>
      <a href={`/${locale}${previewPath === "/" ? "" : previewPath}`} target="_blank" rel="noreferrer">View public page ↗</a>
    </div>
    <p className="ve-zoom-help">Expand the workspace, then choose Actual-size canvas for a readable 100% preview. Use the percentage control to zoom out, or the device controls to check responsive layouts.</p>
    {message && <p className="ve-message" role="status">{message}</p>}
    {error && <p className="ve-error" role="alert">{error}</p>}
    <NextIntlClientProvider locale={locale} messages={editorMessages[locale]} timeZone="Africa/Casablanca">
      <AuthProvider>
        <Puck key={editorKey} config={config} data={initialData} headerTitle={DOCUMENTS.find(document => document.id === id)!.label}
          onChange={data => { currentData.current = data; setDirty(JSON.stringify(data) !== savedData.current); }}
          onPublish={data => void save('publish', data)}
          overrides={editorOverrides} iframe={{ enabled: true }}
          viewports={[{ width: 390, height: 'auto', label: 'Mobile', icon: 'Smartphone' }, { width: 768, height: 'auto', label: 'Tablet', icon: 'Tablet' }, { width: 1440, height: 'auto', label: 'Desktop', icon: 'Monitor' }]} />
      </AuthProvider>
    </NextIntlClientProvider>
  </div>;
}
