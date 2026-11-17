import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, verifyPassword, hashPassword, clearSessionCookie } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { assertStrongPassword } from '@/lib/security/password';
import { limit } from '@/lib/security/rate-limit';
import { jsonError } from '@/lib/api-helpers';
async function handlePOST(req:NextRequest){
 const me=await requireUser();await limit(`password:${me.id}`,5,900);
 const body=await req.json();
 if(typeof body.currentPassword!=='string'||typeof body.password!=='string'||!await verifyPassword(body.currentPassword,me.salt,me.passwordHash))return jsonError('Current password is incorrect.',401);
 await assertStrongPassword(body.password);const next=await hashPassword(body.password);
 const ok=await updateDb(db=>{
  const user=db.users.find(u=>u.id===me.id&&u.passwordHash===me.passwordHash);if(!user)return false;
  user.passwordHash=next.hash;user.salt=next.salt;user.credentialsRotatedAt=new Date().toISOString();
  delete user.resetTokenHash;delete user.resetTokenExpiresAt;
  db.sessions=db.sessions.filter(s=>s.userId!==me.id);return true;
 });
 if(!ok)return jsonError('Sign in again.',401);
 await clearSessionCookie();return NextResponse.json({ok:true});
}

export const POST = secureRoute(handlePOST);
