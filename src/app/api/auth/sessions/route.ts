import { secureRoute } from '@/lib/security/route';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, getAuthSession, createSessionCookie, clearSessionCookie } from '@/lib/auth';
import { readDb, updateDb } from '@/lib/db';
import { tokenHash } from '@/lib/security/crypto';
import { jsonError } from '@/lib/api-helpers';
async function handleGET(){
 const me=await requireUser(),current=await getAuthSession();
 return NextResponse.json({sessions:(await readDb()).sessions.filter(s=>s.userId===me.id&&Date.parse(s.expiresAt)>Date.now()).map(s=>({id:tokenHash(s.token),createdAt:s.createdAt,lastSeenAt:s.lastSeenAt,expiresAt:s.expiresAt,current:s.token===current?.session.token}))});
}
async function handlePOST(req:NextRequest){
 const me=await requireUser(),record=await getAuthSession();
 if(!record)return jsonError('Sign in again.',401);
 const {action,id}=await req.json();
 if(action==='refresh'){
  await createSessionCookie(me.id,{createdAt:record.session.createdAt,absoluteExpiresAt:record.session.absoluteExpiresAt,mfaVerifiedAt:record.session.mfaVerifiedAt},{sessionToken:record.session.token,passwordHash:me.passwordHash});
 }else if(action==='revoke-all'){
  await updateDb(db=>{db.sessions=db.sessions.filter(s=>s.userId!==me.id);});await clearSessionCookie();
 }else if(action==='revoke'&&typeof id==='string'){
  await updateDb(db=>{db.sessions=db.sessions.filter(s=>s.userId!==me.id||tokenHash(s.token)!==id);});
 }else return jsonError('Invalid session action.');
 return NextResponse.json({ok:true});
}

export const GET = secureRoute(handleGET);
export const POST = secureRoute(handlePOST);
