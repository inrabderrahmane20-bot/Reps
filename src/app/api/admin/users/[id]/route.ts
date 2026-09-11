import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { pushNotification } from '@/lib/notify';
import { zoneFromNeighborhood } from '@/lib/zones';

const EDITABLE = ['firstName', 'lastName', 'email', 'city', 'neighborhood', 'bio', 'role', 'status'] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const admin = requireAdmin();
    const body = await req.json();

    // Moderation actions on an existing account.
    if (body.action) {
      const { action } = body;
      if (!['activate', 'suspend', 'ban'].includes(action)) return jsonError('Invalid action.');
      if (params.id === admin.id) return jsonError('You cannot moderate your own account.');

      const result = updateDb((db) => {
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

    const normalizedEmail = body.email ? String(body.email).trim().toLowerCase() : undefined;
    if (normalizedEmail) {
      const duplicate = updateDb((db) => db.users.some((u) => u.id !== params.id && u.email.toLowerCase() === normalizedEmail));
      if (duplicate) return jsonError('Another account already uses this email.', 409);
    }

    const result = updateDb((db) => {
      const u = db.users.find((x) => x.id === params.id);
      if (!u) return null;
      for (const key of EDITABLE) {
        if (body[key] !== undefined) (u as any)[key] = key === 'email' ? normalizedEmail : body[key];
      }
      if (body.role && body.role === 'admin') pushNotification(db, u.id, 'account', 'Your account now has administrator rights.', '/profile');
      if (body.password) {
        const { salt, hash } = hashPassword(body.password);
        u.salt = salt;
        u.passwordHash = hash;
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