import { randomBytes } from 'node:crypto';

/**
 * Generates a URL-safe random code (32 bytes of entropy, base64url-encoded).
 */
export function generateCode() {
  return randomBytes(32).toString('base64url');
}
