/**
 * Database layer for Yuki Embedded Wallet
 * 
 * Uses PostgreSQL when DATABASE_URL is set, otherwise falls back to
 * in-memory storage for development/demo purposes.
 */

import * as pgDb from './db-postgres';

// Check if PostgreSQL is available
const USE_POSTGRES = !!process.env.DATABASE_URL;

if (USE_POSTGRES) {
  console.log('[DB] Using PostgreSQL database');
  // Initialize PostgreSQL schema on first import
  pgDb.initializeDatabase().catch(console.error);
} else {
  console.log('[DB] Using in-memory database (set DATABASE_URL for PostgreSQL)');
}

// In-memory storage (fallback for development)
const db = {
  users: new Map<string, any>(),
  wallets: new Map<string, any>(),
  sessions: new Map<string, any>(),
  rateLimits: new Map<string, any>(),
  indices: {
    usersByEmail: new Map<string, string>(),
    usersByClerkId: new Map<string, string>(),
    walletsByUserId: new Map<string, string>(),
    walletsByAddress: new Map<string, string>(),
    sessionsByUserId: new Map<string, Set<string>>()
  }
};

// ============================================
// User Operations
// ============================================

export interface User {
  id: string;
  clerk_user_id: string | null;
  email: string;
  phone_number: string | null;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  email_verified: boolean;
  locked_until: Date | null;
  failed_attempts: number;
  username: string | null;
  username_last_changed: Date | null;
  passkey_credential_id: string | null;
  passkey_public_key: string | null;
  passkey_counter: number;
  passkey_device_type: string | null;
  passkey_backed_up: boolean;
  passkey_transports: string | null;
  passkey_created_at: Date | null;
}

export async function createUser(
  id: string,
  email: string,
  passwordHash: string
): Promise<User | null> {
  const normalizedEmail = email.toLowerCase();
  
  console.log('[DB] createUser - Normalized email:', normalizedEmail);
  console.log('[DB] createUser - Email exists in index?', db.indices.usersByEmail.has(normalizedEmail));
  console.log('[DB] createUser - Current users in DB:', Array.from(db.indices.usersByEmail.keys()));
  
  if (db.indices.usersByEmail.has(normalizedEmail)) {
    console.log('[DB] createUser - BLOCKED: Email already exists');
    return null; // Email already exists
  }
  
  const user: User = {
    id,
    clerk_user_id: null,
    email: normalizedEmail,
    phone_number: null,
    password_hash: passwordHash,
    created_at: new Date(),
    updated_at: new Date(),
    email_verified: false,
    locked_until: null,
    failed_attempts: 0,
    username: null,
    username_last_changed: null,
    passkey_credential_id: null,
    passkey_public_key: null,
    passkey_counter: 0,
    passkey_device_type: null,
    passkey_backed_up: false,
    passkey_transports: null,
    passkey_created_at: null,
  };
  
  db.users.set(id, user);
  db.indices.usersByEmail.set(normalizedEmail, id);
  
  console.log('[DB] createUser - SUCCESS: User created with ID:', id);
  
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  return db.users.get(id) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase();
  console.log('[DB] getUserByEmail - Looking up:', normalizedEmail);
  const userId = db.indices.usersByEmail.get(normalizedEmail);
  console.log('[DB] getUserByEmail - Found userId:', userId || 'NOT FOUND');
  if (!userId) return null;
  const user = db.users.get(userId) || null;
  console.log('[DB] getUserByEmail - User object exists:', !!user);
  return user;
}

// Get or create a user by email (for demo purposes)
export async function getOrCreateUserByEmail(email: string): Promise<User> {
  const normalizedEmail = email.toLowerCase();
  let user = await getUserByEmail(normalizedEmail);
  
  if (!user) {
    // Create a new user with the email as ID (simplified for demo)
    const id = `user_${normalizedEmail.replace(/[^a-z0-9]/g, '_')}`;
    user = {
      id,
      clerk_user_id: null,
      email: normalizedEmail,
      phone_number: null,
      password_hash: '',
      created_at: new Date(),
      updated_at: new Date(),
      email_verified: true,
      locked_until: null,
      failed_attempts: 0,
      username: null,
      username_last_changed: null,
      passkey_credential_id: null,
      passkey_public_key: null,
      passkey_counter: 0,
      passkey_device_type: null,
      passkey_backed_up: false,
      passkey_transports: null,
      passkey_created_at: null,
    };
    
    db.users.set(id, user);
    db.indices.usersByEmail.set(normalizedEmail, id);
  }
  
  return user;
}

/**
 * Get or create a user by Clerk user ID
 * This is the primary method for binding Clerk auth to our internal user system
 */
export async function getOrCreateUserByClerkId(clerkUserId: string): Promise<User> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    const pgUser = await pgDb.getOrCreateUserByClerkIdPg(clerkUserId);
    if (pgUser) return pgUser;
  }
  
  // Fallback to in-memory storage
  // Check if user already exists with this Clerk ID
  const existingUserId = db.indices.usersByClerkId.get(clerkUserId);
  if (existingUserId) {
    const user = db.users.get(existingUserId);
    if (user) return user;
  }
  
  // Create a new user linked to this Clerk ID
  const id = `user_${clerkUserId}`;
  const user: User = {
    id,
    clerk_user_id: clerkUserId,
    email: '',
    phone_number: null,
    password_hash: '',
    created_at: new Date(),
    updated_at: new Date(),
    email_verified: true,
    locked_until: null,
    failed_attempts: 0,
    username: null,
    username_last_changed: null,
    passkey_credential_id: null,
    passkey_public_key: null,
    passkey_counter: 0,
    passkey_device_type: null,
    passkey_backed_up: false,
    passkey_transports: null,
    passkey_created_at: null,
  };
  
  db.users.set(id, user);
  db.indices.usersByClerkId.set(clerkUserId, id);
  
  console.log('[DB] getOrCreateUserByClerkId - Created new user:', id, 'for Clerk ID:', clerkUserId);
  
  return user;
}

/**
 * Get user by Clerk ID
 */
export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  const userId = db.indices.usersByClerkId.get(clerkUserId);
  if (!userId) return null;
  return db.users.get(userId) || null;
}

export async function updateUserFailedAttempts(
  userId: string,
  failedAttempts: number,
  lockedUntil: Date | null
): Promise<void> {
  const user = db.users.get(userId);
  if (user) {
    user.failed_attempts = failedAttempts;
    user.locked_until = lockedUntil;
    user.updated_at = new Date();
    db.users.set(userId, user);
  }
}

export async function resetUserFailedAttempts(userId: string): Promise<void> {
  const user = db.users.get(userId);
  if (user) {
    user.failed_attempts = 0;
    user.locked_until = null;
    user.updated_at = new Date();
    db.users.set(userId, user);
  }
}

export async function updateUsername(userId: string, username: string): Promise<void> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    // Check if taken
    const existing = await pgDb.getUserByUsernamePg(username);
    if (existing && existing.id !== userId) {
      throw new Error("Username is already taken");
    }
    await pgDb.updateUsernamePg(userId, username);
    return;
  }
  
  // Fallback to in-memory storage
  // Check if username is already taken by another user
  const existingUser = Array.from(db.users.values()).find(
    u => u.username?.toLowerCase() === username.toLowerCase() && u.id !== userId
  );
  
  if (existingUser) {
    throw new Error("Username is already taken");
  }
  
  const user = db.users.get(userId);
  if (user) {
    user.username = username;
    user.username_last_changed = new Date();
    user.updated_at = new Date();
    db.users.set(userId, user);
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    return await pgDb.getUserByUsernamePg(username);
  }
  
  // Fallback to in-memory storage
  const user = Array.from(db.users.values()).find(
    u => u.username?.toLowerCase() === username.toLowerCase()
  );
  return user || null;
}

export async function updateUserPasskey(
  userId: string,
  passkeyData: {
    credentialId: string;
    publicKey: string;
    counter: number;
    deviceType: string;
    backedUp: boolean;
    transports: string[];
  }
): Promise<void> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    await pgDb.updateUserPasskeyPg(userId, passkeyData);
    return;
  }
  
  // Fallback to in-memory storage
  const user = db.users.get(userId);
  if (user) {
    user.passkey_credential_id = passkeyData.credentialId;
    user.passkey_public_key = passkeyData.publicKey;
    user.passkey_counter = passkeyData.counter;
    user.passkey_device_type = passkeyData.deviceType;
    user.passkey_backed_up = passkeyData.backedUp;
    user.passkey_transports = JSON.stringify(passkeyData.transports);
    user.passkey_created_at = new Date();
    user.updated_at = new Date();
    db.users.set(userId, user);
  }
}

export async function getUserPasskeyCredential(userId: string): Promise<{
  credentialId: string;
  publicKey: Uint8Array;
  counter: number;
  transports?: string[];
} | null> {
  const user = db.users.get(userId);
  if (!user || !user.passkey_credential_id || !user.passkey_public_key) {
    return null;
  }
  
  return {
    credentialId: user.passkey_credential_id,
    publicKey: Buffer.from(user.passkey_public_key, 'base64'),
    counter: user.passkey_counter,
    transports: user.passkey_transports ? JSON.parse(user.passkey_transports) : undefined,
  };
}

export async function updatePasskeyCounter(userId: string, newCounter: number): Promise<void> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    await pgDb.updatePasskeyCounterPg(userId, newCounter);
    return;
  }
  
  // Fallback to in-memory storage
  const user = db.users.get(userId);
  if (user) {
    user.passkey_counter = newCounter;
    user.updated_at = new Date();
    db.users.set(userId, user);
  }
}

// ============================================
// Wallet Operations
// ============================================

export interface WalletRecord {
  id: string;
  user_id: string;
  address: string;
  chain_id: number;
  version: number;
  cipher_priv: string;
  iv_priv: string;
  kdf_salt: string;
  kdf_params: string;
  security_level: 'password_only' | 'passkey_enabled';
  passkey_meta: string | null;
  wrapped_dek_password: string | null;
  iv_dek_password: string | null;
  wrapped_dek_passkey: string | null;
  iv_dek_passkey: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createWallet(
  id: string,
  userId: string,
  data: {
    address: string;
    chainId: number;
    version: number;
    cipherPriv: string;
    ivPriv: string;
    kdfSalt: string;
    kdfParams: object;
    securityLevel: string;
  }
): Promise<WalletRecord | null> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    return await pgDb.createWalletPg(id, userId, data);
  }
  
  // Fallback to in-memory storage
  if (db.indices.walletsByUserId.has(userId)) {
    return null; // User already has a wallet
  }

  const wallet: WalletRecord = {
    id,
    user_id: userId,
    address: data.address,
    chain_id: data.chainId,
    version: data.version,
    cipher_priv: data.cipherPriv,
    iv_priv: data.ivPriv,
    kdf_salt: data.kdfSalt,
    kdf_params: JSON.stringify(data.kdfParams),
    security_level: data.securityLevel as any,
    passkey_meta: null,
    wrapped_dek_password: null,
    iv_dek_password: null,
    wrapped_dek_passkey: null,
    iv_dek_passkey: null,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  db.wallets.set(id, wallet);
  db.indices.walletsByUserId.set(userId, id);
  db.indices.walletsByAddress.set(data.address, id);
  
  return wallet;
}

export async function getWalletByUserId(userId: string): Promise<WalletRecord | null> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    return await pgDb.getWalletByUserIdPg(userId);
  }
  
  // Fallback to in-memory storage
  const walletId = db.indices.walletsByUserId.get(userId);
  if (!walletId) return null;
  return db.wallets.get(walletId) || null;
}

export async function getWalletByAddress(address: string): Promise<WalletRecord | null> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    return await pgDb.getWalletByAddressPg(address);
  }
  
  // Fallback to in-memory storage
  const walletId = db.indices.walletsByAddress.get(address);
  if (!walletId) return null;
  return db.wallets.get(walletId) || null;
}

export async function updateWalletPasskey(
  userId: string,
  data: {
    cipherPriv: string;
    ivPriv: string;
    securityLevel: string;
    passkeyMeta: object;
    wrappedDekPassword: string;
    ivDekPassword: string;
    wrappedDekPasskey: string;
    ivDekPasskey: string;
  }
): Promise<void> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    await pgDb.updateWalletPasskeyPg(userId, data);
    return;
  }
  
  // Fallback to in-memory storage
  const walletId = db.indices.walletsByUserId.get(userId);
  if (!walletId) return;

  const wallet = db.wallets.get(walletId);
  if (wallet) {
    wallet.cipher_priv = data.cipherPriv;
    wallet.iv_priv = data.ivPriv;
    wallet.security_level = data.securityLevel;
    wallet.passkey_meta = JSON.stringify(data.passkeyMeta);
    wallet.wrapped_dek_password = data.wrappedDekPassword;
    wallet.iv_dek_password = data.ivDekPassword;
    wallet.wrapped_dek_passkey = data.wrappedDekPasskey;
    wallet.iv_dek_passkey = data.ivDekPasskey;
    wallet.updated_at = new Date();
    
    db.wallets.set(walletId, wallet);
  }
}

// ============================================
// Rate Limiting
// ============================================

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

export async function checkRateLimit(
  key: string, 
  maxAttempts: number = MAX_LOGIN_ATTEMPTS
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const record = db.rateLimits.get(key);
  
  // Clean up if expired
  if (record && record.resetAt < now) {
    db.rateLimits.delete(key);
  }
  
  const currentRecord = db.rateLimits.get(key);
  
  if (!currentRecord) {
    // First attempt
    const resetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW);
    db.rateLimits.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxAttempts - 1, resetAt };
  }
  
  if (currentRecord.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: currentRecord.resetAt };
  }
  
  // Increment count
  currentRecord.count += 1;
  db.rateLimits.set(key, currentRecord);
  
  return { 
    allowed: true, 
    remaining: maxAttempts - currentRecord.count, 
    resetAt: currentRecord.resetAt 
  };
}

export async function resetRateLimit(key: string): Promise<void> {
  db.rateLimits.delete(key);
}

// ============================================
// Session Operations
// ============================================

export async function createSession(
  id: string,
  userId: string,
  expiresAt: Date,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const session = {
    id,
    user_id: userId,
    expires_at: expiresAt,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    created_at: new Date()
  };
  
  db.sessions.set(id, session);
  
  if (!db.indices.sessionsByUserId.has(userId)) {
    db.indices.sessionsByUserId.set(userId, new Set());
  }
  db.indices.sessionsByUserId.get(userId)?.add(id);
}

export async function getSession(id: string): Promise<{ id: string; user_id: string; expires_at: Date } | null> {
  const session = db.sessions.get(id);
  if (!session) return null;
  
  if (session.expires_at < new Date()) {
    await deleteSession(id);
    return null;
  }
  
  return session;
}

export async function deleteSession(id: string): Promise<void> {
  const session = db.sessions.get(id);
  if (session) {
    const userId = session.user_id;
    db.indices.sessionsByUserId.get(userId)?.delete(id);
    db.sessions.delete(id);
  }
}

export async function deleteUserSessions(userId: string): Promise<void> {
  const sessionIds = db.indices.sessionsByUserId.get(userId);
  if (sessionIds) {
    for (const id of sessionIds) {
      db.sessions.delete(id);
    }
    db.indices.sessionsByUserId.delete(userId);
  }
}

// Cleanup expired sessions periodically
export async function cleanupExpiredSessions(): Promise<void> {
  const now = new Date();
  for (const [id, session] of db.sessions.entries()) {
    if (session.expires_at < now) {
      await deleteSession(id);
    }
  }
}
