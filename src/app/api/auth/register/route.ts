import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { readDb, updateDb, newId } from '@/lib/db';
import { hashPassword, createSessionCookie } from '@/lib/auth';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { zoneFromNeighborhood } from '@/lib/zones';
import { assertStrongPassword } from '@/lib/security/password';
import { emailConfiguration, sendAccountEmail } from '@/lib/security/email';
import { limit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

async function handlePOST(req: NextRequest) {
  return withErrors(async () => {
    const body = await req.json();
    const { email, password, firstName, lastName, city, neighborhood, interests } = body ?? {};

    if (![email, firstName, lastName].every((value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 254)) {
      return jsonError('First name, last name, email and password are required.');
    }
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return jsonError('Password must contain 12 to 128 characters.');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    await limit(`register:${normalizedEmail}`,3,3600);
    emailConfiguration();
    await assertStrongPassword(password);
    if((city!==undefined && (typeof city!=='string'||city.length>100)) || (neighborhood!==undefined && (typeof neighborhood!=='string'||neighborhood.length>100)) || (interests!==undefined && (!Array.isArray(interests)||interests.length>30||interests.some((v:unknown)=>typeof v!=='string'||v.length>100))))return jsonError('Invalid profile fields.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return jsonError('Invalid email address.');
    const existing = (await readDb()).users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return jsonError('An account with this email already exists.', 409);
    }

    const { salt, hash } = await hashPassword(password);
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

    const user = (await readDb()).users.find((u) => u.id === id)!;
    await sendAccountEmail(user,'verify');
    await createSessionCookie(id,{pending:'verify-email'});
    return NextResponse.json({nextStep:'verify-email'}, { status: 201 });
  });
}

export const POST = secureRoute(handlePOST);
