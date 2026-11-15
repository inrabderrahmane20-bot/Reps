import { NextRequest, NextResponse } from 'next/server';
import { readDb, updateDb, newId } from '@/lib/db';
import { hashPassword, createSessionCookie } from '@/lib/auth';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { toPublicUser } from '@/lib/types';
import { zoneFromNeighborhood } from '@/lib/zones';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const body = await req.json();
    const { email, password, firstName, lastName, city, neighborhood, interests } = body ?? {};

    if (![email, firstName, lastName].every((value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 254)) {
      return jsonError('First name, last name, email and password are required.');
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
      return jsonError('Password must be at least 6 characters.');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return jsonError('Invalid email address.');
    const existing = (await readDb()).users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return jsonError('An account with this email already exists.', 409);
    }

    const { salt, hash } = hashPassword(password);
    const id = newId('u');

    await updateDb((db) => {
      if (db.users.some((user) => user.email.toLowerCase() === normalizedEmail)) throw Object.assign(new Error('Duplicate email.'), { status: 409 });
      db.users.push({
        id,
        email: normalizedEmail,
        passwordHash: hash,
        salt,
        firstName,
        lastName,
        city: city || 'Marrakech',
        neighborhood: neighborhood || '',
        avatar: `https://i.pravatar.cc/200?u=${id}`,
        languages: ['English'],
        interests: Array.isArray(interests) ? interests : [],
        bio: '',
        role: 'user',
        status: 'active',
        providerStatus: 'none',
        provider: null,
        blockedUserIds: [],
        zoneId: zoneFromNeighborhood(neighborhood || '') ?? undefined,
        createdAt: new Date().toISOString(),
      });
    });

    await createSessionCookie(id);
    const user = (await readDb()).users.find((u) => u.id === id)!;
    return NextResponse.json({ user: toPublicUser(user, true) }, { status: 201 });
  });
}
