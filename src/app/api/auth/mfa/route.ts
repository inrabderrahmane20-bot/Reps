import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createSessionCookie } from '@/lib/auth';
import { updateDb, getDatabasePool } from '@/lib/db';
import { newTotpSecret, seal, unseal, verifyTotp } from '@/lib/security/crypto';
import { limit } from '@/lib/security/rate-limit';
import { appendAudit } from '@/lib/security/audit';
import { jsonError } from '@/lib/api-helpers';
import { toPublicUser } from '@/lib/types';
async function handlePOST(req: NextRequest){
 const record=await getAuthSession();
 if(!record||!record.user.emailVerifiedAt||!['mfa','mfa-setup'].includes(record.session.pending||''))return jsonError('Sign in again.',401);
 await limit(`mfa:${record.user.id}`,5,300);
 const body=await req.json();
 if(body.action==='setup'){
  if(record.user.mfaSecret||record.session.pending!=='mfa-setup')return jsonError('MFA is already configured.',403);
  const secret=record.session.mfaSetupSecret?unseal(record.session.mfaSetupSecret):newTotpSecret();
  const encrypted=seal(secret);
  await updateDb(db=>{const session=db.sessions.find(s=>s.token===record.session.token);if(session)session.mfaSetupSecret=encrypted;});
  return NextResponse.json({secret,uri:`otpauth://totp/Annabid:${encodeURIComponent(record.user.email)}?secret=${secret}&issuer=Annabid&algorithm=SHA1&digits=6&period=30`});
 }
 const result=await updateDb(db=>{
  const session=db.sessions.find(s=>s.token===record.session.token&&Date.parse(s.expiresAt)>Date.now());
  const user=db.users.find(u=>u.id===record.user.id&&u.status==='active');
  if(!session||!user)return null;
  const encrypted=user.mfaSecret||session.mfaSetupSecret;if(!encrypted)return null;
  const counter=verifyTotp(unseal(encrypted),body.code,user.mfaLastCounter);
  if(counter===null)return null;
  user.mfaSecret=encrypted;user.mfaLastCounter=counter;
  db.sessions=db.sessions.filter(s=>s.token!==session.token);
  return user;
 });
 if(!result){await appendAudit(getDatabasePool(),'auth.mfa.failed',{userId:record.user.id});return jsonError('Invalid or already-used verification code.',401);}
 await createSessionCookie(result.id,{mfaVerifiedAt:new Date().toISOString()},{passwordHash:result.passwordHash});
 await appendAudit(getDatabasePool(),'auth.mfa.succeeded',{userId:result.id});
 return NextResponse.json({user:toPublicUser(result,true)});
}

export const POST = secureRoute(handlePOST);
