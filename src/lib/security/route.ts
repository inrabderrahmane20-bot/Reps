import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { withErrors } from '../api-helpers';
import { getSessionUser, requireAdmin } from '../auth';
import { getDatabasePool } from '../db';
import { securityContext } from './context';
import { appendAudit } from './audit';
import { limit, clientAddress } from './rate-limit';
import { assertRequestOrigin, boundedBody } from './request';

// Keep the guard in each route: middleware bypass cannot skip authorization or CSRF checks.
export function secureRoute<C>(handler: (request: NextRequest, context: C) => Promise<Response> | Response) {
  return async (request: NextRequest, context: C): Promise<Response> => {
    const requestId=randomUUID(), pathname=request.nextUrl.pathname.replace(/\/$/,'');
    return securityContext.run({requestId,method:request.method,path:pathname},()=>withErrors(async()=>{
      assertRequestOrigin(request);
      const mutation=!['GET','HEAD','OPTIONS'].includes(request.method);
      const auth=pathname.startsWith('/api/auth/');
      const admin=pathname.startsWith('/api/admin/');
      if (mutation) await limit(`ip:${auth?'auth':'write'}:${clientAddress(request.headers)}`,auth?30:120,900);
      if (admin) {
        const user=await requireAdmin();
        securityContext.getStore()!.actorId=user.id;
        if(mutation) await appendAudit(getDatabasePool(),'admin.request.started',{});
      } else if(mutation && !auth) {
        const user=await getSessionUser();
        if(user) securityContext.getStore()!.actorId=user.id;
      }
      if(mutation) {
        const maximum=pathname.includes('upload')?4*1024*1024+65536:pathname.includes('visual-editor')?1024*1024:256*1024;
        const body=await boundedBody(request,maximum);
        request=new NextRequest(request.url,{method:request.method,headers:request.headers,body:body as BodyInit|undefined});
      }
      const response=await handler(request,context);
      response.headers.set('Cache-Control','no-store, max-age=0');
      response.headers.set('X-Request-Id',requestId);
      if(admin&&mutation) await appendAudit(getDatabasePool(),'admin.request.completed',{status:response.status});
      return response;
    }));
  };
}
