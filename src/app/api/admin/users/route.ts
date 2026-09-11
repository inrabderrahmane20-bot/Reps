import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { toPublicUser } from '@/lib/types';
import { zoneFromNeighborhood } from '@/lib/zones';

export async function GET(req: NextRequest) {
  return withErrors(async () => {
    requireAdmin();
    const q = new URL(req.url).searchParams.get('q')?.toLowerCase();
    let list = readDb().users;
    if (q) list = list.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q));
    return NextResponse.json({ users: list.map((u) => ({ ...toPublicUser(u), email: u.email })) });
  });
}

export async function POST(req: NextRequest) {
  return withErrors(async () => {
    requireAdmin();
    const body = await req.json();
    const { firstName, lastName, email, password, city, neighborhood, role, interests } = body ?? {};
    if (!firstName || !lastName || !email) return jsonError('First name, last name and email are required.');

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = readDb().users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) return jsonError('An account with this email already exists.', 409);

    const finalRole = role === 'admin' ? 'admin' : 'user';
    const { salt, hash } = hashPassword(password || 'medina1234');
    const id = newId('u');

    updateDb((db) => {
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
        role: finalRole,
        status: 'active',
        providerStatus: 'none',
        provider: null,
        blockedUserIds: [],
        zoneId: zoneFromNeighborhood(neighborhood || '') ?? undefined,
        createdAt: new Date().toISOString(),
      });
    });

    const user = readDb().users.find((u) => u.id === id)!;
    return NextResponse.json({ user: { ...toPublicUser(user), email: user.email } }, { status: 201 });
  });
}