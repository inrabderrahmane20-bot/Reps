export function trustedOrigin(url: string, origin: string | null): boolean {
  if (!origin || origin === 'null') return false;
  const origins = [process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined, ...(process.env.TRUSTED_ORIGINS || '').split(',')].filter(Boolean);
  if (process.env.NODE_ENV !== 'production') origins.push(new URL(url).origin);
  return origins.some(candidate => {try {return new URL(candidate!).origin === origin;} catch {return false;}});
}
export function assertRequestOrigin(request: Request): void {
  if (['GET','HEAD','OPTIONS'].includes(request.method)) return;
  if (request.headers.get('sec-fetch-site') === 'cross-site' || !trustedOrigin(request.url,request.headers.get('origin'))) {
    throw Object.assign(new Error('Invalid request origin.'),{status:403,expose:true});
  }
}
export async function boundedBody(request: Request, maximum: number): Promise<Uint8Array | undefined> {
  if (Number(request.headers.get('content-length')) > maximum) throw Object.assign(new Error('Request too large.'),{status:413,expose:true});
  if (!request.body) return undefined;
  const reader = request.body.getReader(); const chunks: Uint8Array[]=[]; let size=0;
  while (true) {
    const {done,value} = await reader.read(); if(done) break;
    size+=value.byteLength;
    if(size>maximum) {await reader.cancel();throw Object.assign(new Error('Request too large.'),{status:413,expose:true});}
    chunks.push(value);
  }
  const body = new Uint8Array(size); let offset=0;
  for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  return body;
}
