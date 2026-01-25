/**
 * PostgreSQL Database Layer for Yuki Embedded Wallet
 * 
 * Production-ready database implementation using PostgreSQL.
 * Provides the same interface as the in-memory database for easy migration.
 * 
 * To use PostgreSQL, set the DATABASE_URL environment variable.
 * If not set, falls back to in-memory storage for development.
 */

import { Pool, PoolClient } from 'pg';

// Create connection pool
const pool = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : null;

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  if (!pool) {
    console.log('[DB] No DATABASE_URL set, using in-memory storage');
    return;
  }
  
  const client = await pool.connect();
  try {
    await client.query(`
      -- Users table (synced with Clerk)
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        clerk_user_id TEXT UNIQUE,
        email TEXT,
        phone_number TEXT,
        password_hash TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        email_verified BOOLEAN DEFAULT false,
        locked_until TIMESTAMP,
        failed_attempts INTEGER DEFAULT 0,
        username TEXT UNIQUE,
        username_last_changed TIMESTAMP,
        passkey_credential_id TEXT,
        passkey_public_key TEXT,
        passkey_counter INTEGER DEFAULT 0,
        passkey_device_type TEXT,
        passkey_backed_up BOOLEAN DEFAULT false,
        passkey_transports TEXT,
        passkey_created_at TIMESTAMP
      );

      -- Create index for Clerk user lookup
      CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      -- Wallets table (NO PLAINTEXT KEYS)
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        address TEXT UNIQUE NOT NULL,
        chain_id INTEGER NOT NULL,
        version INTEGER DEFAULT 1,
        cipher_priv TEXT NOT NULL,
        iv_priv TEXT NOT NULL,
        kdf_salt TEXT NOT NULL,
        kdf_params JSONB NOT NULL,
        security_level TEXT DEFAULT 'password_only',
        passkey_meta JSONB,
        wrapped_dek_password TEXT,
        iv_dek_password TEXT,
        wrapped_dek_passkey TEXT,
        iv_dek_passkey TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for wallet lookup
      CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
      CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);

      -- Deposits table for tracking incoming transfers
      CREATE TABLE IF NOT EXISTS deposits (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        wallet_address TEXT NOT NULL,
        tx_hash TEXT UNIQUE,
        amount_wei TEXT NOT NULL,
        token_address TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        coinbase_charge_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMP
      );

      -- Create indexes for deposit lookup
      CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
      CREATE INDEX IF NOT EXISTS idx_deposits_wallet_address ON deposits(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_deposits_tx_hash ON deposits(tx_hash);

      -- Withdrawals table for tracking outgoing transfers
      CREATE TABLE IF NOT EXISTS withdrawals (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        wallet_address TEXT NOT NULL,
        tx_hash TEXT,
        amount_wei TEXT NOT NULL,
        token_address TEXT NOT NULL,
        destination_address TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );

      -- Create indexes for withdrawal lookup
      CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
    `);
    
    console.log('[DB] PostgreSQL schema initialized successfully');
  } finally {
    client.release();
  }
}

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

export async function createUserPg(
  id: string,
  email: string,
  passwordHash: string
): Promise<User | null> {
  if (!pool) return null;
  
  const normalizedEmail = email.toLowerCase();
  
  try {
    const result = await pool.query<User>(
      `INSERT INTO users (id, email, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
      [id, normalizedEmail, passwordHash]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('[DB] createUser error:', error);
    return null;
  }
}

export async function getUserByIdPg(id: string): Promise<User | null> {
  if (!pool) return null;
  
  const result = await pool.query<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  
  return result.rows[0] || null;
}

export async function getUserByEmailPg(email: string): Promise<User | null> {
  if (!pool) return null;
  
  const normalizedEmail = email.toLowerCase();
  const result = await pool.query<User>(
    'SELECT * FROM users WHERE email = $1',
    [normalizedEmail]
  );
  
  return result.rows[0] || null;
}

export async function getUserByClerkIdPg(clerkUserId: string): Promise<User | null> {
  if (!pool) return null;
  
  const result = await pool.query<User>(
    'SELECT * FROM users WHERE clerk_user_id = $1',
    [clerkUserId]
  );
  
  return result.rows[0] || null;
}

export async function getOrCreateUserByClerkIdPg(clerkUserId: string): Promise<User | null> {
  if (!pool) return null;
  
  // Try to find existing user
  let user = await getUserByClerkIdPg(clerkUserId);
  if (user) return user;
  
  // Create new user linked to Clerk
  const id = `user_${clerkUserId}`;
  const result = await pool.query<User>(
    `INSERT INTO users (id, clerk_user_id, email, created_at, updated_at, email_verified)
     VALUES ($1, $2, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
     ON CONFLICT (clerk_user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [id, clerkUserId]
  );
  
  return result.rows[0] || null;
}

export async function updateUsernamePg(userId: string, username: string): Promise<void> {
  if (!pool) return;
  
  await pool.query(
    `UPDATE users 
     SET username = $1, username_last_changed = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [username, userId]
  );
}

export async function getUserByUsernamePg(username: string): Promise<User | null> {
  if (!pool) return null;
  
  const result = await pool.query<User>(
    'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
    [username]
  );
  
  return result.rows[0] || null;
}

export async function updateUserPasskeyPg(
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
  if (!pool) return;
  
  await pool.query(
    `UPDATE users 
     SET passkey_credential_id = $1,
         passkey_public_key = $2,
         passkey_counter = $3,
         passkey_device_type = $4,
         passkey_backed_up = $5,
         passkey_transports = $6,
         passkey_created_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $7`,
    [
      passkeyData.credentialId,
      passkeyData.publicKey,
      passkeyData.counter,
      passkeyData.deviceType,
      passkeyData.backedUp,
      JSON.stringify(passkeyData.transports),
      userId
    ]
  );
}

export async function updatePasskeyCounterPg(userId: string, newCounter: number): Promise<void> {
  if (!pool) return;
  
  await pool.query(
    'UPDATE users SET passkey_counter = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newCounter, userId]
  );
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

export async function createWalletPg(
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
  if (!pool) return null;
  
  try {
    const result = await pool.query<WalletRecord>(
      `INSERT INTO wallets (id, user_id, address, chain_id, version, cipher_priv, iv_priv, kdf_salt, kdf_params, security_level, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING *`,
      [id, userId, data.address, data.chainId, data.version, data.cipherPriv, data.ivPriv, data.kdfSalt, JSON.stringify(data.kdfParams), data.securityLevel]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('[DB] createWallet error:', error);
    return null;
  }
}

export async function getWalletByUserIdPg(userId: string): Promise<WalletRecord | null> {
  if (!pool) return null;
  
  const result = await pool.query<WalletRecord>(
    'SELECT * FROM wallets WHERE user_id = $1',
    [userId]
  );
  
  return result.rows[0] || null;
}

export async function getWalletByAddressPg(address: string): Promise<WalletRecord | null> {
  if (!pool) return null;
  
  const result = await pool.query<WalletRecord>(
    'SELECT * FROM wallets WHERE address = $1',
    [address]
  );
  
  return result.rows[0] || null;
}

export async function updateWalletPasskeyPg(
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
  if (!pool) return;
  
  await pool.query(
    `UPDATE wallets 
     SET cipher_priv = $1,
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
}

// ============================================
// Deposit Operations
// ============================================

export interface Deposit {
  id: string;
  user_id: string;
  wallet_address: string;
  tx_hash: string | null;
  amount_wei: string;
  token_address: string;
  status: 'pending' | 'confirmed' | 'failed';
  coinbase_charge_id: string | null;
  created_at: Date;
  confirmed_at: Date | null;
}

export async function createDepositPg(
  id: string,
  userId: string,
  data: {
    walletAddress: string;
    txHash?: string;
    amountWei: string;
    tokenAddress: string;
    status?: string;
    coinbaseChargeId?: string;
  }
): Promise<Deposit | null> {
  if (!pool) return null;
  
  const result = await pool.query<Deposit>(
    `INSERT INTO deposits (id, user_id, wallet_address, tx_hash, amount_wei, token_address, status, coinbase_charge_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
     ON CONFLICT (tx_hash) DO NOTHING
     RETURNING *`,
    [id, userId, data.walletAddress, data.txHash || null, data.amountWei, data.tokenAddress, data.status || 'pending', data.coinbaseChargeId || null]
  );
  
  return result.rows[0] || null;
}

export async function getDepositsByUserIdPg(userId: string): Promise<Deposit[]> {
  if (!pool) return [];
  
  const result = await pool.query<Deposit>(
    'SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  
  return result.rows;
}

export async function updateDepositStatusPg(txHash: string, status: string): Promise<void> {
  if (!pool) return;
  
  await pool.query(
    `UPDATE deposits 
     SET status = $1, confirmed_at = CASE WHEN $1 = 'confirmed' THEN CURRENT_TIMESTAMP ELSE confirmed_at END
     WHERE tx_hash = $2`,
    [status, txHash]
  );
}

// ============================================
// Utility functions
// ============================================

export async function healthCheck(): Promise<boolean> {
  if (!pool) return false;
  
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}

// Export pool for advanced usage
export { pool };

