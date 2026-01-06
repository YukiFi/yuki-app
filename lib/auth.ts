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
 * Password validation with security requirements
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // Minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Maximum length (prevent DoS)
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  // Must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Must contain at least one number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Must contain at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
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
