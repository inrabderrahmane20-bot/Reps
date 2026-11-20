import { cookies } from 'next/headers';
import { readSessionUser, updateDb, newId } from './db';
import { tokenHash, randomToken } from './security/crypto';
import type { User, Session } from './types';
export { hashPassword, verifyPassword } from './security/crypto';

export const SESSION_COOKIE = 'medina_session';
const SESSION_MS=8*60*60*1000;
export async function createSessionCookie(userId: string, options: Partial<Session> = {}, expected?: {sessionToken?:string;passwordHash?:string}): Promise<string> {
  const token=randomToken(), now=Date.now();
  const jar=await cookies(); const old=jar.get(SESSION_COOKIE)?.value;
  // Pending MFA/email steps need enough time to open an authenticator app or inbox.
  const pendingMs=30*60*1000;
  const expires=new Date(options.pending ? now+pendingMs : Math.min(now+SESSION_MS,options.absoluteExpiresAt?Date.parse(options.absoluteExpiresAt):Infinity));
  await updateDb(db=>{
    const user=db.users.find(u=>u.id===userId&&u.status==='active');
    if(!user||(expected?.passwordHash&&user.passwordHash!==expected.passwordHash)||(expected?.sessionToken&&!db.sessions.some(s=>s.token===expected.sessionToken&&s.userId===userId&&Date.parse(s.expiresAt)>now)))throw Object.assign(new Error('UNAUTHENTICATED'),{status:401});
    db.sessions=db.sessions.filter(s=>Date.parse(s.expiresAt)>now && s.token!==tokenHash(old||''));
    db.sessions.push({...options,token:tokenHash(token),userId,securityVersion:2,createdAt:options.createdAt||new Date(now).toISOString(),lastSeenAt:new Date(now).toISOString(),expiresAt:expires.toISOString(),absoluteExpiresAt:options.absoluteExpiresAt||expires.toISOString()});
    const own=db.sessions.filter(s=>s.userId===userId).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    const excess=new Set(own.slice(0,Math.max(0,own.length-5)).map(s=>s.token));
    db.sessions=db.sessions.filter(s=>!excess.has(s.token));
  });
  // Safari 16.4+ intermittently omits SameSite=lax cookies on fetch() requests.
  // Use SameSite=none in production (Secure is required by the browser spec);
  // the server's Origin check still blocks cross-site state changes.
  const production=process.env.NODE_ENV==='production';
  jar.set(SESSION_COOKIE,token,{httpOnly:true,sameSite:production?'none':'lax',secure:production,expires,path:'/'});
  return token;
}
export async function clearSessionCookie(): Promise<void> {
  const jar=await cookies(); const token=jar.get(SESSION_COOKIE)?.value;
  if(token) await updateDb(db=>{db.sessions=db.sessions.filter(s=>s.token!==tokenHash(token));});
  jar.delete(SESSION_COOKIE);
}
export async function getAuthSession(): Promise<{session:Session;user:User}|null> {
  const token=(await cookies()).get(SESSION_COOKIE)?.value;
  if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
  const record=await readSessionUser(tokenHash(token));
  if(!record||record.session.securityVersion!==2||record.user.status!=='active')return null;
  const now=Date.now(),s=record.session;
  if(Date.parse(s.expiresAt)<=now||Date.parse(s.absoluteExpiresAt||s.expiresAt)<=now||now-Date.parse(s.lastSeenAt||s.createdAt)>60*60*1000)return null;
  return record;
}
export async function getSessionUser(): Promise<User|null> {
  const record=await getAuthSession();
  if(!record||record.session.pending||!record.user.emailVerifiedAt)return null;
  if(record.user.role==='admin'&&(!record.user.mfaSecret||!record.session.mfaVerifiedAt))return null;
  return record.user;
}
export async function requireUser(): Promise<User> {
  const user=await getSessionUser();
  if(!user)throw Object.assign(new Error('UNAUTHENTICATED'),{status:401});
  return user;
}
export async function requireAdmin(): Promise<User> {
  const user=await requireUser();
  if(user.role!=='admin')throw Object.assign(new Error('FORBIDDEN'),{status:403});
  return user;
}
export function newUserId(): string {return newId('u');}
