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
    // Create users table (Clerk-first design with optional local auth)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        clerk_user_id TEXT,
        auth_provider TEXT DEFAULT 'clerk',
        email TEXT,
        phone_number TEXT,
        password_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        email_verified BOOLEAN DEFAULT false,
        locked_until TIMESTAMP,
        failed_attempts INTEGER DEFAULT 0,
        username TEXT,
        username_last_changed TIMESTAMP,
        passkey_credential_id TEXT,
        passkey_public_key TEXT,
        passkey_counter INTEGER DEFAULT 0,
        passkey_device_type TEXT,
        passkey_backed_up BOOLEAN DEFAULT false,
        passkey_transports TEXT,
        passkey_created_at TIMESTAMP
      );
    `);

    // Add missing columns if they don't exist (migration for existing tables)
    await client.query(`
      DO $$ 
      BEGIN
        -- Add clerk_user_id if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'clerk_user_id'
        ) THEN
          ALTER TABLE users ADD COLUMN clerk_user_id TEXT;
        END IF;
        
        -- Add auth_provider column (default 'clerk' for Clerk-based auth)
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'auth_provider'
        ) THEN
          ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'clerk';
        END IF;
        
        -- Add username if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'username'
        ) THEN
          ALTER TABLE users ADD COLUMN username TEXT;
        END IF;
        
        -- Add username_last_changed if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'username_last_changed'
        ) THEN
          ALTER TABLE users ADD COLUMN username_last_changed TIMESTAMP;
        END IF;
        
        -- Add unique constraint on clerk_user_id if missing (required for ON CONFLICT)
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_name = 'users' AND constraint_name = 'users_clerk_user_id_key'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_clerk_user_id_key UNIQUE (clerk_user_id);
        END IF;
      END $$;
    `);

    // Make password_hash nullable (Clerk users don't need passwords)
    // This is safe to run multiple times - PostgreSQL handles it gracefully
    await client.query(`
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    `).catch(() => {
      // Column might already be nullable, ignore error
    });

    // Make email nullable (Clerk users authenticate via phone, may not have email)
    await client.query(`
      ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
    `).catch(() => {
      // Column might already be nullable, ignore error
    });

    // Add CHECK constraint for local auth (password required only for local users)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.check_constraints 
          WHERE constraint_name = 'chk_password_required'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT chk_password_required 
            CHECK (auth_provider != 'local' OR password_hash IS NOT NULL);
        END IF;
      END $$;
    `);

    // Add wallet_address column for Alchemy Smart Wallets
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'wallet_address'
        ) THEN
          ALTER TABLE users ADD COLUMN wallet_address TEXT;
        END IF;
      END $$;
    `);

    // Create indexes (including for clerk_user_id and wallet_address)
    // Use case-insensitive index for username
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id) WHERE clerk_user_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address) WHERE wallet_address IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Drop old username index and create case-insensitive one
    await client.query(`
      DROP INDEX IF EXISTS idx_users_username;
      DROP INDEX IF EXISTS users_username_key;
    `).catch(() => {
      // Indexes might not exist, ignore
    });

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username)) WHERE username IS NOT NULL;
    `);

    // Add profile fields if missing
    await client.query(`
      DO $$ 
      BEGIN
        -- Add display_name if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'display_name'
        ) THEN
          ALTER TABLE users ADD COLUMN display_name TEXT;
        END IF;
        
        -- Add bio if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'bio'
        ) THEN
          ALTER TABLE users ADD COLUMN bio TEXT;
        END IF;
        
        -- Add avatar_url if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'avatar_url'
        ) THEN
          ALTER TABLE users ADD COLUMN avatar_url TEXT;
        END IF;
        
        -- Add banner_url if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'banner_url'
        ) THEN
          ALTER TABLE users ADD COLUMN banner_url TEXT;
        END IF;
        
        -- Add is_private if missing (default false = public profile)
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'is_private'
        ) THEN
          ALTER TABLE users ADD COLUMN is_private BOOLEAN DEFAULT false;
        END IF;
      END $$;
    `);

    // Add profile field constraints (safe to run multiple times)
    await client.query(`
      DO $$ 
      BEGIN
        -- Add bio length constraint
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.check_constraints 
          WHERE constraint_name = 'chk_bio_length'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT chk_bio_length CHECK (char_length(bio) <= 160);
        END IF;
        
        -- Add display_name length constraint
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.check_constraints 
          WHERE constraint_name = 'chk_display_name_length'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT chk_display_name_length CHECK (char_length(display_name) <= 50);
        END IF;
      END $$;
    `);

    // Create handle_history table for redirecting old handles
    await client.query(`
      CREATE TABLE IF NOT EXISTS handle_history (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        old_handle TEXT NOT NULL,
        new_handle TEXT NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_handle_history_old ON handle_history(LOWER(old_handle));
      CREATE INDEX IF NOT EXISTS idx_handle_history_user_id ON handle_history(user_id);
    `);

    // Create wallets table
    await client.query(`
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

      CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
      CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
    `);

    // Create deposits table
    await client.query(`
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

      CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
      CREATE INDEX IF NOT EXISTS idx_deposits_wallet_address ON deposits(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_deposits_tx_hash ON deposits(tx_hash);
    `);

    // Create withdrawals table
    await client.query(`
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

      CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
    `);

    // Create contacts table for saved contacts
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        contact_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        nickname TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, contact_user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_contact_user_id ON contacts(contact_user_id);
    `);

    // Add columns introduced by the yUSD architecture plan. Idempotent —
    // each ALTER is gated by an information_schema lookup so re-running the
    // initializer is safe.
    await client.query(`
      DO $$
      BEGIN
        -- deposits.intent_id: client-generated UUID, attached to onramp URL
        -- as partnerUserRef so we can correlate the popup completion to a
        -- pending deposits row before the on-chain transfer arrives.
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'intent_id') THEN
          ALTER TABLE deposits ADD COLUMN intent_id TEXT;
          CREATE UNIQUE INDEX IF NOT EXISTS idx_deposits_intent_id ON deposits(intent_id) WHERE intent_id IS NOT NULL;
        END IF;

        -- deposits.deposit_op_hash: the UserOp hash of the auto-deposit into
        -- the yUSD vault. NULL in stub mode (no UserOp fired). Unique so we
        -- never enqueue two deposit UserOps for the same arrival.
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'deposit_op_hash') THEN
          ALTER TABLE deposits ADD COLUMN deposit_op_hash TEXT;
          CREATE UNIQUE INDEX IF NOT EXISTS idx_deposits_deposit_op_hash ON deposits(deposit_op_hash) WHERE deposit_op_hash IS NOT NULL;
        END IF;

        -- deposits.fiat_status: tracks the onramp side (card charged, card
        -- failed) independently of the on-chain deposit lifecycle.
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'fiat_status') THEN
          ALTER TABLE deposits ADD COLUMN fiat_status TEXT;
        END IF;

        -- deposits.token_symbol_at_time: the user-facing label captured at
        -- write time. Snapshot, not live-resolved — see lib/transactions/
        -- getTransaction.ts for the precedence comment. Default 'yUSD'
        -- correctly backfills empty existing rows (audit confirmed both Neon
        -- branches were empty at Phase 1 cutover).
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deposits' AND column_name = 'token_symbol_at_time') THEN
          ALTER TABLE deposits ADD COLUMN token_symbol_at_time TEXT NOT NULL DEFAULT 'yUSD';
        END IF;

        -- withdrawals: off-ramp tracking columns.
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'coinbase_session_id') THEN
          ALTER TABLE withdrawals ADD COLUMN coinbase_session_id TEXT;
          CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawals_coinbase_session_id ON withdrawals(coinbase_session_id) WHERE coinbase_session_id IS NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'coinbase_deposit_address') THEN
          ALTER TABLE withdrawals ADD COLUMN coinbase_deposit_address TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'redeem_op_hash') THEN
          ALTER TABLE withdrawals ADD COLUMN redeem_op_hash TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'transfer_op_hash') THEN
          ALTER TABLE withdrawals ADD COLUMN transfer_op_hash TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'payout_method') THEN
          ALTER TABLE withdrawals ADD COLUMN payout_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'fiat_status') THEN
          ALTER TABLE withdrawals ADD COLUMN fiat_status TEXT;
        END IF;

        -- withdrawals.token_symbol_at_time: matches the deposits column.
        -- See getTransaction.ts precedence comment for snapshot semantics.
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'token_symbol_at_time') THEN
          ALTER TABLE withdrawals ADD COLUMN token_symbol_at_time TEXT NOT NULL DEFAULT 'yUSD';
        END IF;
      END $$;
    `);

    // Reserve the requests table now (Phase 1) so Phase 2 SendModal can
    // emit "request fulfilled" events against the right schema from day one.
    // Phase 3 wires the actual UI + API routes.
    await client.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        requester_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount_usd NUMERIC(12,2) NOT NULL,
        memo TEXT,
        target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'open',
        paid_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        paid_tx_hash TEXT,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
      );

      CREATE INDEX IF NOT EXISTS idx_requests_requester ON requests(requester_user_id);
      CREATE INDEX IF NOT EXISTS idx_requests_target_open ON requests(target_user_id) WHERE status = 'open';
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
  // Wallet-based auth (Alchemy Smart Wallets)
  wallet_address: string | null;
  // Legacy: Clerk auth (deprecated)
  clerk_user_id: string | null;
  auth_provider: 'alchemy' | 'clerk' | 'local';
  email: string | null;
  phone_number: string | null;
  password_hash: string | null;
  created_at: Date;
  updated_at: Date;
  email_verified: boolean;
  locked_until: Date | null;
  failed_attempts: number;
  username: string | null;
  username_last_changed: Date | null;
  // Profile fields
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  is_private: boolean;
  // Passkey fields (legacy - now handled by Alchemy)
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

/**
 * Get or create a user by Clerk user ID.
 * 
 * This function is idempotent and concurrency-safe:
 * - Uses a single INSERT ... ON CONFLICT ... RETURNING * for atomicity
 * - Always returns a User or throws an error (never null)
 * - Safe to call from multiple concurrent requests
 * 
 * @throws Error if pool is not available or insert fails
 */
export async function getOrCreateUserByClerkIdPg(clerkUserId: string): Promise<User> {
  if (!pool) {
    throw new Error('[DB] PostgreSQL pool not available - DATABASE_URL not set');
  }

  const id = `user_${clerkUserId}`;

  // Single atomic upsert - no race conditions possible
  const result = await pool.query<User>(
    `INSERT INTO users (id, clerk_user_id, auth_provider, created_at, updated_at, email_verified)
     VALUES ($1, $2, 'clerk', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
     ON CONFLICT (clerk_user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [id, clerkUserId]
  );

  if (!result.rows[0]) {
    throw new Error(`[DB] Failed to create/get user for Clerk ID: ${clerkUserId}`);
  }

  return result.rows[0];
}

/**
 * Get or create a user by wallet address (for Alchemy Smart Wallets)
 * 
 * Uses a safe pattern to handle race conditions:
 * 1. Try to find existing user
 * 2. If not found, insert (without ON CONFLICT expression which doesn't work with expression indexes)
 * 3. If insert fails due to race condition, find the user that was just created
 */
export async function getOrCreateUserByWalletAddressPg(walletAddress: string): Promise<User> {
  if (!pool) {
    throw new Error('[DB] PostgreSQL pool not available - DATABASE_URL not set');
  }

  const normalizedAddress = walletAddress.toLowerCase();

  // First try to find existing user
  const existing = await pool.query<User>(
    `SELECT * FROM users WHERE LOWER(wallet_address) = LOWER($1)`,
    [normalizedAddress]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  // Create new user - use a simple insert
  const id = `user_${normalizedAddress.slice(2, 10)}_${Date.now()}`;

  try {
    const result = await pool.query<User>(
      `INSERT INTO users (id, wallet_address, auth_provider, created_at, updated_at, email_verified)
       VALUES ($1, $2, 'alchemy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
       RETURNING *`,
      [id, normalizedAddress]
    );

    if (result.rows[0]) {
      return result.rows[0];
    }
  } catch (error: unknown) {
    // Handle unique constraint violation (race condition - another request created the user)
    const pgError = error as { code?: string };
    if (pgError.code === '23505') { // unique_violation
      const retryFind = await pool.query<User>(
        `SELECT * FROM users WHERE LOWER(wallet_address) = LOWER($1)`,
        [normalizedAddress]
      );

      if (retryFind.rows[0]) {
        return retryFind.rows[0];
      }
    }
    throw error;
  }

  throw new Error(`[DB] Failed to create/get user for wallet: ${normalizedAddress}`);
}

/**
 * Get user by wallet address
 */
export async function getUserByWalletAddressPg(walletAddress: string): Promise<User | null> {
  if (!pool) return null;

  const result = await pool.query<User>(
    'SELECT * FROM users WHERE LOWER(wallet_address) = LOWER($1)',
    [walletAddress]
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

/**
 * Conditionally update a user's email.
 * Only writes when the new value is non-null AND differs from the current row.
 * Returns true if a write happened, false otherwise.
 */
export async function setUserEmailIfChangedPg(userId: string, email: string): Promise<boolean> {
  if (!pool) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const result = await pool.query(
    `UPDATE users
     SET email = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND (email IS DISTINCT FROM $1)`,
    [normalized, userId]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function getUserByUsernamePg(username: string): Promise<User | null> {
  if (!pool) return null;

  const result = await pool.query<User>(
    'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
    [username]
  );

  return result.rows[0] || null;
}

export interface ProfileUpdateData {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  is_private?: boolean;
}

export async function updateUserProfilePg(userId: string, data: ProfileUpdateData): Promise<void> {
  if (!pool) return;

  console.log('[DB] updateUserProfilePg called with:', JSON.stringify({ userId, data }, null, 2));

  // Build dynamic update query based on provided fields
  const updates: string[] = [];
  const values: (string | boolean | null)[] = [];
  let paramIndex = 1;

  if (data.display_name !== undefined) {
    updates.push(`display_name = $${paramIndex++}`);
    values.push(data.display_name);
  }
  if (data.bio !== undefined) {
    updates.push(`bio = $${paramIndex++}`);
    values.push(data.bio);
  }
  if (data.avatar_url !== undefined) {
    updates.push(`avatar_url = $${paramIndex++}`);
    values.push(data.avatar_url);
    console.log('[DB] Setting avatar_url to:', data.avatar_url);
  }
  if (data.banner_url !== undefined) {
    updates.push(`banner_url = $${paramIndex++}`);
    values.push(data.banner_url);
    console.log('[DB] Setting banner_url to:', data.banner_url);
  }
  if (data.is_private !== undefined) {
    updates.push(`is_private = $${paramIndex++}`);
    values.push(data.is_private);
  }

  if (updates.length === 0) return;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
  console.log('[DB] Executing query:', query);
  console.log('[DB] With values:', values);

  await pool.query(query, values);

  console.log('[DB] Profile update completed successfully');
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
// Handle History Operations
// ============================================

export interface HandleHistoryRecord {
  id: string;
  user_id: string;
  old_handle: string;
  new_handle: string;
  changed_at: Date;
}

/**
 * Record a handle change in history for redirects
 */
export async function addHandleHistoryPg(
  userId: string,
  oldHandle: string,
  newHandle: string
): Promise<void> {
  if (!pool) return;

  const id = `handle_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  await pool.query(
    `INSERT INTO handle_history (id, user_id, old_handle, new_handle, changed_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     ON CONFLICT (LOWER(old_handle)) DO UPDATE SET
       new_handle = $4,
       changed_at = CURRENT_TIMESTAMP`,
    [id, userId, oldHandle, newHandle]
  );
}

/**
 * Look up a handle in history to find the current handle
 */
export async function getHandleRedirectPg(oldHandle: string): Promise<string | null> {
  if (!pool) return null;

  const result = await pool.query<HandleHistoryRecord>(
    `SELECT new_handle FROM handle_history 
     WHERE LOWER(old_handle) = LOWER($1)
     ORDER BY changed_at DESC
     LIMIT 1`,
    [oldHandle]
  );

  return result.rows[0]?.new_handle || null;
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
  // Deposit lifecycle, expanded by the yUSD pipeline:
  //   intent     — onramp popup opened, no on-chain transfer yet
  //   pending    — on-chain transfer detected, deposit UserOp not yet fired
  //   depositing — deposit UserOp submitted, awaiting receipt
  //   confirmed  — terminal (vault deposit confirmed, or stub-mode skip)
  //   retry      — vault paused/capped or deposit UserOp errored; manual retry
  //   failed     — terminal failure (rare)
  status: 'intent' | 'pending' | 'depositing' | 'confirmed' | 'retry' | 'failed';
  coinbase_charge_id: string | null;
  created_at: Date;
  confirmed_at: Date | null;
  intent_id: string | null;
  deposit_op_hash: string | null;
  fiat_status: 'pending' | 'charged' | 'failed' | null;
  token_symbol_at_time: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  wallet_address: string;
  tx_hash: string | null;
  amount_wei: string;
  token_address: string;
  destination_address: string;
  // Outbound lifecycle (sub-phase 2b will exercise the full set):
  //   pending     — confirm received, redeem not yet fired
  //   redeeming   — vault redemption UserOp submitted
  //   transferring — USDC transfer to off-ramp deposit address submitted
  //   settling    — Coinbase has the USDC; bank payout in progress
  //   completed   — terminal success
  //   failed      — terminal failure (on-chain or off-ramp)
  status: 'pending' | 'redeeming' | 'transferring' | 'settling' | 'completed' | 'failed';
  created_at: Date;
  completed_at: Date | null;
  coinbase_session_id: string | null;
  coinbase_deposit_address: string | null;
  redeem_op_hash: string | null;
  transfer_op_hash: string | null;
  payout_method: 'bank' | 'debit' | null;
  fiat_status: 'pending' | 'processing' | 'completed' | 'failed' | null;
  token_symbol_at_time: string;
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

// ─── yUSD pipeline helpers ───────────────────────────────────────────────
// Added in sub-phase 2a.

/**
 * Create an "intent" deposit row before the user opens the onramp popup.
 *
 * The `intent_id` is attached to Coinbase's `partnerUserRef` so we can
 * correlate the popup completion to this row even before the on-chain
 * transfer arrives. `tx_hash` stays NULL until `recordDepositArrivalPg`
 * fills it in. Idempotent on `intent_id`.
 */
export async function createDepositIntentPg(args: {
  id: string;
  userId: string;
  walletAddress: string;
  intentId: string;
  amountWei: string;
  tokenAddress: string;
  tokenSymbol: string;
  fiatStatus?: 'pending' | 'charged' | 'failed';
}): Promise<Deposit | null> {
  if (!pool) return null;

  const result = await pool.query<Deposit>(
    `INSERT INTO deposits
       (id, user_id, wallet_address, tx_hash, amount_wei, token_address,
        status, intent_id, fiat_status, token_symbol_at_time, created_at)
     VALUES ($1, $2, $3, NULL, $4, $5, 'intent', $6, $7, $8, CURRENT_TIMESTAMP)
     -- WHERE clause mirrors the partial unique index
     -- idx_deposits_intent_id (... WHERE intent_id IS NOT NULL).
     -- PostgreSQL requires the conflict target's predicate to exactly
     -- match the partial index's predicate.
     ON CONFLICT (intent_id) WHERE intent_id IS NOT NULL DO NOTHING
     RETURNING *`,
    [
      args.id,
      args.userId,
      args.walletAddress,
      args.amountWei,
      args.tokenAddress,
      args.intentId,
      args.fiatStatus || 'pending',
      args.tokenSymbol,
    ],
  );
  return result.rows[0] || null;
}

/**
 * Record an on-chain inbound transfer detected by the indexer.
 *
 * Tries to attach the tx_hash to the most-recent open intent for this
 * wallet whose amount is within tolerance. If no matching intent exists
 * (raw crypto deposit from another wallet), creates a fresh row with
 * `intent_id = NULL` and `status = 'pending'`.
 *
 * Idempotent: `tx_hash` is `UNIQUE`, so duplicate arrivals (e.g., the
 * indexer firing twice during a reconnect) don't double-write.
 */
export async function recordDepositArrivalPg(args: {
  walletAddress: string;
  txHash: string;
  amountWei: string;
  tokenAddress: string;
  tokenSymbol: string;
}): Promise<Deposit | null> {
  if (!pool) return null;

  // Try to claim an open intent first. Match by wallet + amount (exact, in
  // wei) to avoid grabbing the wrong intent when the user has multiple in
  // flight. Only claim rows where tx_hash is still NULL — once claimed, the
  // race is over.
  const claimed = await pool.query<Deposit>(
    `UPDATE deposits
       SET tx_hash = $1, status = 'pending'
       WHERE id = (
         SELECT id FROM deposits
          WHERE LOWER(wallet_address) = LOWER($2)
            AND status = 'intent'
            AND tx_hash IS NULL
            AND amount_wei = $3
            AND token_address = $4
          ORDER BY created_at DESC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
       )
       RETURNING *`,
    [args.txHash, args.walletAddress, args.amountWei, args.tokenAddress],
  );
  if (claimed.rows[0]) return claimed.rows[0];

  // No matching intent — record as a fresh non-intent arrival (raw crypto
  // deposit). user_id stays NULL until we resolve it via wallet_address;
  // the API route does that lookup before calling this helper.
  const id = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const fresh = await pool.query<Deposit>(
    `INSERT INTO deposits
       (id, user_id, wallet_address, tx_hash, amount_wei, token_address,
        status, token_symbol_at_time, created_at)
     VALUES (
       $1,
       (SELECT id FROM users WHERE LOWER(wallet_address) = LOWER($2) LIMIT 1),
       $2, $3, $4, $5, 'pending', $6, CURRENT_TIMESTAMP
     )
     ON CONFLICT (tx_hash) DO NOTHING
     RETURNING *`,
    [id, args.walletAddress, args.txHash, args.amountWei, args.tokenAddress, args.tokenSymbol],
  );
  return fresh.rows[0] || null;
}

/**
 * Set the auto-deposit UserOp hash on a row. Called after
 * `useSendUserOperation`'s `sendUserOperationAsync` resolves.
 *
 * Idempotent: bails if `deposit_op_hash` is already populated. Prevents
 * double-deposits when the arrival fires twice during indexer reconnect.
 */
export async function setDepositOpHashPg(
  id: string,
  opHash: string,
): Promise<boolean> {
  if (!pool) return false;
  const result = await pool.query(
    `UPDATE deposits
       SET deposit_op_hash = $1, status = 'depositing'
       WHERE id = $2 AND deposit_op_hash IS NULL
       RETURNING id`,
    [opHash, id],
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Mark a deposit as terminal — `confirmed`, `retry`, or `failed`.
 */
export async function markDepositTerminalPg(
  id: string,
  status: 'confirmed' | 'retry' | 'failed',
): Promise<void> {
  if (!pool) return;
  await pool.query(
    `UPDATE deposits
       SET status = $1,
           confirmed_at = CASE WHEN $1 = 'confirmed' THEN CURRENT_TIMESTAMP ELSE confirmed_at END
       WHERE id = $2`,
    [status, id],
  );
}

/** Update fiat-side status (Coinbase webhook or popup-close fallback). */
export async function setDepositFiatStatusPg(
  intentId: string,
  fiatStatus: 'pending' | 'charged' | 'failed',
): Promise<void> {
  if (!pool) return;
  await pool.query(
    `UPDATE deposits SET fiat_status = $1 WHERE intent_id = $2`,
    [fiatStatus, intentId],
  );
}

/** Single fetch by id, scoped to a wallet (auth). */
export async function getDepositByIdPg(
  id: string,
  walletAddress: string,
): Promise<Deposit | null> {
  if (!pool) return null;
  const result = await pool.query<Deposit>(
    `SELECT * FROM deposits
       WHERE id = $1 AND LOWER(wallet_address) = LOWER($2)`,
    [id, walletAddress],
  );
  return result.rows[0] || null;
}

/** Snapshot lookup for getTransaction.ts. No auth — receipts are public. */
export async function getDepositByTxHashPg(
  txHash: string,
): Promise<Deposit | null> {
  if (!pool) return null;
  const result = await pool.query<Deposit>(
    `SELECT * FROM deposits WHERE tx_hash = $1`,
    [txHash],
  );
  return result.rows[0] || null;
}

/**
 * Sum confirmed deposits minus completed withdrawals for a wallet, all in
 * the smallest token unit (wei for the token's `decimals`). Caller formats.
 *
 * Used as cost basis for `getEarned`. In stub mode this stays effectively
 * equal to the live balance, so earned clamps to $0.00 — which is the
 * truthful answer (USDC doesn't accrue yield). The data accumulates
 * correctly for vault cutover continuity: the moment the vault lights up,
 * every existing user already has a basis on record.
 */
export async function getCostBasisPg(
  walletAddress: string,
): Promise<{ deposited: string; withdrawn: string; basis: string }> {
  if (!pool) return { deposited: '0', withdrawn: '0', basis: '0' };

  const dep = await pool.query<{ sum: string | null }>(
    `SELECT COALESCE(SUM(amount_wei::numeric), 0)::text AS sum
       FROM deposits
       WHERE LOWER(wallet_address) = LOWER($1) AND status = 'confirmed'`,
    [walletAddress],
  );
  const wd = await pool.query<{ sum: string | null }>(
    `SELECT COALESCE(SUM(amount_wei::numeric), 0)::text AS sum
       FROM withdrawals
       WHERE LOWER(wallet_address) = LOWER($1) AND status = 'completed'`,
    [walletAddress],
  );
  const deposited = dep.rows[0]?.sum ?? '0';
  const withdrawn = wd.rows[0]?.sum ?? '0';
  // Caller does the BigInt math if it cares about wei precision. For the
  // 2-decimal display path, simple subtraction is fine.
  const basis = (
    BigInt(deposited) - BigInt(withdrawn)
  ).toString();
  return { deposited, withdrawn, basis };
}

/**
 * Open transfers for a wallet — feeds the StatusContext single source of
 * truth. Returns deposits in any non-terminal state and withdrawals in any
 * non-terminal state. Both ArrivalListener and StatusBanner read from this.
 */
export async function getOpenTransfersPg(
  walletAddress: string,
): Promise<{ deposits: Deposit[]; withdrawals: Withdrawal[] }> {
  if (!pool) return { deposits: [], withdrawals: [] };

  const [d, w] = await Promise.all([
    pool.query<Deposit>(
      `SELECT * FROM deposits
         WHERE LOWER(wallet_address) = LOWER($1)
           AND status IN ('intent', 'pending', 'depositing', 'retry')
         ORDER BY created_at DESC`,
      [walletAddress],
    ),
    pool.query<Withdrawal>(
      `SELECT * FROM withdrawals
         WHERE LOWER(wallet_address) = LOWER($1)
           AND status IN ('pending', 'redeeming', 'transferring', 'settling')
         ORDER BY created_at DESC`,
      [walletAddress],
    ),
  ]);
  return { deposits: d.rows, withdrawals: w.rows };
}

/** Snapshot lookup for getTransaction.ts — withdrawal side. */
export async function getWithdrawalByTxHashPg(
  txHash: string,
): Promise<Withdrawal | null> {
  if (!pool) return null;
  // tx_hash on withdrawals points to the on-chain USDC transfer to the
  // off-ramp deposit address. transfer_op_hash is the UserOp hash, not the
  // tx hash itself — they're different. We match on tx_hash here for the
  // receipt page lookup.
  const result = await pool.query<Withdrawal>(
    `SELECT * FROM withdrawals WHERE tx_hash = $1`,
    [txHash],
  );
  return result.rows[0] || null;
}

// ============================================
// Contact Operations
// ============================================

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  nickname: string | null;
  created_at: Date;
  // Joined fields from users table
  contact_username?: string;
  contact_display_name?: string;
  contact_avatar_url?: string;
  contact_wallet_address?: string;
}

export async function addContactPg(
  userId: string,
  contactUserId: string,
  nickname?: string
): Promise<Contact | null> {
  if (!pool) return null;

  const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const result = await pool.query<Contact>(
      `INSERT INTO contacts (id, user_id, contact_user_id, nickname)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, contact_user_id) DO UPDATE SET nickname = COALESCE($4, contacts.nickname)
       RETURNING *`,
      [id, userId, contactUserId, nickname || null]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('[DB] Failed to add contact:', error);
    return null;
  }
}

export async function removeContactPg(userId: string, contactUserId: string): Promise<boolean> {
  if (!pool) return false;

  try {
    const result = await pool.query(
      'DELETE FROM contacts WHERE user_id = $1 AND contact_user_id = $2',
      [userId, contactUserId]
    );

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('[DB] Failed to remove contact:', error);
    return false;
  }
}

export async function getContactsPg(userId: string): Promise<Contact[]> {
  if (!pool) return [];

  try {
    const result = await pool.query<Contact>(
      `SELECT c.*, 
              u.username as contact_username,
              u.display_name as contact_display_name,
              u.avatar_url as contact_avatar_url,
              u.wallet_address as contact_wallet_address
       FROM contacts c
       JOIN users u ON c.contact_user_id = u.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('[DB] Failed to get contacts:', error);
    return [];
  }
}

export async function isContactPg(userId: string, contactUserId: string): Promise<boolean> {
  if (!pool) return false;

  try {
    const result = await pool.query(
      'SELECT 1 FROM contacts WHERE user_id = $1 AND contact_user_id = $2',
      [userId, contactUserId]
    );

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('[DB] Failed to check contact:', error);
    return false;
  }
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

