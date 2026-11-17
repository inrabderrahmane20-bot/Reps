import { createHash } from 'node:crypto';

export async function assertStrongPassword(password: unknown): Promise<void> {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128 || new Set(password).size < 5) {
    throw Object.assign(new Error('Use a password of 12–128 characters, preferably a unique passphrase.'), {status: 400, expose: true});
  }
  const digest = createHash('sha1').update(password).digest('hex').toUpperCase();
  // Only a five-character hash prefix leaves this server; never the password or full hash.
  const response = await fetch(`https://api.pwnedpasswords.com/range/${digest.slice(0, 5)}`, {
    headers: {'Add-Padding': 'true'}, signal: AbortSignal.timeout(5000), cache: 'no-store',
  });
  if (!response.ok) throw Object.assign(new Error('Password safety checks are temporarily unavailable. Please retry.'), {status: 503, expose: true});
  const found = (await response.text()).split(/\r?\n/).some(line => {
    const [suffix, count] = line.split(':');
    return suffix === digest.slice(5) && Number(count) > 0;
  });
  if (found) throw Object.assign(new Error('This password has appeared in a data breach. Choose a different password.'), {status: 400, expose: true});
}
