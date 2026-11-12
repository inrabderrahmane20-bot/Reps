'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { NextIntlClientProvider } from 'next-intl';
import { Puck, usePuck, type Data, type Overrides } from '@measured/puck';
import '@measured/puck/puck.css';
import './visual-editor.css';
import { AuthProvider } from '@/context/auth-context';
import { visualConfig } from '@/components/visual-editor/config';
import { editorMessages } from '@/lib/visual-editor/defaults';
import type { DocumentId, EditorAction, VisualDocument } from '@/lib/visual-editor/types';
import type { Locale } from '@/i18n/config';

function EditorActions({ busy, save, reset }: { busy: boolean; save: (action: EditorAction, data: Data) => void; reset: () => void }) {
  const { appState } = usePuck();
  return <div className="ve-actions">
    <button type="button" disabled={busy} onClick={() => save('draft', appState.data)}>Save draft</button>
    <button type="button" disabled={busy} className="ve-publish" onClick={() => save('publish', appState.data)}>Publish</button>
    <button type="button" disabled={busy} onClick={reset}>Reset to default</button>
  </div>;
}
export default function VisualEditorClient({ id, locale, initial, defaults, fontClass }: { id: DocumentId; locale: Locale; initial: VisualDocument; defaults: Data; fontClass: string }) {
  const [document, setDocument] = useState(initial);
  const [initialData, setInitialData] = useState(initial.draft ?? initial.published ?? defaults);
  const [editorKey, setEditorKey] = useState(0);
  const [previewPath, setPreviewPath] = useState('/services');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const currentData = useRef(initialData);
  const savedData = useRef(JSON.stringify(initialData));
  const config = useMemo(() => visualConfig(id, locale, previewPath), [id, locale, previewPath]);
  const overrides: Partial<Overrides> = useMemo(() => ({ iframe: ({ children }) => (
    <div className={`${fontClass} moroccan-canvas`} dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: 300, fontFamily: 'var(--font-sans), sans-serif' }}
      onClickCapture={event => { if ((event.target as HTMLElement).closest('a,button')) { event.preventDefault(); event.stopPropagation(); } }}
      onSubmitCapture={event => { event.preventDefault(); event.stopPropagation(); }}>{children}</div>
  ) }), [fontClass, locale]);
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) { if (dirty) { event.preventDefault(); event.returnValue = ''; } }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  async function save(action: EditorAction, data: Data) {
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
      setMessage(action === 'draft' ? 'Draft saved. The public site is unchanged.' : action === 'publish' ? 'Published to all pages in this language.' : 'Default component restored on the public site.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Save failed.'); }
    finally { setBusy(false); }
  }
  function reset() {
    if (window.confirm('Restore the original component? This clears its saved draft and published layout for this language.')) void save('reset', currentData.current);
  }
  return <div className="ve-shell">
    <div className="ve-toolbar">
      <Link href={`/admin/visual-editor?locale=${locale}`}>← Visual Editor</Link>
      <strong>{id === 'navbar' ? 'Navbar / Header' : 'Footer'} · {locale.toUpperCase()}</strong>
      <label>Preview page <select value={previewPath} onChange={event => setPreviewPath(event.target.value)}><option value="/services">Standard page</option><option value="/">Home page</option></select></label>
      <span>{dirty ? 'Unsaved changes' : document.published ? 'Published' : 'Site default'}</span>
      <a href={`/${locale}${previewPath}`} target="_blank" rel="noreferrer">View public page ↗</a>
    </div>
    {message && <p className="ve-message" role="status">{message}</p>}
    {error && <p className="ve-error" role="alert">{error}</p>}
    <NextIntlClientProvider locale={locale} messages={editorMessages[locale]} timeZone="Africa/Casablanca">
      <AuthProvider>
        <Puck key={editorKey} config={config} data={initialData} headerTitle={id === 'navbar' ? 'Navbar / Header' : 'Footer'}
          onChange={data => { currentData.current = data; setDirty(JSON.stringify(data) !== savedData.current); }}
          onPublish={data => void save('publish', data)}
          overrides={{ ...overrides, headerActions: () => <EditorActions busy={busy} save={(action, data) => void save(action, data)} reset={reset} /> }} iframe={{ enabled: true }}
          viewports={[{ width: 390, height: 'auto', label: 'Mobile', icon: 'Smartphone' }, { width: 768, height: 'auto', label: 'Tablet', icon: 'Tablet' }, { width: 1440, height: 'auto', label: 'Desktop', icon: 'Monitor' }]} />
      </AuthProvider>
    </NextIntlClientProvider>
  </div>;
}
