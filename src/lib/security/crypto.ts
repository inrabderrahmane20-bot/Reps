import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
export const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex');
export const randomToken = () => randomBytes(32).toString('hex');
export function securityKey(): Buffer {
  const key = process.env.AUTH_SECRET;
  if (!key || !/^[a-f0-9]{64}$/i.test(key)) throw new Error('AUTH_SECRET must contain 32 random bytes encoded as hex.');
  return Buffer.from(key, 'hex');
}
export function seal(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', securityKey(), iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}
export function unseal(value: string): string {
  const data = Buffer.from(value, 'base64url');
  const cipher = createDecipheriv('aes-256-gcm', securityKey(), data.subarray(0, 12));
  cipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString('utf8');
}
export async function hashPassword(password: string): Promise<{salt: string; hash: string}> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await derive(password, salt, 64) as Buffer).toString('hex');
  return { salt, hash };
}
export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  if (typeof password !== 'string' || password.length > 128 || !/^[a-f0-9]{32}$/i.test(salt) || !/^[a-f0-9]{128}$/i.test(hash)) return false;
  const actual = await derive(password, salt, 64) as Buffer;
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function newTotpSecret(): string {
  const bytes = randomBytes(20); let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  return bits.match(/.{5}/g)!.map(b => BASE32[parseInt(b, 2)]).join('');
}
export function totp(secret: string, counter: number): string {
  if (!/^[A-Z2-7]{16,64}$/.test(secret)) throw new Error('Invalid MFA secret.');
  const bits = [...secret].map(c => BASE32.indexOf(c).toString(2).padStart(5, '0')).join('');
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map(b => parseInt(b, 2)));
  const input = Buffer.alloc(8); input.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', key).update(input).digest();
  const offset = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
export function verifyTotp(secret: string, code: unknown, lastCounter = -1, now = Date.now()): number | null {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return null;
  const counter = Math.floor(now / 30000);
  for (const step of [counter, counter - 1, counter + 1]) {
    if (step > lastCounter && step >= 0 && timingSafeEqual(Buffer.from(totp(secret, step)), Buffer.from(code))) return step;
  }
  return null;
}
