'use client';

import { FormEvent, useState } from 'react';
import { Check, ClipboardCheck, LogOut, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useDemoState } from '@/components/layout/demo-state-provider';
import { createDemoId, DemoUser, ServiceSubmission } from '@/lib/demo-store';

const categories = ['Plumber', 'Electrician', 'House cleaning', 'Painting', 'Beauty', 'Childcare'];

export default function ProfilePage() {
  
  const { state, setState } = useDemoState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [notice, setNotice] = useState('');
  const [service, setService] = useState({ category: categories[0], title: '', description: '', area: 'Marrakech city', price: '' });
  
  function signIn(event: FormEvent) {
    event.preventDefault();
    const user: DemoUser = { name: name.trim() || 'Marrakech neighbour', email: email.trim() || 'you@example.com', role: 'client', city: 'Marrakech' };
    setState({ ...state, user });
    setNotice('You are signed in. Your client profile is ready.');
  }
  
  function switchToProfessional() {
    if (!state.user) return;
    setState({ ...state, user: { ...state.user, role: 'professional' } });
    setNotice('Professional mode is ready. Submit your service for review below.');
  }
  
  function submitService(event: FormEvent) {
    event.preventDefault();
    if (!state.user || !service.title.trim() || !service.description.trim()) return;
    const submission: ServiceSubmission = {
      id: createDemoId('service'),
      ownerEmail: state.user.email,
      name: state.user.name,
      category: service.category,
      title: service.title,
      description: service.description,
      serviceArea: service.area,
      priceRange: service.price || 'Price on request',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setState({ ...state, submissions: [submission, ...state.submissions], notificationRead: false });
    setService({ ...service, title: '', description: '', price: '' });
    setNotice('Submitted to the Medina admin team for verification.');
  }
  
  function approveSubmission(id: string) {
    setState({ ...state, submissions: state.submissions.map((item) => item.id === id ? { ...item, status: 'approved' } : item), notificationRead: false });
    setNotice('Service approved and published in Services and Map.');
  }
  
  function rejectSubmission(id: string) {
    setState({ ...state, submissions: state.submissions.map((item) => item.id === id ? { ...item, status: 'rejected' } : item) });
    setNotice('Submission rejected in the demo admin queue.');
  }
  
  function signOut() {
    setState({ ...state, user: null });
    setAdminMode(false);
    setNotice('Signed out of the demo account.');
  }
  
  if (!state.user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 md:px-8">
        <div className="rounded-3xl bg-white p-7 shadow-card md:p-10">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-majorelle-100 text-majorelle-700"><UserRound size={24} /></div>
          <p className="mt-7 text-sm font-semibold uppercase tracking-[0.16em] text-clay-500">Welcome to Medina</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink-900">Your city profile</h1>
          <p className="mt-3 text-sm leading-6 text-ink-500">Sign in as a normal client first. You can become a professional later without creating a second account.</p>
          <form onSubmit={signIn} className="mt-8 space-y-4">
            <label className="block text-sm font-semibold text-ink-800">Name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-ink-900/10 px-4 py-3" placeholder="Your name" /></label>
            <label className="block text-sm font-semibold text-ink-800">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-ink-900/10 px-4 py-3" placeholder="you@example.com" /></label>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-majorelle-600 px-5 py-3 font-semibold text-white hover:bg-majorelle-700"><Sparkles size={17} /> Continue as client</button>
          </form>
          <p className="mt-4 text-xs text-ink-400">Demo mode: no account or password is sent anywhere.</p>
        </div>
      </div>
    );
  }
  
  const pending = state.submissions.filter((item) => item.status === 'pending');
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 md:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-clay-500">Account centre</p><h1 className="mt-2 font-display text-4xl font-semibold text-ink-900">Hello, {state.user.name}</h1><p className="mt-2 text-sm text-ink-500">{state.user.email} · {state.user.city}</p></div><button type="button" onClick={signOut} className="inline-flex items-center gap-2 self-start rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-100"><LogOut size={16} /> Sign out</button></div>
      {notice && <div className="rounded-xl border border-saffron-400/40 bg-saffron-50 px-4 py-3 text-sm font-medium text-ink-800">{notice}</div>}
      <section className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
        <div className="rounded-3xl bg-white p-6 shadow-card"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-majorelle-100 text-majorelle-700"><UserRound size={21} /></div><div><h2 className="font-display text-2xl font-semibold">Your profile</h2><span className="text-sm capitalize text-ink-500">{state.user.role} account</span></div></div><div className="mt-6 rounded-2xl bg-sand-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-ink-400">Current access</p><p className="mt-2 text-sm leading-6 text-ink-700">{state.user.role === 'client' ? 'Discover neighbourhoods, save providers and join activities.' : 'Your professional profile can receive service requests after approval.'}</p></div>{state.user.role === 'client' && <button type="button" onClick={switchToProfessional} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-majorelle-600 px-4 py-3 text-sm font-semibold text-majorelle-700 hover:bg-majorelle-50"><ShieldCheck size={17} /> I offer a service</button>}{state.user.role === 'professional' && <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><ShieldCheck size={17} /> Professional mode enabled</div>}</div>
        {state.user.role === 'professional' && <form onSubmit={submitService} className="rounded-3xl bg-ink-900 p-6 text-white shadow-card"><div className="flex items-center gap-3"><ClipboardCheck className="text-saffron-400" size={22} /><div><h2 className="font-display text-2xl font-semibold">List a service</h2><p className="text-sm text-ink-300">Admins review each listing before it goes live.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-ink-200">Category<select value={service.category} onChange={(event) => setService({ ...service, category: event.target.value })} className="mt-2 w-full rounded-xl border-0 bg-white/10 px-3 py-3 text-white">{categories.map((category) => <option key={category} className="text-ink-900">{category}</option>)}</select></label><label className="text-sm font-medium text-ink-200">Service title<input required value={service.title} onChange={(event) => setService({ ...service, title: event.target.value })} className="mt-2 w-full rounded-xl border-0 bg-white/10 px-3 py-3 text-white placeholder:text-ink-400" placeholder="e.g. Reliable home plumbing" /></label></div><label className="mt-3 block text-sm font-medium text-ink-200">Description<textarea required value={service.description} onChange={(event) => setService({ ...service, description: event.target.value })} className="mt-2 min-h-24 w-full rounded-xl border-0 bg-white/10 px-3 py-3 text-white placeholder:text-ink-400" placeholder="What do you offer?" /></label><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-ink-200">Service area<input value={service.area} onChange={(event) => setService({ ...service, area: event.target.value })} className="mt-2 w-full rounded-xl border-0 bg-white/10 px-3 py-3 text-white" /></label><label className="text-sm font-medium text-ink-200">Price range<input value={service.price} onChange={(event) => setService({ ...service, price: event.target.value })} className="mt-2 w-full rounded-xl border-0 bg-white/10 px-3 py-3 text-white placeholder:text-ink-400" placeholder="150–400 MAD" /></label></div><button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-saffron-400 px-4 py-3 text-sm font-bold text-ink-900 hover:bg-saffron-300"><ClipboardCheck size={17} /> Send for verification</button></form>}
      </section>
      {state.submissions.length > 0 && <section className="rounded-3xl bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold">Your submissions</h2><p className="mt-1 text-sm text-ink-500">Track every service you have sent to the admin team.</p></div><button type="button" onClick={() => setAdminMode(!adminMode)} className="rounded-full border border-ink-900/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink-600 hover:bg-sand-50">{adminMode ? 'Close admin review' : 'Open demo admin review'}</button></div><div className="mt-5 space-y-3">{state.submissions.map((item) => <div key={item.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-ink-900/10 p-4 sm:flex-row sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-ink-900">{item.title}</p><span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${item.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : item.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-saffron-50 text-ink-700'}`}>{item.status}</span></div><p className="mt-1 text-sm text-ink-500">{item.category} · {item.serviceArea}</p></div>{adminMode && item.status === 'pending' && <div className="flex gap-2"><button type="button" onClick={() => approveSubmission(item.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><Check size={14} /> Approve</button><button type="button" onClick={() => rejectSubmission(item.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Reject</button></div>}</div>)}</div>{adminMode && pending.length > 0 && <p className="mt-4 text-xs font-medium text-ink-400">Demo admin queue: {pending.length} pending review{pending.length === 1 ? '' : 's'}.</p>}</section>}
    </div>
  );
}
/*
  import { FormEvent, useState } from 'react';
  import { Check, ClipboardCheck, LogOut, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
  import { useDemoState } from '@/components/layout/demo-state-provider';
  import { createDemoId, DemoUser, ServiceSubmission } from '@/lib/demo-store';

  const categories = ['Plumber', 'Electrician', 'House cleaning', 'Painting', 'Beauty', 'Childcare'];

  const { state, setState } = useDemoState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [notice, setNotice] = useState('');
  const [service, setService] = useState({ category: categories[0], title: '', description: '', area: 'Marrakech city', price: '' });

  function signIn(event: FormEvent) {
    event.preventDefault();
    const user: DemoUser = { name: name.trim() || 'Marrakech neighbour', email: email.trim() || 'you@example.com', role: 'client', city: 'Marrakech' };
    setState({ ...state, user });
    setNotice('You are signed in. Your client profile is ready.');
  }

  function switchToProfessional() {
    if (!state.user) return;
    setState({ ...state, user: { ...state.user, role: 'professional' } });
    setNotice('Professional mode is ready. Submit your service for review below.');
  }

  function submitService(event: FormEvent) {
    event.preventDefault();
    if (!state.user || !service.title.trim() || !service.description.trim()) return;
    const submission: ServiceSubmission = {
      id: createDemoId('service'),
      ownerEmail: state.user.email,
      name: state.user.name,
      category: service.category,
      title: service.title,
      description: service.description,
      serviceArea: service.area,
      priceRange: service.price || 'Price on request',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setState({ ...state, submissions: [submission, ...state.submissions], notificationRead: false });
    setService({ ...service, title: '', description: '', price: '' });
    setNotice('Submitted to the Medina admin team for verification.');
  }

  function approveSubmission(id: string) {
    setState({
      ...state,
      submissions: state.submissions.map((item) => item.id === id ? { ...item, status: 'approved' } : item),
      notificationRead: false,
    });
    setNotice('Service approved and published in Services and Map.');
  }

  function rejectSubmission(id: string) {
    setState({ ...state, submissions: state.submissions.map((item) => item.id === id ? { ...item, status: 'rejected' } : item) });
    setNotice('Submission rejected in the demo admin queue.');
  }

  function signOut() {
    setState({ ...state, user: null });
    setAdminMode(false);
    setNotice('Signed out of the demo account.');
  }

  if (!state.user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 md:px-8">
        <div className="rounded-3xl bg-white p-7 shadow-card md:p-10">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-majorelle-100 text-majorelle-700"><UserRound size={24} /></div>
          <p className="mt-7 text-sm font-semibold uppercase tracking-[0.16em] text-clay-500">Welcome to Medina</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink-900">Your city profile</h1>
          <p className="mt-3 text-sm leading-6 text-ink-500">Sign in as a normal client first. You can become a professional later without creating a second account.</p>
          <form onSubmit={signIn} className="mt-8 space-y-4">
            <label className="block text-sm font-semibold text-ink-800">Name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-ink-900/10 px-4 py-3" placeholder="Your name" /></label>
            <label className="block text-sm font-semibold text-ink-800">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-ink-900/10 px-4 py-3" placeholder="you@example.com" /></label>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-majorelle-600 px-5 py-3 font-semibold text-white hover:bg-majorelle-700"><Sparkles size={17} /> Continue as client</button>
          </form>
          <p className="mt-4 text-xs text-ink-400">Demo mode: no account or password is sent anywhere.</p>
        </div>
      </div>
    );
  }

  const pending = state.submissions.filter((item) => item.status === 'pending');
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 md:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-clay-500">Account centre</p><h1 className="mt-2 font-display text-4xl font-semibold text-ink-900">Hello, {state.user.name}</h1><p className="mt-2 text-sm text-ink-500">{state.user.email} · {state.user.city}</p></div>
        <button type="button" onClick={signOut} className="inline-flex items-center gap-2 self-start rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-100"><LogOut size={16} /> Sign out</button>
      </div>
      {notice && <div className="rounded-xl border border-saffron-400/40 bg-saffron-50 px-4 py-3 text-sm font-medium text-ink-800">{notice}</div>}

      <section className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-majorelle-100 text-majorelle-700"><UserRound size={21} /></div><div><h2 className="font-display text-2xl font-semibold">Your profile</h2><span className="text-sm capitalize text-ink-500">{state.user.role} account</span></div></div>
          <div className="mt-6 rounded-2xl bg-sand-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-ink-400">Current access</p><p className="mt-2 text-sm leading-6 text-ink-700">{state.user.role === 'client' ? 'Discover neighbourhoods, save providers and join activities.' : 'Your professional profile can receive service requests after approval.'}</p></div>
          {state.user.role === 'client' && <button type="button" onClick={switchToProfessional} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-majorelle-600 px-4 py-3 text-sm font-semibold text-majorelle-700 hover:bg-majorelle-50"><ShieldCheck size={17} /> I offer a service</button>}
          {state.user.role === 'professional' && <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><ShieldCheck size={17} /> Professional mode enabled</div>}
        </div>

        {state.user.role === 'professional' && <form onSubmit={submitService} className="rounded-3xl bg-ink-900 p-6 text-white shadow-card"><div className="flex items-center gap-3"><ClipboardCheck className="text-saffron-400" size={22} /><div><h2 className="font-display text-2xl font-semibold">List a service</h2><p className="text-sm text-ink-300">Admins review each listing before it goes live.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-ink-200">Category<select value={service.category} onChange={(event) => setService({ ...service, category: event.target.value })} className="mt-2 w-full rounded-xl border-0 bg-white/10 px-3 py-3 text-white">{categories.map((category) => <option key={category} className="text-ink-900">{category}</option>)}</select></label><label className="text-sm font-medium text-ink-200">Service title<input required value={service.title} onChange={(event) => setService({ ...service, title: event.target.value })} className="mt-2 w-full rounded-xl border-0 bg-white/10 px-3 py-3 text-white placeholder:text-ink-400" placeholder="e.g. Reliable home plumbing" /></label></div><label className="mt-3 block text-sm font-medium text-ink-200">Description<textarea required value={service.description} onChange={(event) => setService({ ...service, description: event.target.value })} className="mt-2 min-h-24 w-full rounded-xl border-0 bg-white/10 px-3 py-3 text-white placeholder:text-ink-400" placeholder="What do you offer?" /></label><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-ink-200">Service area<input value={service.area} onChange={(event) => setService({ ...service, area: event.target.value })} className="mt-2 w-full rounded-xl border-0 bg-white/10 px-3 py-3 text-white" /></label><label className="text-sm font-medium text-ink-200">Price range<input value={service.price} onChange={(event) => setService({ ...service, price: event.target.value })} className="mt-2 w-full rounded-xl border-0 bg-white/10 px-3 py-3 text-white placeholder:text-ink-400" placeholder="150–400 MAD" /></label></div><button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-saffron-400 px-4 py-3 text-sm font-bold text-ink-900 hover:bg-saffron-300"><ClipboardCheck size={17} /> Send for verification</button></form>}
      </section>

      {state.submissions.length > 0 && <section className="rounded-3xl bg-white p-6 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold">Your submissions</h2><p className="mt-1 text-sm text-ink-500">Track every service you have sent to the admin team.</p></div><button type="button" onClick={() => setAdminMode(!adminMode)} className="rounded-full border border-ink-900/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink-600 hover:bg-sand-50">{adminMode ? 'Close admin review' : 'Open demo admin review'}</button></div><div className="mt-5 space-y-3">{state.submissions.map((item) => <div key={item.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-ink-900/10 p-4 sm:flex-row sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-ink-900">{item.title}</p><span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${item.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : item.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-saffron-50 text-ink-700'}`}>{item.status}</span></div><p className="mt-1 text-sm text-ink-500">{item.category} · {item.serviceArea}</p></div>{adminMode && item.status === 'pending' && <div className="flex gap-2"><button type="button" onClick={() => approveSubmission(item.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><Check size={14} /> Approve</button><button type="button" onClick={() => rejectSubmission(item.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Reject</button></div>}</div>)}</div>{adminMode && pending.length > 0 && <p className="mt-4 text-xs font-medium text-ink-400">Demo admin queue: {pending.length} pending review{pending.length === 1 ? '' : 's'}.</p>}</section>}
    </div>
  );
}
*/
