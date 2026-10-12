import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const prefix = '$scrypt$32768$8$3$';

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, 64, options);
  return `${prefix}${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(password, encoded) {
  let salt = Buffer.alloc(16);
  let expected = Buffer.alloc(64);
  let valid = false;
  if (typeof encoded === 'string' && encoded.startsWith(prefix)) {
    const parts = encoded.slice(prefix.length).split('$');
    if (parts.length === 2 && /^[A-Za-z0-9_-]{22}$/.test(parts[0]) && /^[A-Za-z0-9_-]{86}$/.test(parts[1])) {
      salt = Buffer.from(parts[0], 'base64url');
      expected = Buffer.from(parts[1], 'base64url');
      valid = salt.length === 16 && expected.length === 64;
    }
  }
  const actual = await derive(password, salt, 64, options);
  return timingSafeEqual(actual, expected) && valid;
}
