import { cookies } from 'next/headers';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { readDb, updateDb, newId } from './db';
import type { User } from './types';

export const SESSION_COOKIE = 'medina_session';
const SESSION_DAYS = 30;

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  try {
    const candidate = scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, 'hex');
    if (candidate.length !== stored.length) return false;
    return timingSafeEqual(candidate, stored);
  } catch {
    return false;
  }
}

/** Create a session for a user and set the session cookie. Call from a Route Handler. */
export function createSessionCookie(userId: string): string {
  const token = randomBytes(24).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  updateDb((db) => {
    db.sessions.push({
      token,
      userId,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    });
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires,
    path: '/',
  });
  return token;
}

export function clearSessionCookie(): void {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    updateDb((db) => {
      db.sessions = db.sessions.filter((s) => s.token !== token);
    });
  }
  cookies().delete(SESSION_COOKIE);
}

/** Read the current user from the session cookie. Safe to call from Server Components,
 *  Route Handlers, and Server Actions. */
export function getSessionUser(): User | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = readDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  const user = db.users.find((u) => u.id === session.userId);
  return user ?? null;
}

export function requireUser(): User {
  const user = getSessionUser();
  if (!user) {
    const err = new Error('UNAUTHENTICATED');
    (err as any).status = 401;
    throw err;
  }
  return user;
}

export function requireAdmin(): User {
  const admin = readDb().users.find((user) => user.role === 'admin');
  if (!admin) {
    throw new Error('No administrator account is configured.');
  }
  return admin;
}

export function newUserId(): string {
  return newId('u');
}
