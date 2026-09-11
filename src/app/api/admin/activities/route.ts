import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { classifyZone } from '@/lib/zones';

function enrich(a: any) {
  return { ...a, participants: a.participantIds?.length ?? 0, zoneId: classifyZone(a.lat, a.lng, a.location) };
}

export async function GET(req: NextRequest) {
  return withErrors(async () => {
    requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.toLowerCase();
    let list = readDb().activities;
    if (q) list = list.filter((a) => `${a.title} ${a.category} ${a.location}`.toLowerCase().includes(q));
    return NextResponse.json({ activities: list.map(enrich) });
  });
}

export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const admin = requireAdmin();
    const body = await req.json();
    const { title, description, category, date, location, city, lat, lng, max, min, level, visibility, equipment, status } = body ?? {};
    if (!title || !category || !date || !location) {
      return jsonError('Title, category, date and location are required.');
    }
    const id = newId('a');
    updateDb((db) => {
      db.activities.push({
        id,
        creatorId: admin.id,
        title,
        description: description || '',
        category,
        date,
        location,
        city: city || 'Marrakech',
        lat: lat != null && !isNaN(Number(lat)) ? Number(lat) : 31.6295 + (Math.random() - 0.5) * 0.06,
        lng: lng != null && !isNaN(Number(lng)) ? Number(lng) : -8.0089 + (Math.random() - 0.5) * 0.06,
        max: Number(max) || 10,
        min: Number(min) || 2,
        equipment: Array.isArray(equipment) ? equipment : [],
        level: level || 'All levels',
        visibility: visibility === 'private' ? 'private' : 'public',
        status: status === 'cancelled' || status === 'completed' ? status : 'open',
        participantIds: [],
        pendingParticipantIds: [],
        createdAt: new Date().toISOString(),
      });
    });
    return NextResponse.json({ id }, { status: 201 });
  });
}