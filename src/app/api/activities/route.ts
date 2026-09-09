import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

function enrich(a: any) {
  return { ...a, participants: a.participantIds.length };
}

export async function GET(req: NextRequest) {
  const category = new URL(req.url).searchParams.get('category');
  const db = readDb();
  let list = db.activities.filter((a) => a.status !== 'cancelled');
  if (category) list = list.filter((a) => a.category === category);
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
