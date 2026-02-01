/**
 * Server-only encryption utilities
 * Uses CANVAS_TOKEN_KEY for AES-GCM encryption
 * NEVER import this in client-side code
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Safety check: ensure this is only used server-side
if (typeof window !== 'undefined') {
  throw new Error('Encryption utilities must not be imported in client-side code');
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
}

/**
 * Encrypt data using AES-GCM 256 with 12-byte IV
 */
export function encryptToken(token: string): EncryptedData {
  const encryptionKey = process.env.CANVAS_TOKEN_KEY;
  
  if (!encryptionKey) {
    throw new Error('CANVAS_TOKEN_KEY environment variable is required');
  }

  // Decode base64 key
  const key = Buffer.from(encryptionKey, 'base64');
  
  if (key.length !== 32) {
    throw new Error('CANVAS_TOKEN_KEY must be a 32-byte base64-encoded key');
  }

  // Generate 12-byte IV for GCM
  const iv = randomBytes(12);
  
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Get the authentication tag
  const authTag = cipher.getAuthTag();
  
  // Combine encrypted data with auth tag
  const combined = Buffer.concat([
    Buffer.from(encrypted, 'base64'),
    authTag
  ]);

  return {
    ciphertext: combined.toString('base64'),
    iv: iv.toString('base64')
  };
}

/**
 * Decrypt data using AES-GCM 256
 */
export function decryptToken(encryptedData: EncryptedData): string {
  const encryptionKey = process.env.CANVAS_TOKEN_KEY;
  
  if (!encryptionKey) {
    throw new Error('CANVAS_TOKEN_KEY environment variable is required');
  }

  // Decode base64 key
  const key = Buffer.from(encryptionKey, 'base64');
  
  if (key.length !== 32) {
    throw new Error('CANVAS_TOKEN_KEY must be a 32-byte base64-encoded key');
  }

  const iv = Buffer.from(encryptedData.iv, 'base64');
  const combined = Buffer.from(encryptedData.ciphertext, 'base64');
  
  // Split encrypted data and auth tag (last 16 bytes)
  const authTag = combined.slice(-16);
  const encrypted = combined.slice(0, -16);
  
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  const part1 = decipher.update(encrypted, undefined, 'utf8');
  const part2 = decipher.final('utf8');
  return part1 + part2;
}