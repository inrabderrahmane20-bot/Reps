import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { verifyPassword, createSessionCookie } from '@/lib/auth';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { toPublicUser } from '@/lib/types';

export async function POST(req: NextRequest) {
  return withErrors(async () => {
    const { email, password } = (await req.json()) ?? {};
    if (!email || !password) return jsonError('Email and password are required.');

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = readDb().users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
      return jsonError('Incorrect email or password.', 401);
    }
    if (user.status !== 'active') {
      return jsonError('This account has been suspended. Contact support.', 403);
    }

    createSessionCookie(user.id);
    return NextResponse.json({ user: toPublicUser(user) });
  });
}
