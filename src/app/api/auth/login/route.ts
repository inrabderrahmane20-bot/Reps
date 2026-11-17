import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { verifyPassword, createSessionCookie } from '@/lib/auth';
import { withErrors, jsonError } from '@/lib/api-helpers';
import { toPublicUser } from '@/lib/types';
import { limit } from '@/lib/security/rate-limit';
import { sendAccountEmail } from '@/lib/security/email';
import { appendAudit } from '@/lib/security/audit';
import { getDatabasePool } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function handlePOST(req: NextRequest) {
  return withErrors(async () => {
    const { email, password } = (await req.json()) ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password || email.length > 254 || password.length > 128) return jsonError('Email and password are required.');

    const normalizedEmail = String(email).trim().toLowerCase();
    await limit(`login:${normalizedEmail}`,5,900);
    const user = (await readDb()).users.find((u) => u.email.toLowerCase() === normalizedEmail);
    const valid=await verifyPassword(password,user?.salt||'0'.repeat(32),user?.passwordHash||'0'.repeat(128));
    if (!user || !valid || user.passwordResetRequired) {
      await appendAudit(getDatabasePool(),'auth.login.failed',{});
      return jsonError('Incorrect email or password.', 401);
    }
    if (user.status !== 'active') {
      return jsonError('This account has been suspended. Contact support.', 403);
    }

    if(!user.emailVerifiedAt){
      await sendAccountEmail(user,'verify');
      await createSessionCookie(user.id,{pending:'verify-email'},{passwordHash:user.passwordHash});
      return NextResponse.json({nextStep:'verify-email'});
    }
    if(user.role==='admin'){
      const nextStep=user.mfaSecret?'mfa':'mfa-setup';
      await createSessionCookie(user.id,{pending:nextStep},{passwordHash:user.passwordHash});
      return NextResponse.json({nextStep});
    }
    await createSessionCookie(user.id,{}, {passwordHash:user.passwordHash});
    await appendAudit(getDatabasePool(),'auth.login.succeeded',{userId:user.id});
    return NextResponse.json({ user: toPublicUser(user, true) });
  });
}

export const POST = secureRoute(handlePOST);
