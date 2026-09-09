'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '@/lib/api-client';

interface MapPoint {
  id: string;
  kind: 'provider' | 'activity' | 'community';
  name: string;
  category: string;
  availability?: string;
  date?: string;
  lat: number;
  lng: number;
}

const availabilityColor: Record<string, string> = {
  available: '#2f9e6e', // zellige green — matches AvailabilityBadge "available"
  later: '#d99a2b', // saffron
  offline: '#9aa0a6',
};

export default function MapPage() {
  const t = useTranslations('map');
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerGroupsRef = useRef<{ providers: any; activities: any; communities: any } | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [points, setPoints] = useState<{ providers: MapPoint[]; activities: MapPoint[]; communities: MapPoint[] }>({
    providers: [],
    activities: [],
    communities: [],
  });
  const [layers, setLayers] = useState({ providers: true, activities: true, communities: false });

  useEffect(() => {
    api
      .get<{ providers: MapPoint[]; activities: MapPoint[]; communities: MapPoint[] }>('/map/points')
      .then(setPoints);
  }, []);

  // Initialize the Leaflet map once the CDN script has loaded.
  useEffect(() => {
    if (!leafletReady || !containerRef.current || mapRef.current) return;
    const L = (window as any).L;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([31.6295, -8.0089], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    layerGroupsRef.current = {
      providers: L.layerGroup().addTo(map),
      activities: L.layerGroup().addTo(map),
      communities: L.layerGroup(),
    };
  }, [leafletReady]);

  // Repaint markers whenever data or the current locale changes.
  useEffect(() => {
    if (!leafletReady || !mapRef.current || !layerGroupsRef.current) return;
    const L = (window as any).L;
    const groups = layerGroupsRef.current;

    function dot(color: string) {
      return L.divIcon({
        className: '',
        html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
    }

    groups.providers.clearLayers();
    points.providers.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], { icon: dot(availabilityColor[p.availability || 'offline']) });
      marker.bindPopup(
        `<strong>${escapeHtml(p.name)}</strong><br/>${escapeHtml(p.category)}<br/><a href="/${locale}/services/${p.id}" style="color:#4C3AA8;font-weight:600;">View provider →</a>`
      );
      marker.addTo(groups.providers);
    });

    groups.activities.clearLayers();
    points.activities.forEach((a) => {
      const marker = L.marker([a.lat, a.lng], { icon: dot('#C2703D') });
      marker.bindPopup(
        `<strong>${escapeHtml(a.name)}</strong><br/>${escapeHtml(a.category)} · ${escapeHtml(a.date || '')}<br/><a href="/${locale}/activities/${a.id}" style="color:#4C3AA8;font-weight:600;">View activity →</a>`
      );
      marker.addTo(groups.activities);
    });

    groups.communities.clearLayers();
    points.communities.forEach((c) => {
      const marker = L.marker([c.lat, c.lng], { icon: dot('#1E6E73') });
      marker.bindPopup(
        `<strong>${escapeHtml(c.name)}</strong><br/>${escapeHtml(c.category)}<br/><a href="/${locale}/communities/${c.id}" style="color:#4C3AA8;font-weight:600;">View community →</a>`
      );
      marker.addTo(groups.communities);
    });
  }, [points, leafletReady, locale]);

  // Toggle layer visibility.
  useEffect(() => {
    if (!mapRef.current || !layerGroupsRef.current) return;
    const map = mapRef.current;
    const groups = layerGroupsRef.current;
    (['providers', 'activities', 'communities'] as const).forEach((key) => {
      if (layers[key]) {
        if (!map.hasLayer(groups[key])) groups[key].addTo(map);
      } else if (map.hasLayer(groups[key])) {
        map.removeLayer(groups[key]);
      }
    });
  }, [layers]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" onLoad={() => setLeafletReady(true)} />

      <h1 className="font-display text-2xl font-semibold text-ink-900">{t('title')}</h1>

      <div className="mt-4 flex flex-wrap gap-4">
        <LayerToggle label={t('layerServices')} checked={layers.providers} onChange={(v) => setLayers((l) => ({ ...l, providers: v }))} color={availabilityColor.available} />
        <LayerToggle label={t('layerActivities')} checked={layers.activities} onChange={(v) => setLayers((l) => ({ ...l, activities: v }))} color="#C2703D" />
        <LayerToggle label={t('layerCommunities')} checked={layers.communities} onChange={(v) => setLayers((l) => ({ ...l, communities: v }))} color="#1E6E73" />
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-500">
        <Legend color={availabilityColor.available} label="Available" />
        <Legend color={availabilityColor.later} label="Available later" />
        <Legend color={availabilityColor.offline} label="Offline" />
      </div>

      <div ref={containerRef} className="mt-4 h-[70vh] w-full overflow-hidden rounded-2xl shadow-card" />
      {!leafletReady && <p className="mt-2 text-center text-xs text-ink-300">Loading map…</p>}
    </div>
  );
}

function LayerToggle({ label, checked, onChange, color }: { label: string; checked: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-ink-700 shadow-card">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-majorelle-600" />
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </label>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function escapeHtml(input: string) {
  return input.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
