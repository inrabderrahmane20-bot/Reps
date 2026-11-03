import { cookies } from 'next/headers';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { readAdminUser, readSessionUser, updateDb, newId } from './db';
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
export async function createSessionCookie(userId: string): Promise<string> {
  const token = randomBytes(24).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await updateDb((db) => {
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

export async function clearSessionCookie(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await updateDb((db) => {
      db.sessions = db.sessions.filter((s) => s.token !== token);
    });
  }
  cookies().delete(SESSION_COOKIE);
}

/** Read the current user from the session cookie. Safe to call from Server Components,
 *  Route Handlers, and Server Actions. */
export async function getSessionUser(): Promise<User | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sessionUser = await readSessionUser(token);
  if (!sessionUser) return null;
  if (new Date(sessionUser.session.expiresAt).getTime() < Date.now()) return null;
  return sessionUser.user;
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error('UNAUTHENTICATED');
    (err as any).status = 401;
    throw err;
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const admin = await readAdminUser();
  if (!admin) {
    throw new Error('No administrator account is configured.');
  }
  return admin;
}

export function newUserId(): string {
  return newId('u');
}
