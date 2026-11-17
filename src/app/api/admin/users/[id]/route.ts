import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { pushNotification } from '@/lib/notify';
import { zoneFromNeighborhood } from '@/lib/zones';
import { assertStrongPassword } from '@/lib/security/password';
import {validProfile} from '@/lib/security/profile';

const EDITABLE = ['firstName', 'lastName', 'email', 'city', 'neighborhood', 'bio', 'role', 'status'] as const;

export const dynamic = 'force-dynamic';

async function handlePATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return withErrors(async () => {
    const admin = await requireAdmin();
    const body = await req.json();
    if(!body||typeof body!=='object'||Array.isArray(body)||!validProfile(body))return jsonError('Invalid profile fields.');

    // Moderation actions on an existing account.
    if (body.action) {
      const { action } = body;
      if (!['activate', 'suspend', 'ban'].includes(action)) return jsonError('Invalid action.');
      if (params.id === admin.id) return jsonError('You cannot moderate your own account.');

      const result = await updateDb((db) => {
        const u = db.users.find((x) => x.id === params.id);
        if (!u) return null;
        u.status = action === 'activate' ? 'active' : action === 'suspend' ? 'suspended' : 'banned';
        if (u.status !== 'active') {
          db.sessions = db.sessions.filter((s) => s.userId !== u.id);
        }
        return { ok: true };
      });

      if (!result) return jsonError('User not found.', 404);
      return NextResponse.json(result);
    }

    // Field-level edit of the account.
    if (Object.keys(body).length === 0) return jsonError('Nothing to update.');

    const allowedRoles = ['user', 'admin'];
    const allowedStatuses = ['active', 'suspended', 'banned'];
    if (body.role && !allowedRoles.includes(body.role)) return jsonError('Role must be "user" or "admin".');
    if (body.status && !allowedStatuses.includes(body.status)) return jsonError('Invalid status.');
    if (params.id === admin.id && body.role === 'user') return jsonError('You cannot remove your own admin role.');

    if(body.email!==undefined && (typeof body.email!=='string'||body.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)))return jsonError('Invalid email.');
    const normalizedEmail = body.email ? String(body.email).trim().toLowerCase() : undefined;
    let password: {salt:string;hash:string}|undefined;
    if(body.password!==undefined){await assertStrongPassword(body.password);password=await hashPassword(body.password);}
    if (normalizedEmail) {
      const duplicate = await updateDb((db) => db.users.some((u) => u.id !== params.id && u.email.toLowerCase() === normalizedEmail));
      if (duplicate) return jsonError('Another account already uses this email.', 409);
    }

    const result = await updateDb((db) => {
      const u = db.users.find((x) => x.id === params.id);
      if (!u) return null;
      if(normalizedEmail&&db.users.some(other=>other.id!==u.id&&other.email.toLowerCase()===normalizedEmail))throw Object.assign(new Error('Duplicate email.'),{status:409});
      if(normalizedEmail&&normalizedEmail!==u.email){delete u.emailVerifiedAt;delete u.verifyTokenHash;delete u.verifyTokenExpiresAt;delete u.resetTokenHash;delete u.resetTokenExpiresAt;}
      if(password||body.email!==undefined||body.role!==undefined||body.status!==undefined)db.sessions=db.sessions.filter(s=>s.userId!==u.id);
      for (const key of EDITABLE) {
        if (body[key] !== undefined) (u as any)[key] = key === 'email' ? normalizedEmail : body[key];
      }
      if (body.role && body.role === 'admin') pushNotification(db, u.id, 'account', 'Your account now has administrator rights.', '/profile');
      if (password) {
        const { salt, hash } = password;
        u.salt = salt;
        u.passwordHash = hash;
        u.credentialsRotatedAt=new Date().toISOString();u.passwordResetRequired=false;
        delete u.resetTokenHash;delete u.resetTokenExpiresAt;
      }
      if (body.neighborhood && body.zoneId === undefined) {
        const z = zoneFromNeighborhood(body.neighborhood);
        if (z) u.zoneId = z;
      }
      return { ok: true };
    });

    if (!result) return jsonError('User not found.', 404);
    return NextResponse.json(result);
  });
}
export const PATCH = secureRoute(handlePATCH);
