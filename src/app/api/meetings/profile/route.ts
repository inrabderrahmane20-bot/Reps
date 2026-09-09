import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export async function GET() {
  return withErrors(async () => {
    const me = requireUser();
    const profile = readDb().meetingProfiles.find((p) => p.userId === me.id) || null;
    return NextResponse.json({ profile });
  });
}

// Create or update the user's separate Meetings profile (SRS §28). Kept
// distinct from the main profile — sensitive fields are opt-in and only
// used inside the Meetings section.
export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const me = requireUser();
    const body = await req.json();
    const { age, gender, maritalStatus, profession, lookingFor, preferredAgeMin, preferredAgeMax, visibility, active } = body ?? {};
    if (!age || !gender || !lookingFor) return jsonError('Age, gender and intention are required.');

    updateDb((db) => {
      const existing = db.meetingProfiles.find((p) => p.userId === me.id);
      const data = {
        userId: me.id,
        age: Number(age),
        gender,
        maritalStatus: maritalStatus || '',
        profession: profession || '',
        lookingFor,
        preferredAgeMin: Number(preferredAgeMin) || 20,
        preferredAgeMax: Number(preferredAgeMax) || 45,
        visibility: visibility || 'everyone',
        active: active !== false,
      };
      if (existing) Object.assign(existing, data);
      else db.meetingProfiles.push(data);
    });

    return NextResponse.json({ ok: true });
  });
}
