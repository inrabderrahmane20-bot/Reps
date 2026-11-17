import { getDatabasePool } from '../db';
import { tokenHash } from './crypto';

const memory = new Map<string, {count: number; expires: number}>();
export async function limit(key: string, maximum: number, seconds: number): Promise<void> {
  const pool = getDatabasePool();
  const hash = tokenHash(key);
  let count: number;
  if (pool) {
    const result = await pool.query<{hits: number}>(`INSERT INTO public.security_rate_limits (key,hits,expires_at)
      VALUES ($1,1,now()+$2*interval '1 second') ON CONFLICT (key) DO UPDATE SET
      hits=CASE WHEN security_rate_limits.expires_at<=now() THEN 1 ELSE security_rate_limits.hits+1 END,
      expires_at=CASE WHEN security_rate_limits.expires_at<=now() THEN now()+$2*interval '1 second' ELSE security_rate_limits.expires_at END
      RETURNING hits`,[hash,seconds]);
    count = result.rows[0].hits;
  } else {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCAL_DB !== 'true') throw new Error('A shared rate-limit database is required.');
    const now = Date.now();
    for (const [k,v] of memory) if (v.expires <= now) memory.delete(k);
    const current = memory.get(hash) ?? {count: 0, expires: now + seconds * 1000};
    if (memory.size >= 10000 && !memory.has(hash)) throw Object.assign(new Error('Please retry later.'),{status:429,expose:true});
    count = ++current.count; memory.set(hash,current);
  }
  if (count > maximum) throw Object.assign(new Error('Too many attempts. Please try again later.'), {status:429,expose:true,retryAfter:seconds});
}
export function clientAddress(headers: Headers): string {
  // Vercel overwrites this header. Other deployments must explicitly configure a trusted proxy.
  const header = process.env.VERCEL ? 'x-vercel-forwarded-for' : process.env.TRUSTED_PROXY_IP_HEADER;
  return header ? (headers.get(header)?.split(',')[0].trim().slice(0, 64) || 'unknown') : 'local';
}
