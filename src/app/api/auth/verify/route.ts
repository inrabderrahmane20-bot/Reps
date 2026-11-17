import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { updateDb } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { tokenHash } from '@/lib/security/crypto';
import { sendAccountEmail } from '@/lib/security/email';
import { limit } from '@/lib/security/rate-limit';
import { jsonError } from '@/lib/api-helpers';
async function handlePOST(req: NextRequest){
 const body=await req.json();
 if(body.action==='resend'){
  const record=await getAuthSession();if(!record)return jsonError('Sign in again.',401);
  await limit(`verify:${record.user.id}`,3,3600);
  if(!record.user.emailVerifiedAt)await sendAccountEmail(record.user,'verify');
  return NextResponse.json({ok:true});
 }
 if(typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token))return jsonError('Invalid link.');
 const digest=tokenHash(body.token);
 const ok=await updateDb(db=>{
  const user=db.users.find(u=>u.verifyTokenHash===digest&&Date.parse(u.verifyTokenExpiresAt||'')>Date.now()&&u.status==='active');
  if(!user)return false;
  user.emailVerifiedAt=new Date().toISOString();delete user.verifyTokenHash;delete user.verifyTokenExpiresAt;
  db.sessions=db.sessions.filter(s=>s.userId!==user.id);return true;
 });
 return ok?NextResponse.json({ok:true}):jsonError('This link is invalid or expired.');
}

export const POST = secureRoute(handlePOST);
