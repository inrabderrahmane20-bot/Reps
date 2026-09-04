'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, LocateFixed, MapPin, Search, Sparkles } from 'lucide-react';
import { useDemoState } from '@/components/layout/demo-state-provider';
import { providers } from '@/data/mock';

const mapPlaces = [
  { id: 'p1', name: 'Rachid B.', category: 'Plumber', area: 'Guéliz', x: 38, y: 36, color: 'bg-clay-400' },
  { id: 'p2', name: 'Amal E.', category: 'Electrician', area: 'Hivernage', x: 60, y: 55, color: 'bg-majorelle-600' },
  { id: 'p3', name: 'Karim T.', category: 'House cleaning', area: 'Medina', x: 47, y: 27, color: 'bg-saffron-400' },
  { id: 'community', name: 'Swimming Club', category: 'Community', area: 'Guéliz', x: 25, y: 63, color: 'bg-emerald-500' },
  { id: 'activity', name: 'Photography walk', category: 'Activity', area: 'Medina', x: 71, y: 30, color: 'bg-sky-500' },
];

const filters = ['All', 'Services', 'Activities', 'Communities'];

export default function MapPage() {
  const { state } = useDemoState();
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('p1');
  const [locationMessage, setLocationMessage] = useState('Marrakech · explore nearby');
  const approved = state.submissions.filter((item) => item.status === 'approved').map((item, index) => ({ id: item.id, name: item.name, category: 'Service', area: item.serviceArea, x: 18 + index * 12, y: 72 - index * 9, color: 'bg-clay-400' }));
  const places = [...mapPlaces, ...approved];
  const visiblePlaces = useMemo(() => places.filter((place) => {
    const kind = place.category === 'Activity' ? 'Activities' : place.category === 'Community' ? 'Communities' : 'Services';
    return (activeFilter === 'All' || kind === activeFilter) && `${place.name} ${place.category} ${place.area}`.toLowerCase().includes(query.toLowerCase().trim());
  }), [activeFilter, query, state.submissions]);
  const selected = places.find((place) => place.id === selectedId) ?? visiblePlaces[0];

  function useLocation() {
    if (!navigator.geolocation) { setLocationMessage('Location is unavailable in this browser'); return; }
    setLocationMessage('Finding your position…');
    navigator.geolocation.getCurrentPosition(() => setLocationMessage('You are exploring from your current position'), () => setLocationMessage('Location permission was declined'));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-clay-500">Marrakech guide</p><h1 className="mt-2 font-display text-4xl font-semibold text-ink-900">Find your way around</h1><p className="mt-2 text-sm text-ink-500">A living map of trusted services, local activities and communities.</p></div><button type="button" onClick={useLocation} className="inline-flex items-center gap-2 self-start rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-100"><LocateFixed size={17} /> Use my location</button></div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[1.6fr_0.8fr]">
        <div className="relative min-h-[560px] overflow-hidden rounded-3xl bg-[#e7dcc2] shadow-card">
          <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(28deg, transparent 47%, rgba(255,255,255,.8) 48%, rgba(255,255,255,.8) 50%, transparent 51%), linear-gradient(112deg, transparent 45%, rgba(255,255,255,.7) 46%, rgba(255,255,255,.7) 48%, transparent 49%), linear-gradient(90deg, rgba(111,76,52,.09) 1px, transparent 1px), linear-gradient(rgba(111,76,52,.09) 1px, transparent 1px)', backgroundSize: '100% 180px, 230px 100%, 42px 42px, 42px 42px' }} />
          <div className="absolute left-[12%] top-[13%] font-display text-2xl font-semibold text-ink-900/25">MEDINA</div><div className="absolute right-[12%] top-[40%] rotate-12 text-xs font-bold uppercase tracking-[0.3em] text-ink-900/25">Guéliz</div><div className="absolute bottom-[18%] left-[30%] -rotate-12 text-xs font-bold uppercase tracking-[0.3em] text-ink-900/25">Hivernage</div>
          <div className="absolute left-4 right-4 top-4 flex flex-wrap gap-2"><label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full bg-white/95 px-4 py-3 shadow-lg"><Search size={17} className="text-ink-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this map" className="w-full bg-transparent text-sm outline-none" /></label><div className="flex rounded-full bg-white/95 p-1 shadow-lg">{filters.map((filter) => <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`rounded-full px-3 py-2 text-xs font-bold ${activeFilter === filter ? 'bg-ink-900 text-white' : 'text-ink-600'}`}>{filter}</button>)}</div></div>
          {visiblePlaces.map((place) => <button key={place.id} type="button" onClick={() => setSelectedId(place.id)} aria-label={`Show ${place.name}`} className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 ${selected?.id === place.id ? 'z-20 scale-125' : 'z-10'}`} style={{ left: `${place.x}%`, top: `${place.y}%` }}><span className={`grid h-9 w-9 place-items-center rounded-full border-4 border-white ${place.color} text-white shadow-xl`}><MapPin size={16} fill="currentColor" /></span></button>)}
          <div className="absolute bottom-4 left-4 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-ink-600 shadow-lg"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> {locationMessage}</div>
        </div>
        <aside className="rounded-3xl bg-white p-5 shadow-card"><div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-400"><Sparkles size={16} className="text-saffron-500" /> Selected place</div>{selected ? <div className="mt-5"><div className={`grid h-14 w-14 place-items-center rounded-2xl ${selected.color} text-white`}><MapPin size={25} fill="currentColor" /></div><h2 className="mt-5 font-display text-3xl font-semibold text-ink-900">{selected.name}</h2><p className="mt-2 text-sm font-semibold text-clay-500">{selected.category} · {selected.area}</p><p className="mt-4 text-sm leading-6 text-ink-600">{selected.category === 'Service' || ['Services'].includes(activeFilter) ? 'Verified local provider available through the Medina directory.' : 'A nearby place on your Marrakech community map.'}</p><a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(`${selected.name} ${selected.area} Marrakech`)}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-majorelle-600 px-4 py-3 text-sm font-semibold text-white hover:bg-majorelle-700">Open directions <ExternalLink size={16} /></a></div> : <p className="mt-5 text-sm text-ink-500">No places match this search.</p>}<div className="mt-8 border-t border-ink-900/10 pt-5"><p className="text-xs font-bold uppercase tracking-wider text-ink-400">Map legend</p><div className="mt-3 grid grid-cols-2 gap-3 text-xs font-semibold text-ink-600"><span><i className="me-2 inline-block h-2.5 w-2.5 rounded-full bg-clay-400" />Services</span><span><i className="me-2 inline-block h-2.5 w-2.5 rounded-full bg-sky-500" />Activities</span><span><i className="me-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />Communities</span></div></div></aside>
      </div>
    </div>
  );
}
