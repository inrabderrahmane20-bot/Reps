import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { securityContext } from './security/context';
import {reportSecurityEvent} from './security/monitor';

export function jsonError(message: string, status = 400, details?: Record<string, unknown>) {
  return NextResponse.json({error:message,...details},{status,headers:{'Cache-Control':'no-store, max-age=0'}});
}
export async function withErrors(fn: () => Promise<Response> | Response): Promise<Response> {
  try { return await fn(); }
  catch (error: unknown) {
    const err = error as Error & {status?:number;expose?:boolean;retryAfter?:number;code?:string};
    if (err?.message === 'UNAUTHENTICATED') return jsonError('You must be signed in.',401);
    if (err?.message === 'FORBIDDEN') return jsonError('Not allowed.',403);
    if (err instanceof SyntaxError) return jsonError('Invalid JSON.',400);
    if (err?.status === 409) return jsonError('This record has already changed. Refresh and retry.',409);
    if (err?.expose && err.status && [400,401,403,404,413,415,429,503].includes(err.status)) {
      if(err.status===429)await reportSecurityEvent({event:'rate_limit_exceeded',requestId:securityContext.getStore()?.requestId});
      const response=jsonError(err.message,err.status);
      if (err.status===429) response.headers.set('Retry-After',String(err.retryAfter||900));
      return response;
    }
    const requestId=securityContext.getStore()?.requestId||randomUUID();
    console.error(JSON.stringify({event:'request_failed',requestId,name:err?.name,code:err?.code}));
    await reportSecurityEvent({event:'request_failed',requestId,name:err?.name,code:err?.code});
    return jsonError('The service is temporarily unavailable. Please retry.',503,{requestId});
  }
}
export function notifyId(): string { return `n_${randomUUID()}`; }
