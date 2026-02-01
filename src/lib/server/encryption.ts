/**
 * Server-only encryption utilities for Canvas token.
 * Uses CANVAS_TOKEN_KEY (server env only). AES-256-GCM.
 * Import only from API routes or other server code.
 */

import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

if (typeof window !== 'undefined') {
  throw new Error('Encryption utilities must not be imported in client-side code');
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
}

export function encryptToken(token: string): EncryptedData {
  const encryptionKey = process.env.CANVAS_TOKEN_KEY;
  if (!encryptionKey) {
    throw new Error('CANVAS_TOKEN_KEY environment variable is required');
  }
  const key = Buffer.from(encryptionKey, 'base64');
  if (key.length !== 32) {
    throw new Error('CANVAS_TOKEN_KEY must be a 32-byte base64-encoded key');
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([
    Buffer.from(encrypted, 'base64'),
    authTag,
  ]);
  return {
    ciphertext: combined.toString('base64'),
    iv: iv.toString('base64'),
  };
}

export function decryptToken(encryptedData: EncryptedData): string {
  const encryptionKey = process.env.CANVAS_TOKEN_KEY;
  if (!encryptionKey) {
    throw new Error('CANVAS_TOKEN_KEY environment variable is required');
  }
  const key = Buffer.from(encryptionKey, 'base64');
  if (key.length !== 32) {
    throw new Error('CANVAS_TOKEN_KEY must be a 32-byte base64-encoded key');
  }
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const combined = Buffer.from(encryptedData.ciphertext, 'base64');
  const authTag = combined.slice(-16);
  const encrypted = combined.slice(0, -16);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
}
