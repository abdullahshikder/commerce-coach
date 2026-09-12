import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
export const digest = (token: string) => createHash('sha256').update(token).digest('hex');
export const randomToken = () => randomBytes(32).toString('base64url');
export function validPassword(value: unknown): value is string { return typeof value === 'string' && value.length >= 12 && Buffer.byteLength(value) <= 256; }
async function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)));
}
export async function hashPassword(password: string) {
  if (!validPassword(password)) throw new Error('Use a password of at least 12 characters and at most 256 bytes.');
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${(await derive(password, salt)).toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, hash] = stored.split(':');
  if (algorithm !== 'scrypt' || !salt || !/^[a-f0-9]{128}$/.test(hash || '')) return false;
  return timingSafeEqual(await derive(password, salt), Buffer.from(hash, 'hex'));
}
// Unknown accounts still do the same expensive password work.
export const dummyHash = `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`;
