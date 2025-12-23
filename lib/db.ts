/**
 * Database layer for Yuki Embedded Wallet
 * 
 * Replaces PostgreSQL with an in-memory storage for development/demo purposes.
 * This avoids the need for a running database during the hackathon/demo phase.
 */

// In-memory storage
const db = {
  users: new Map<string, any>(),
  wallets: new Map<string, any>(),
  sessions: new Map<string, any>(),
  rateLimits: new Map<string, any>(),
  indices: {
    usersByEmail: new Map<string, string>(),
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
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  email_verified: boolean;
  locked_until: Date | null;
  failed_attempts: number;
  username: string | null;
  username_last_changed: Date | null;
}

export async function createUser(
  id: string,
  email: string,
  passwordHash: string
): Promise<User | null> {
  const normalizedEmail = email.toLowerCase();
  
  if (db.indices.usersByEmail.has(normalizedEmail)) {
    return null; // Email already exists
  }
  
  const user: User = {
    id,
    email: normalizedEmail,
    password_hash: passwordHash,
    created_at: new Date(),
    updated_at: new Date(),
    email_verified: false,
    locked_until: null,
    failed_attempts: 0,
    username: null,
    username_last_changed: null
  };
  
  db.users.set(id, user);
  db.indices.usersByEmail.set(normalizedEmail, id);
  
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  return db.users.get(id) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const userId = db.indices.usersByEmail.get(email.toLowerCase());
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
  const user = db.users.get(userId);
  if (user) {
    user.username = username;
    user.username_last_changed = new Date();
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
  const walletId = db.indices.walletsByUserId.get(userId);
  if (!walletId) return null;
  return db.wallets.get(walletId) || null;
}

export async function getWalletByAddress(address: string): Promise<WalletRecord | null> {
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
