import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { classifyZone } from '@/lib/zones';

function enrich(a: any) {
  return { ...a, participants: a.participantIds.length, zoneId: classifyZone(a.lat, a.lng, a.location) };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const zone = searchParams.get('zone');
  const city = searchParams.get('city');
  const db = readDb();
  let list = db.activities.filter((a) => a.status !== 'cancelled');
  // Filter out service appointment/catalog entries that are mislabeled as activities
  list = list.filter((a) => {
    const title = (a.title || '').toString().toLowerCase();
    const cat = (a.category || '').toString().toLowerCase();
    if (title.includes('appointment')) return false;
    if (cat.includes('installation plomberie') || cat.includes('plomberie') && title.includes('appointment')) return false;
    // common patterns from catalog
    if (a.id && a.id.startsWith('activity_catalog_')) {
      // keep only if clearly a community activity? catalog ones are appointments
      return false;
    }
    return true;
  });
  if (category) {
    const cc = category.toLowerCase();
    list = list.filter((a) => ((a.category || '').toString().toLowerCase() === cc) || ((a.category || '').toString().toLowerCase().includes(cc)));
  }
  if (city && city !== '' && city !== 'all') {
    const c = city.toLowerCase();
    list = list.filter((a) => {
      const aCity = ((a.city || a.location || '') as string).toLowerCase();
      return aCity.includes(c) || c.includes(aCity) || aCity === c;
    });
  }
  if (zone && zone !== 'all') list = list.filter((a) => classifyZone(a.lat, a.lng, a.location) === zone);
  return NextResponse.json({ activities: list.map(enrich) });
}

// Fields from SRS §24 — create an activity.
export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const me = requireUser();
    const body = await req.json();
    const { title, description, category, date, location, city, max, min, equipment, level, visibility } = body ?? {};
    if (!title || !description || !category || !date || !location) {
      return jsonError('Title, description, category, date and location are required.');
    }
    const id = newId('a');
    updateDb((db) => {
      db.activities.push({
        id,
        creatorId: me.id,
        title,
        description,
        category,
        date,
        location,
        city: city || 'Marrakech',
        lat: 31.6295 + (Math.random() - 0.5) * 0.06,
        lng: -8.0089 + (Math.random() - 0.5) * 0.06,
        max: Number(max) || 10,
        min: Number(min) || 2,
        equipment: Array.isArray(equipment) ? equipment : [],
        level: level || 'All levels',
        visibility: visibility === 'private' ? 'private' : 'public',
        status: 'open',
        participantIds: [me.id],
        pendingParticipantIds: [],
        createdAt: new Date().toISOString(),
      });
    });
    return NextResponse.json({ id }, { status: 201 });
  });
}
