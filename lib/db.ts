/**
 * Database layer for Yuki Embedded Wallet
 * 
 * Uses PostgreSQL (Neon) for production.
 * 
 * IMPORTANT: The server ONLY stores encrypted wallet data.
 * The server NEVER has access to plaintext private keys.
 */

import { Pool, PoolClient } from 'pg';

// Initialize connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Track if schema has been initialized
let schemaInitialized = false;

async function initSchema(): Promise<void> {
  if (schemaInitialized) return;
  
  const client = await pool.connect();
  try {
    // Users table - basic auth info
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        email_verified BOOLEAN DEFAULT FALSE,
        locked_until TIMESTAMP DEFAULT NULL,
        failed_attempts INTEGER DEFAULT 0
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    
    // Wallets table - encrypted wallet data (ONE per user)
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        address TEXT NOT NULL,
        chain_id INTEGER DEFAULT 1,
        version INTEGER DEFAULT 1,
        
        -- Encrypted private key (Base64)
        cipher_priv TEXT NOT NULL,
        iv_priv TEXT NOT NULL,
        
        -- KDF parameters
        kdf_salt TEXT NOT NULL,
        kdf_params TEXT NOT NULL,
        
        -- Security level
        security_level TEXT DEFAULT 'password_only',
        
        -- Passkey fields (nullable until upgraded)
        passkey_meta TEXT DEFAULT NULL,
        wrapped_dek_password TEXT DEFAULT NULL,
        iv_dek_password TEXT DEFAULT NULL,
        wrapped_dek_passkey TEXT DEFAULT NULL,
        iv_dek_passkey TEXT DEFAULT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
      CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
    `);
    
    // Sessions table (for httpOnly cookie sessions backup)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        
        CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    `);
    
    // Rate limiting table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0,
        reset_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);
    `);
    
    schemaInitialized = true;
  } finally {
    client.release();
  }
}

// Ensure schema is initialized before any operation
async function getClient(): Promise<PoolClient> {
  await initSchema();
  return pool.connect();
}

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
}

export async function createUser(
  id: string,
  email: string,
  passwordHash: string
): Promise<User | null> {
  const client = await getClient();
  try {
    const result = await client.query(
      `INSERT INTO users (id, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, email.toLowerCase(), passwordHash]
    );
    return result.rows[0] || null;
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === '23505') { // unique_violation
      return null; // Email already exists
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const client = await getClient();
  try {
    const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const client = await getClient();
  try {
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function updateUserFailedAttempts(
  userId: string,
  failedAttempts: number,
  lockedUntil: Date | null
): Promise<void> {
  const client = await getClient();
  try {
    await client.query(
      `UPDATE users 
       SET failed_attempts = $1, locked_until = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [failedAttempts, lockedUntil, userId]
    );
  } finally {
    client.release();
  }
}

export async function resetUserFailedAttempts(userId: string): Promise<void> {
  const client = await getClient();
  try {
    await client.query(
      `UPDATE users 
       SET failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );
  } finally {
    client.release();
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
  const client = await getClient();
  try {
    const result = await client.query(
      `INSERT INTO wallets (
        id, user_id, address, chain_id, version,
        cipher_priv, iv_priv, kdf_salt, kdf_params, security_level
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        id,
        userId,
        data.address,
        data.chainId,
        data.version,
        data.cipherPriv,
        data.ivPriv,
        data.kdfSalt,
        JSON.stringify(data.kdfParams),
        data.securityLevel
      ]
    );
    return result.rows[0] || null;
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === '23505') { // unique_violation
      return null; // User already has a wallet
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getWalletByUserId(userId: string): Promise<WalletRecord | null> {
  const client = await getClient();
  try {
    const result = await client.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function getWalletByAddress(address: string): Promise<WalletRecord | null> {
  const client = await getClient();
  try {
    const result = await client.query('SELECT * FROM wallets WHERE address = $1', [address]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
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
  const client = await getClient();
  try {
    await client.query(
      `UPDATE wallets SET
        cipher_priv = $1,
        iv_priv = $2,
        security_level = $3,
        passkey_meta = $4,
        wrapped_dek_password = $5,
        iv_dek_password = $6,
        wrapped_dek_passkey = $7,
        iv_dek_passkey = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $9`,
      [
        data.cipherPriv,
        data.ivPriv,
        data.securityLevel,
        JSON.stringify(data.passkeyMeta),
        data.wrappedDekPassword,
        data.ivDekPassword,
        data.wrappedDekPasskey,
        data.ivDekPasskey,
        userId
      ]
    );
  } finally {
    client.release();
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
  const client = await getClient();
  try {
    const now = new Date();
    const resetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW);
    
    // Clean up expired rate limits
    await client.query('DELETE FROM rate_limits WHERE reset_at < $1', [now]);
    
    // Get current rate limit
    const result = await client.query('SELECT * FROM rate_limits WHERE key = $1', [key]);
    const record = result.rows[0];
    
    if (!record) {
      // First attempt
      await client.query(
        'INSERT INTO rate_limits (key, count, reset_at) VALUES ($1, 1, $2)',
        [key, resetAt]
      );
      return { allowed: true, remaining: maxAttempts - 1, resetAt };
    }
    
    const recordResetAt = new Date(record.reset_at);
    if (recordResetAt < now) {
      // Reset expired
      await client.query(
        'UPDATE rate_limits SET count = 1, reset_at = $1 WHERE key = $2',
        [resetAt, key]
      );
      return { allowed: true, remaining: maxAttempts - 1, resetAt };
    }
    
    if (record.count >= maxAttempts) {
      return { allowed: false, remaining: 0, resetAt: recordResetAt };
    }
    
    // Increment count
    await client.query('UPDATE rate_limits SET count = count + 1 WHERE key = $1', [key]);
    return { allowed: true, remaining: maxAttempts - record.count - 1, resetAt: recordResetAt };
  } finally {
    client.release();
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  const client = await getClient();
  try {
    await client.query('DELETE FROM rate_limits WHERE key = $1', [key]);
  } finally {
    client.release();
  }
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
  const client = await getClient();
  try {
    await client.query(
      `INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, userId, expiresAt, ipAddress || null, userAgent || null]
    );
  } finally {
    client.release();
  }
}

export async function getSession(id: string): Promise<{ id: string; user_id: string; expires_at: Date } | null> {
  const client = await getClient();
  try {
    const result = await client.query(
      'SELECT * FROM sessions WHERE id = $1 AND expires_at > $2',
      [id, new Date()]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function deleteSession(id: string): Promise<void> {
  const client = await getClient();
  try {
    await client.query('DELETE FROM sessions WHERE id = $1', [id]);
  } finally {
    client.release();
  }
}

export async function deleteUserSessions(userId: string): Promise<void> {
  const client = await getClient();
  try {
    await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  } finally {
    client.release();
  }
}

// Cleanup expired sessions periodically
export async function cleanupExpiredSessions(): Promise<void> {
  const client = await getClient();
  try {
    await client.query('DELETE FROM sessions WHERE expires_at < $1', [new Date()]);
  } finally {
    client.release();
  }
}
