'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { ZONES, nearestZoneId, getZone } from '@/lib/zones';
import { Link } from '@/i18n/navigation';

interface MapPoint {
  id: string;
  kind: 'provider' | 'activity' | 'community';
  name: string;
  category: string;
  availability?: string;
  date?: string;
  lat: number;
  lng: number;
  zoneId?: string;
}

const availabilityColor: Record<string, string> = {
  available: '#2f9e6e', // zellige green — matches AvailabilityBadge "available"
  later: '#d99a2b', // saffron
  offline: '#9aa0a6',
};

export default function MapPage() {
  const t = useTranslations('map');
  const z = useTranslations('zones');
  const locale = useLocale();
  const { user, setUser } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const homeLayerRef = useRef<any>(null);
  const initializedRef = useRef(false);
  const layerGroupsRef = useRef<{ providers: any; activities: any; communities: any } | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [zone, setZone] = useState<string>('all');
  const [home, setHome] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const [zoneSaved, setZoneSaved] = useState(false);
  const [points, setPoints] = useState<{ providers: MapPoint[]; activities: MapPoint[]; communities: MapPoint[] }>({
    providers: [],
    activities: [],
    communities: [],
  });
  const [layers, setLayers] = useState({ providers: true, activities: true, communities: false });

  const selectedZone = getZone(zone);
  const houseLabel = z('houseLabel');
  const saveZoneHint = z('saveZoneHint');

  useEffect(() => {
    if (!initializedRef.current && user?.zoneId) {
      initializedRef.current = true;
      setZone(user.zoneId);
      if (user.homeLat != null && user.homeLng != null) setHome({ lat: user.homeLat, lng: user.homeLng });
    }
  }, [user]);

  useEffect(() => {
    const params = zone && zone !== 'all' ? `?zone=${encodeURIComponent(zone)}` : '';
    api
      .get<{ providers: MapPoint[]; activities: MapPoint[]; communities: MapPoint[] }>(`/map/points${params}`)
      .then(setPoints);
  }, [zone]);

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
    homeLayerRef.current = L.layerGroup().addTo(map);
  }, [leafletReady]);

  // Draw the "my house" marker whenever home coordinates change.
  useEffect(() => {
    if (!leafletReady || !mapRef.current || !homeLayerRef.current || !home) return;
    const L = (window as any).L;
    const layer = homeLayerRef.current;
    layer.clearLayers();
    L.marker([home.lat, home.lng], {
      icon: houseIcon(),
      draggable: true,
    })
      .on('dragend', (e: any) => {
        const ll = e.target.getLatLng();
        const next = { lat: ll.lat, lng: ll.lng };
        setHome(next);
        setZone(nearestZoneId(next.lat, next.lng));
        if (mapRef.current) mapRef.current.setView(ll, Math.max(mapRef.current.getZoom(), 14));
      })
      .bindPopup(`<strong>${escapeHtml(houseLabel)}</strong>${selectedZone ? `<br/>${escapeHtml(saveZoneHint)}` : ''}`)
      .addTo(layer);
    if (mapRef.current) mapRef.current.setView([home.lat, home.lng], Math.max(mapRef.current.getZoom(), 14));
  }, [home, leafletReady, locale, houseLabel, saveZoneHint, selectedZone]);

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

  function shareLocation() {
    if (!('geolocation' in navigator)) {
      setGeoDenied(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setHome(next);
        setZone(nearestZoneId(next.lat, next.lng));
        setGeoDenied(false);
        setLocating(false);
      },
      () => {
        setGeoDenied(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function saveZone() {
    if (!user) return;
    const res = await api.patch<{ user: any }>('/users/me', {
      zoneId: zone,
      ...(home ? { homeLat: home.lat, homeLng: home.lng } : {}),
    });
    setUser(res.user);
    setZoneSaved(true);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" onLoad={() => setLeafletReady(true)} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink-500">{z('subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={shareLocation}
          disabled={locating}
          className="inline-flex items-center gap-2 rounded-full bg-majorelle-600 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-majorelle-700 disabled:opacity-60"
        >
          <span aria-hidden>{locating ? '…' : '📌'}</span>
          {locating ? z('locating') : z('shareLocation')}
        </button>
      </div>

      {geoDenied && (
        <p className="mt-3 rounded-xl bg-saffron-500/10 px-4 py-2.5 text-sm text-saffron-700">⚠️ {z('denied')}</p>
      )}

      {selectedZone && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-sand-100 px-4 py-3">
          <p className="flex-1 text-sm text-ink-700">
            {t('zoneDetected')} <span className="font-semibold text-majorelle-700">{selectedZone.name}</span>
          </p>
          {user ? (
            <button
              type="button"
              onClick={saveZone}
              disabled={zoneSaved && user.zoneId === zone && (home ? user.homeLat === home.lat : true)}
              className="rounded-full bg-clay-400 px-4 py-2 text-xs font-semibold text-white hover:bg-clay-500 disabled:opacity-60"
            >
              {zoneSaved ? z('zoneSaved') : z('saveZone')}
            </button>
          ) : (
            <Link href="/login" className="text-xs font-semibold text-majorelle-700 hover:underline">
              {z('signInToSave')}
            </Link>
          )}
        </div>
      )}

      {/* Zone filter */}
      <div className="mt-5 flex flex-wrap gap-2">
        <ZoneChip active={zone === 'all'} label={z('all')} onClick={() => setZone('all')} />
        {ZONES.map((zr) => (
          <ZoneChip
            key={zr.id}
            active={zone === zr.id}
            label={zr.name}
            onClick={() => {
              setZone(zr.id);
              setGeoDenied(false);
            }}
          />
        ))}
      </div>

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
      {!leafletReady && <p className="mt-2 text-center text-xs text-ink-300">{z('loadingMap')}</p>}
    </div>
  );
}

function houseIcon() {
  return (window as any).L.divIcon({
    className: '',
    html: '<span style="display:flex;align-items:center;justify-content:center;height:36px;width:36px;border-radius:9999px;background:#4C3AA8;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);font-size:18px;line-height:1">🏠</span>',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function ZoneChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-clay-400 text-white' : 'bg-white text-ink-700 shadow-card hover:bg-sand-100'
      }`}
    >
      {label}
    </button>
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