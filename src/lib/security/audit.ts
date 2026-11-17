import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { securityContext } from './context';
import {reportSecurityEvent} from './monitor';

const hidden = /password|salt|token|secret|cookie|authorization|email|firstName|lastName|neighborhood|avatar|phone|address|bio|message|content|documents|homeLat|homeLng/i;
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 5) return '[truncated]';
  if (Array.isArray(value)) return value.slice(0, 50).map(v => redact(v, depth + 1));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, hidden.test(k) ? '[redacted]' : redact(v, depth + 1)]));
  return typeof value === 'string' ? value.slice(0, 500) : value;
}
export async function appendAudit(client: Pool | PoolClient | null, action: string, detail: unknown): Promise<void> {
  const context = securityContext.getStore();
  const event = {id: randomUUID(), at: new Date().toISOString(), ...context, action, detail: redact(detail)};
  if (client) {
    await client.query('INSERT INTO public.security_audit (id, occurred_at, data) VALUES ($1,$2,$3::jsonb)', [event.id, event.at, JSON.stringify(event)]);
  } else {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCAL_DB !== 'true') throw new Error('Persistent security audit storage is required.');
    const dir = process.env.LOCAL_DATA_DIR || path.join(process.cwd(), '.local-data');
    fs.mkdirSync(dir, {recursive:true});
    fs.appendFileSync(path.join(dir, 'security-audit.jsonl'), JSON.stringify(event) + '\n', {mode:0o600});
  }
  if(action.endsWith('.failed'))await reportSecurityEvent({event:'security_auth_failure',requestId:context?.requestId,action,at:event.at});
}
