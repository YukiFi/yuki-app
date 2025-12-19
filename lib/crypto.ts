/**
 * Yuki Embedded Wallet Crypto Utilities
 * 
 * CRITICAL: This module handles all client-side cryptographic operations.
 * The private key should NEVER leave the browser in plaintext.
 * 
 * Encryption scheme:
 * - KDF: PBKDF2 with SHA-256 (high iterations for security)
 * - Cipher: AES-256-GCM (authenticated encryption)
 * 
 * Note: Using PBKDF2 instead of Argon2 for browser compatibility.
 * PBKDF2 with 600,000 iterations provides good security while being
 * universally supported in all browsers via WebCrypto API.
 */

// PBKDF2 parameters - high iterations for security
export const KDF_PARAMS = {
  iterations: 600000,  // OWASP recommended minimum for PBKDF2-SHA256
  hashLen: 32,         // 256-bit key output
  algorithm: 'PBKDF2-SHA256',
} as const;

export interface EncryptedWalletData {
  // Core wallet data
  address: string;
  chainId: number;
  version: number;
  
  // Encrypted private key (Base64)
  cipherPriv: string;
  ivPriv: string;
  
  // KDF parameters
  kdfSalt: string;
  kdfParams: typeof KDF_PARAMS;
  
  // Security level
  securityLevel: 'password_only' | 'passkey_enabled';
  
  // Passkey-related fields (Phase E)
  passkeyMeta?: PasskeyMeta | null;
  wrappedDekPassword?: string | null;
  ivDekPassword?: string | null;
  wrappedDekPasskey?: string | null;
  ivDekPasskey?: string | null;
}

export interface PasskeyMeta {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: AuthenticatorTransport[];
}

/**
 * Generate a cryptographically secure random private key (32 bytes)
 * Uses the browser's native crypto API for secure randomness
 */
export function generatePrivateKey(): Uint8Array {
  const privateKey = new Uint8Array(32);
  crypto.getRandomValues(privateKey);
  return privateKey;
}

/**
 * Generate a random salt for Argon2id (16 bytes recommended)
 */
export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Generate a random IV for AES-GCM (12 bytes recommended for GCM)
 */
export function generateIV(): Uint8Array {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  return iv;
}

/**
 * Generate a random Data Encryption Key (DEK) for passkey upgrade (32 bytes)
 */
export function generateDEK(): Uint8Array {
  const dek = new Uint8Array(32);
  crypto.getRandomValues(dek);
  return dek;
}

/**
 * Derive a Key Encryption Key (KEK) from password using PBKDF2
 * This is the most expensive operation - designed to be slow to prevent brute force
 * 
 * Uses WebCrypto API which is natively supported in all modern browsers.
 */
export async function deriveKEK(
  password: string,
  salt: Uint8Array,
  params: typeof KDF_PARAMS = KDF_PARAMS
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer,
      iterations: params.iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    params.hashLen * 8 // bits
  );
  
  return new Uint8Array(derivedBits);
}

/**
 * Import a raw key for use with WebCrypto AES-GCM
 */
async function importKey(keyData: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyData.buffer.slice(keyData.byteOffset, keyData.byteOffset + keyData.byteLength) as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM
 * Returns the ciphertext (includes auth tag)
 */
export async function encryptAESGCM(
  key: Uint8Array,
  plaintext: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await importKey(key);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer },
    cryptoKey,
    plaintext.buffer.slice(plaintext.byteOffset, plaintext.byteOffset + plaintext.byteLength) as ArrayBuffer
  );
  
  return new Uint8Array(ciphertext);
}

/**
 * Decrypt data using AES-256-GCM
 * Will throw if authentication fails (tampered data)
 */
export async function decryptAESGCM(
  key: Uint8Array,
  ciphertext: Uint8Array,
  iv: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await importKey(key);
  
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer },
    cryptoKey,
    ciphertext.buffer.slice(ciphertext.byteOffset, ciphertext.byteOffset + ciphertext.byteLength) as ArrayBuffer
  );
  
  return new Uint8Array(plaintext);
}

/**
 * Encode Uint8Array to Base64 string for storage/transmission
 */
export function toBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}

/**
 * Decode Base64 string to Uint8Array
 */
export function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert private key bytes to hex string (for viem)
 */
export function toHex(data: Uint8Array): `0x${string}` {
  return `0x${Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Convert hex string to Uint8Array
 */
export function fromHex(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Securely wipe sensitive data from memory
 * Note: JavaScript doesn't guarantee memory wiping, but this is a best effort
 */
export function secureWipe(data: Uint8Array): void {
  crypto.getRandomValues(data);
  data.fill(0);
}

/**
 * Create an encrypted wallet from password
 * This is the main Phase B function - called during wallet creation
 * 
 * @returns The encrypted wallet data to send to the server
 */
export async function createEncryptedWallet(
  password: string,
  chainId: number = 1
): Promise<{ encryptedData: EncryptedWalletData; address: string }> {
  // Step 1: Generate private key in browser
  const privateKey = generatePrivateKey();
  
  // Step 2: Derive address from private key using viem
  const { privateKeyToAccount } = await import('viem/accounts');
  const account = privateKeyToAccount(toHex(privateKey));
  const address = account.address;
  
  // Step 3: Generate salt and derive KEK using Argon2id
  const salt = generateSalt();
  const kek = await deriveKEK(password, salt);
  
  // Step 4: Generate IV and encrypt private key with AES-256-GCM
  const iv = generateIV();
  const ciphertext = await encryptAESGCM(kek, privateKey, iv);
  
  // Step 5: Immediately wipe plaintext private key from memory
  secureWipe(privateKey);
  secureWipe(kek);
  
  // Step 6: Prepare encrypted wallet data for server storage
  const encryptedData: EncryptedWalletData = {
    address,
    chainId,
    version: 1,
    cipherPriv: toBase64(ciphertext),
    ivPriv: toBase64(iv),
    kdfSalt: toBase64(salt),
    kdfParams: KDF_PARAMS,
    securityLevel: 'password_only',
    passkeyMeta: null,
    wrappedDekPassword: null,
    ivDekPassword: null,
    wrappedDekPasskey: null,
    ivDekPasskey: null,
  };
  
  return { encryptedData, address };
}

/**
 * Decrypt wallet to get private key
 * This is the main Phase C function - called during unlock
 * 
 * @returns The decrypted private key (MUST be wiped after use!)
 */
export async function decryptWallet(
  password: string,
  encryptedData: EncryptedWalletData
): Promise<Uint8Array> {
  const salt = fromBase64(encryptedData.kdfSalt);
  const iv = fromBase64(encryptedData.ivPriv);
  const ciphertext = fromBase64(encryptedData.cipherPriv);
  
  // For passkey-enabled wallets, we need to unwrap DEK first
  if (encryptedData.securityLevel === 'passkey_enabled' && encryptedData.wrappedDekPassword) {
    // Derive KEK from password
    const kek = await deriveKEK(password, salt, encryptedData.kdfParams);
    
    // Unwrap DEK with password
    const ivDek = fromBase64(encryptedData.ivDekPassword!);
    const wrappedDek = fromBase64(encryptedData.wrappedDekPassword);
    const dek = await decryptAESGCM(kek, wrappedDek, ivDek);
    
    // Decrypt private key with DEK
    const privateKey = await decryptAESGCM(dek, ciphertext, iv);
    
    // Wipe intermediate keys
    secureWipe(kek);
    secureWipe(dek);
    
    return privateKey;
  } else {
    // Password-only mode: decrypt directly with KEK
    const kek = await deriveKEK(password, salt, encryptedData.kdfParams);
    const privateKey = await decryptAESGCM(kek, ciphertext, iv);
    
    // Wipe KEK
    secureWipe(kek);
    
    return privateKey;
  }
}

/**
 * Upgrade wallet to passkey-enabled mode (Phase E)
 * Must be called while wallet is unlocked (have private key)
 */
export async function upgradeToPasskey(
  password: string,
  privateKey: Uint8Array,
  encryptedData: EncryptedWalletData,
  passkeyKEK: Uint8Array // Derived from passkey ceremony
): Promise<EncryptedWalletData> {
  // Step 1: Generate new DEK
  const dek = generateDEK();
  
  // Step 2: Re-encrypt private key under DEK
  const newIvPriv = generateIV();
  const newCipherPriv = await encryptAESGCM(dek, privateKey, newIvPriv);
  
  // Step 3: Derive KEK from password
  const salt = fromBase64(encryptedData.kdfSalt);
  const passwordKEK = await deriveKEK(password, salt, encryptedData.kdfParams);
  
  // Step 4: Wrap DEK with password KEK
  const ivDekPassword = generateIV();
  const wrappedDekPassword = await encryptAESGCM(passwordKEK, dek, ivDekPassword);
  
  // Step 5: Wrap DEK with passkey KEK
  const ivDekPasskey = generateIV();
  const wrappedDekPasskey = await encryptAESGCM(passkeyKEK, dek, ivDekPasskey);
  
  // Step 6: Wipe intermediate keys
  secureWipe(dek);
  secureWipe(passwordKEK);
  
  // Step 7: Return updated encrypted data
  return {
    ...encryptedData,
    cipherPriv: toBase64(newCipherPriv),
    ivPriv: toBase64(newIvPriv),
    securityLevel: 'passkey_enabled',
    wrappedDekPassword: toBase64(wrappedDekPassword),
    ivDekPassword: toBase64(ivDekPassword),
    wrappedDekPasskey: toBase64(wrappedDekPasskey),
    ivDekPasskey: toBase64(ivDekPasskey),
  };
}

/**
 * Verify password is correct by attempting to decrypt
 * Returns true if password is correct, false otherwise
 */
export async function verifyPassword(
  password: string,
  encryptedData: EncryptedWalletData
): Promise<boolean> {
  try {
    const privateKey = await decryptWallet(password, encryptedData);
    secureWipe(privateKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate password strength
 * Returns null if valid, or error message if invalid
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (password.length > 128) {
    return 'Password must be less than 128 characters';
  }
  // Check for at least one uppercase, lowercase, and number
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
}
