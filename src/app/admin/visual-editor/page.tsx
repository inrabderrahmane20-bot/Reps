import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/admin-api';
import { DOCUMENTS, PAGE_DOCUMENTS } from '@/lib/visual-editor/types';
import { readDocument } from '@/lib/visual-editor/store';
import { locales, type Locale } from '@/i18n/config';

export const dynamic = 'force-dynamic';
const pages = ['Home','Discover','Search','Map','Services','Provider detail','Promotions','Communities','Community detail','Activities','Activity detail','Meetings','News','News detail','Places','Sell','Login','Register','Profile','Favorites','Messages','Provider dashboard','Privacy','Terms','Rules'];
export default async function VisualEditorIndex({ searchParams }: { searchParams: { locale?: string } }) {
  if (await requireAdminSession()) redirect('/admin');
  const locale = locales.includes(searchParams.locale as Locale) ? searchParams.locale as Locale : 'en';
  const documents = await Promise.all(DOCUMENTS.map(async entry => ({ ...entry, state: await readDocument(entry.id, locale) })));
  return <div className="max-w-5xl">
    <h1 className="font-display text-3xl font-semibold">Visual Editor</h1>
    <p className="mt-2 text-sm text-ink-600">Edit pages and shared components with Puck. Drafts stay private; only published changes appear on the site.</p>
    <div className="my-6 flex gap-2" aria-label="Content language">{locales.map(value => <Link key={value} href={`/admin/visual-editor?locale=${value}`} className={`rounded-full border px-4 py-2 text-sm ${value === locale ? 'bg-emerald-900 text-white' : 'bg-white'}`}>{value.toUpperCase()}</Link>)}</div>
    <h2 className="mb-4 text-lg font-semibold">Global components</h2>
    <div className="grid gap-4 md:grid-cols-2">{documents.filter(document => document.id === 'navbar' || document.id === 'footer').map(document => <Link key={document.id} href={`/admin/visual-editor/${document.id}?locale=${locale}`} className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm hover:border-emerald-600">
      <h3 className="text-xl font-semibold">{document.label}</h3>
      <p className="mt-2 text-sm text-ink-600">{document.state.published ? 'Published' : 'Current site default'}{document.state.draft && JSON.stringify(document.state.draft) !== JSON.stringify(document.state.published) ? ' · Unpublished draft' : ''}</p>
      <p className="mt-4 text-sm font-semibold text-emerald-900">Open editor →</p>
    </Link>)}</div>
    <p className="mt-4 text-sm text-ink-500">Navbar and Header share the same document. Each language has its own shared documents, used across its public pages.</p>
    <h2 className="mb-3 mt-10 text-lg font-semibold">Pages</h2>
    <p className="mb-4 text-sm text-ink-600">Edit page sections while keeping listings connected to their original data sources.</p>
    <div className="grid gap-4 md:grid-cols-2">{documents.filter(document => PAGE_DOCUMENTS.some(page => page.id === document.id)).map(document => <Link key={document.id} href={`/admin/visual-editor/${document.id}?locale=${locale}`} className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm hover:border-emerald-600"><h3 className="text-xl font-semibold">{document.label}</h3><p className="mt-2 text-sm text-ink-600">{document.state.published ? 'Published' : 'Current site default'}{document.state.draft && JSON.stringify(document.state.draft) !== JSON.stringify(document.state.published) ? ' / Unpublished draft' : ''}</p><p className="mt-4 text-sm font-semibold text-emerald-900">Open editor</p></Link>)}</div>
    <details className="mt-8"><summary>Remaining page inventory</summary><p className="mt-3 text-sm text-ink-600">{pages.filter(page => !PAGE_DOCUMENTS.some(document => document.label === page)).join(', ')}</p></details>
  </div>;
}
