/**
 * Authentication utilities
 * 
 * Password hashing for user authentication (NOT wallet encryption).
 * This is separate from the wallet crypto - passwords are hashed with bcrypt
 * for auth storage, and derived with Argon2id for wallet encryption.
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto';

// Use PBKDF2 for auth password hashing (bcrypt alternative that's available in Node)
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

/**
 * Hash a password for storage in the database (auth purposes only)
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex');
    const crypto = require('crypto');
    
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err: Error | null, derivedKey: Buffer) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hash] = storedHash.split(':');
    const crypto = require('crypto');
    
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err: Error | null, derivedKey: Buffer) => {
      if (err) reject(err);
      
      const storedKeyBuffer = Buffer.from(hash, 'hex');
      const derivedKeyBuffer = derivedKey;
      
      // Use timing-safe comparison to prevent timing attacks
      if (storedKeyBuffer.length !== derivedKeyBuffer.length) {
        resolve(false);
        return;
      }
      
      resolve(timingSafeEqual(storedKeyBuffer, derivedKeyBuffer));
    });
  });
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a secure random ID
 */
export function generateId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().toLowerCase();
}
