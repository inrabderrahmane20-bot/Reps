import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { readDb, updateDb, getDatabasePool } from '@/lib/db';
import { clearSessionCookie, hashPassword } from '@/lib/auth';
import { emailConfiguration, sendAccountEmail } from '@/lib/security/email';
import { assertStrongPassword } from '@/lib/security/password';
import { tokenHash } from '@/lib/security/crypto';
import { limit } from '@/lib/security/rate-limit';
import { appendAudit } from '@/lib/security/audit';
import { jsonError } from '@/lib/api-helpers';

async function handlePOST(req: NextRequest) {
  const body=await req.json();
  if(body.action==='request'){
    if(typeof body.email!=='string'||body.email.length>254)return jsonError('Invalid email.');
    emailConfiguration();
    const email=body.email.trim().toLowerCase();
    await limit(`recovery:${email}`,3,3600);
    const user=(await readDb()).users.find(u=>u.email.toLowerCase()===email&&u.status==='active');
    if(user)await sendAccountEmail(user,'reset');
    return NextResponse.json({ok:true,message:'If this account exists, a recovery email has been sent.'});
  }
  if(body.action!=='reset'||typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token)||typeof body.password!=='string')return jsonError('Invalid recovery request.');
  await limit(`reset:${tokenHash(body.token)}`,5,900);
  const digest=tokenHash(body.token);
  if(!(await readDb()).users.some(u=>u.resetTokenHash===digest&&Date.parse(u.resetTokenExpiresAt||'')>Date.now()&&u.status==='active'))return jsonError('This link is invalid or expired.');
  await assertStrongPassword(body.password);
  const password=await hashPassword(body.password);
  const userId=await updateDb(db=>{
    const user=db.users.find(u=>u.resetTokenHash===digest&&Date.parse(u.resetTokenExpiresAt||'')>Date.now()&&u.status==='active');
    if(!user)return null;
    user.passwordHash=password.hash;user.salt=password.salt;user.credentialsRotatedAt=new Date().toISOString();user.passwordResetRequired=false;
    user.emailVerifiedAt ||= new Date().toISOString();
    delete user.resetTokenHash;delete user.resetTokenExpiresAt;
    db.sessions=db.sessions.filter(s=>s.userId!==user.id);
    return user.id;
  });
  if(!userId)return jsonError('This link is invalid or expired.');
  await clearSessionCookie();
  await appendAudit(getDatabasePool(),'auth.password.reset',{userId});
  return NextResponse.json({ok:true});
}

export const POST = secureRoute(handlePOST);
