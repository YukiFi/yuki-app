/**
 * Database layer for Yuki Embedded Wallet
 * 
 * Uses PostgreSQL when DATABASE_URL is set, otherwise falls back to
 * in-memory storage for development/demo purposes.
 * 
 * Error Handling Policy:
 * - Connection errors (DB unavailable): fallback to in-memory in dev, fail fast in prod
 * - Schema/constraint errors: ALWAYS fail fast with actionable error messages
 * - This prevents silent data loss and noisy retry loops
 */

// Check if PostgreSQL is available
const USE_POSTGRES = !!process.env.DATABASE_URL;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ============================================
// Error Classification
// ============================================

/**
 * PostgreSQL error codes for classification
 * See: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const PG_ERROR_CODES = {
  // Connection errors (Class 08)
  CONNECTION_EXCEPTION: '08000',
  CONNECTION_DOES_NOT_EXIST: '08003',
  CONNECTION_FAILURE: '08006',
  
  // Integrity constraint violations (Class 23)
  NOT_NULL_VIOLATION: '23502',
  FOREIGN_KEY_VIOLATION: '23503',
  UNIQUE_VIOLATION: '23505',
  CHECK_VIOLATION: '23514',
  
  // Syntax/schema errors (Class 42)
  UNDEFINED_TABLE: '42P01',
  UNDEFINED_COLUMN: '42703',
  SYNTAX_ERROR: '42601',
} as const;

interface PgError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
}

/**
 * Check if error is a connection-level error (DB unavailable)
 * These are the ONLY errors that should trigger fallback in development
 */
function isConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    const pgError = error as PgError;
    
    // Check PostgreSQL error code
    if (pgError.code) {
      // Class 08 = Connection Exception
      if (pgError.code.startsWith('08')) return true;
      // Class 57 = Operator Intervention (includes server shutdown)
      if (pgError.code.startsWith('57')) return true;
    }
    
    // Check error message for connection issues
    const msg = error.message.toLowerCase();
    return (
      msg.includes('econnrefused') ||
      msg.includes('connection refused') ||
      msg.includes('connection timeout') ||
      msg.includes('connection terminated') ||
      msg.includes('database system is starting up') ||
      msg.includes('too many connections') ||
      msg.includes('could not connect')
    );
  }
  return false;
}

/**
 * Check if error is a schema/constraint error
 * These should NEVER trigger fallback - they indicate bugs or migration issues
 */
function isSchemaOrConstraintError(error: unknown): boolean {
  if (error instanceof Error) {
    const pgError = error as PgError;
    
    if (pgError.code) {
      // Class 23 = Integrity Constraint Violation
      if (pgError.code.startsWith('23')) return true;
      // Class 42 = Syntax Error or Access Rule Violation
      if (pgError.code.startsWith('42')) return true;
    }
  }
  return false;
}

/**
 * Create actionable error message from PostgreSQL error
 */
function formatPgError(error: unknown, context: string): string {
  if (error instanceof Error) {
    const pgError = error as PgError;
    const parts = [`[DB] ${context} failed`];
    
    if (pgError.code) parts.push(`code=${pgError.code}`);
    if (pgError.table) parts.push(`table=${pgError.table}`);
    if (pgError.column) parts.push(`column=${pgError.column}`);
    if (pgError.constraint) parts.push(`constraint=${pgError.constraint}`);
    if (pgError.detail) parts.push(`detail=${pgError.detail}`);
    
    parts.push(`message=${pgError.message}`);
    return parts.join(' ');
  }
  return `[DB] ${context} failed: ${String(error)}`;
}

/**
 * Handle PostgreSQL errors with proper classification
 * Returns true if fallback to in-memory is allowed
 */
function handlePgError(error: unknown, context: string): boolean {
  const errorMessage = formatPgError(error, context);
  
  if (isSchemaOrConstraintError(error)) {
    // Schema/constraint errors should NEVER fallback - they indicate real bugs
    console.error(`${errorMessage} [FATAL: Schema/constraint error - check migrations]`);
    throw error; // Re-throw to fail fast
  }
  
  if (isConnectionError(error)) {
    if (IS_PRODUCTION) {
      // In production, fail fast even for connection errors
      console.error(`${errorMessage} [FATAL: Database unavailable in production]`);
      throw error;
    }
    // In development, allow fallback for connection errors only
    console.warn(`${errorMessage} [WARN: Falling back to in-memory storage]`);
    return true;
  }
  
  // Unknown error type - log and fail fast to be safe
  console.error(`${errorMessage} [FATAL: Unknown error type]`);
  throw error;
}

// Lazy load PostgreSQL module only when needed
let pgDb: typeof import('./db-postgres') | null = null;
let pgInitialized = false;
let pgInitError: Error | null = null;

async function getPgDb() {
  if (!USE_POSTGRES) return null;
  
  // If we already failed to initialize, don't retry
  if (pgInitError) {
    throw pgInitError;
  }
  
  if (!pgDb || !pgInitialized) {
    try {
      pgDb = await import('./db-postgres');
      await pgDb.initializeDatabase();
      pgInitialized = true;
      console.log('[DB] PostgreSQL initialized successfully');
    } catch (error) {
      pgInitError = error instanceof Error ? error : new Error(String(error));
      
      if (!isConnectionError(error)) {
        // Schema errors during init are fatal
        console.error(formatPgError(error, 'initializeDatabase'));
        throw error;
      }
      
      if (IS_PRODUCTION) {
        throw error;
      }
      
      console.warn('[DB] PostgreSQL initialization failed, using in-memory fallback');
      return null;
    }
  }
  return pgDb;
}

if (USE_POSTGRES) {
  console.log('[DB] PostgreSQL mode enabled (DATABASE_URL set)');
} else {
  console.log('[DB] Using in-memory database (set DATABASE_URL for PostgreSQL)');
}

// In-memory storage (fallback for development only)
const db = {
  users: new Map<string, User>(),
  wallets: new Map<string, WalletRecord>(),
  sessions: new Map<string, unknown>(),
  rateLimits: new Map<string, { count: number; resetAt: Date }>(),
  indices: {
    usersByEmail: new Map<string, string>(),
    usersByClerkId: new Map<string, string>(),
    usersByWalletAddress: new Map<string, string>(),
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
    wallet_address: null,
    clerk_user_id: null,
    auth_provider: 'local',
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
    display_name: null,
    bio: null,
    avatar_url: null,
    banner_url: null,
    is_private: false,
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
  
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  return db.users.get(id) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase();
  const userId = db.indices.usersByEmail.get(normalizedEmail);
  if (!userId) return null;
  return db.users.get(userId) || null;
}

// Get or create a user by email (for demo purposes)
export async function getOrCreateUserByEmail(email: string): Promise<User> {
  const normalizedEmail = email.toLowerCase();
  let user = await getUserByEmail(normalizedEmail);
  
  if (!user) {
    const id = `user_${normalizedEmail.replace(/[^a-z0-9]/g, '_')}`;
    user = {
      id,
      wallet_address: null,
      clerk_user_id: null,
      auth_provider: 'local',
      email: normalizedEmail,
      phone_number: null,
      password_hash: null,
      created_at: new Date(),
      updated_at: new Date(),
      email_verified: true,
      locked_until: null,
      failed_attempts: 0,
      username: null,
      username_last_changed: null,
      display_name: null,
      bio: null,
      avatar_url: null,
      banner_url: null,
      is_private: false,
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
 * 
 * Error handling:
 * - Schema/constraint errors: fail fast (indicates bugs or migration issues)
 * - Connection errors in dev: fallback to in-memory
 * - Connection errors in prod: fail fast
 */
export async function getOrCreateUserByClerkId(clerkUserId: string): Promise<User> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    try {
      const pg = await getPgDb();
      if (pg) {
        // This will throw if it fails (never returns null)
        return await pg.getOrCreateUserByClerkIdPg(clerkUserId);
      }
    } catch (error) {
      // handlePgError will throw for schema/constraint errors
      // and return true only for connection errors in development
      const shouldFallback = handlePgError(error, 'getOrCreateUserByClerkId');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (only in development with connection issues)
  const existingUserId = db.indices.usersByClerkId.get(clerkUserId);
  if (existingUserId) {
    const user = db.users.get(existingUserId);
    if (user) return user;
  }
  
  // Create a new user linked to this Clerk ID
  const id = `user_${clerkUserId}`;
  const user: User = {
    id,
    wallet_address: null,
    clerk_user_id: clerkUserId,
    auth_provider: 'clerk',
    email: null,
    phone_number: null,
    password_hash: null,
    created_at: new Date(),
    updated_at: new Date(),
    email_verified: true,
    locked_until: null,
    failed_attempts: 0,
    username: null,
    username_last_changed: null,
    display_name: null,
    bio: null,
    avatar_url: null,
    banner_url: null,
    is_private: false,
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
  
  console.log('[DB] Created in-memory user for Clerk ID:', clerkUserId);
  
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

/**
 * Get or create a user by wallet address
 * This is the primary method for Alchemy Smart Wallets authentication
 * The wallet address becomes the user's identity
 */
export async function getOrCreateUserByWalletAddress(walletAddress: string): Promise<User> {
  const normalizedAddress = walletAddress.toLowerCase();
  
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    try {
      const pg = await getPgDb();
      if (pg) {
        return await pg.getOrCreateUserByWalletAddressPg(normalizedAddress);
      }
    } catch (error) {
      const shouldFallback = handlePgError(error, 'getOrCreateUserByWalletAddress');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (only in development with connection issues)
  const existingUserId = db.indices.usersByWalletAddress.get(normalizedAddress);
  if (existingUserId) {
    const user = db.users.get(existingUserId);
    if (user) return user;
  }
  
  // Create a new user linked to this wallet address
  const id = `user_${normalizedAddress.slice(0, 10)}_${Date.now()}`;
  const user: User = {
    id,
    wallet_address: normalizedAddress,
    clerk_user_id: null,
    auth_provider: 'alchemy',
    email: null,
    phone_number: null,
    password_hash: null,
    created_at: new Date(),
    updated_at: new Date(),
    email_verified: true,
    locked_until: null,
    failed_attempts: 0,
    username: null,
    username_last_changed: null,
    display_name: null,
    bio: null,
    avatar_url: null,
    banner_url: null,
    is_private: false,
    passkey_credential_id: null,
    passkey_public_key: null,
    passkey_counter: 0,
    passkey_device_type: null,
    passkey_backed_up: false,
    passkey_transports: null,
    passkey_created_at: null,
  };
  
  db.users.set(id, user);
  db.indices.usersByWalletAddress.set(normalizedAddress, id);
  
  console.log('[DB] Created in-memory user for wallet:', normalizedAddress);
  
  return user;
}

/**
 * Get user by wallet address
 */
export async function getUserByWalletAddress(walletAddress: string): Promise<User | null> {
  const normalizedAddress = walletAddress.toLowerCase();
  
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    try {
      const pg = await getPgDb();
      if (pg) {
        return await pg.getUserByWalletAddressPg(normalizedAddress);
      }
    } catch (error) {
      const shouldFallback = handlePgError(error, 'getUserByWalletAddress');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage
  const userId = db.indices.usersByWalletAddress.get(normalizedAddress);
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

export async function updateUsername(userId: string, username: string, recordHistory = true): Promise<void> {
  // Get current username before updating (for history)
  let oldUsername: string | null = null;
  
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    try {
      const pg = await getPgDb();
      if (pg) {
        // Get current user to capture old username
        const currentUser = await pg.getUserByIdPg(userId);
        oldUsername = currentUser?.username || null;
        
        // Check if taken (case-insensitive)
        const existing = await pg.getUserByUsernamePg(username);
        if (existing && existing.id !== userId) {
          throw new Error("Username is already taken");
        }
        await pg.updateUsernamePg(userId, username);
        
        // Record in handle history for redirects
        if (recordHistory && oldUsername && oldUsername.toLowerCase() !== username.toLowerCase()) {
          await pg.addHandleHistoryPg(userId, oldUsername, username);
        }
        return;
      }
    } catch (error) {
      // Re-throw business logic errors
      if (error instanceof Error && error.message === "Username is already taken") {
        throw error;
      }
      // Use proper error handling for DB errors
      const shouldFallback = handlePgError(error, 'updateUsername');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (development only)
  const existingUser = Array.from(db.users.values()).find(
    u => u.username?.toLowerCase() === username.toLowerCase() && u.id !== userId
  );
  
  if (existingUser) {
    throw new Error("Username is already taken");
  }
  
  const user = db.users.get(userId);
  if (user) {
    oldUsername = user.username;
    user.username = username;
    user.username_last_changed = new Date();
    user.updated_at = new Date();
    db.users.set(userId, user);
    
    // Record in handle history for redirects (in-memory)
    if (recordHistory && oldUsername && oldUsername.toLowerCase() !== username.toLowerCase()) {
      // Use the in-memory handle history map from addHandleHistory
      await addHandleHistoryInMemory(userId, oldUsername, username);
    }
  }
}

// Helper for in-memory handle history (used internally)
const handleHistoryMemory = new Map<string, string>(); // old_handle (lowercase) -> new_handle

async function addHandleHistoryInMemory(userId: string, oldHandle: string, newHandle: string): Promise<void> {
  handleHistoryMemory.set(oldHandle.toLowerCase(), newHandle);
}

export async function getUserByUsername(username: string): Promise<User | null> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    try {
      const pg = await getPgDb();
      if (pg) {
        return await pg.getUserByUsernamePg(username);
      }
    } catch (error) {
      const shouldFallback = handlePgError(error, 'getUserByUsername');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (development only)
  const user = Array.from(db.users.values()).find(
    u => u.username?.toLowerCase() === username.toLowerCase()
  );
  return user || null;
}

// ============================================
// Profile Operations
// ============================================

export interface ProfileUpdateData {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  is_private?: boolean;
}

export interface PublicProfile {
  handle: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
}

/**
 * Get public profile by handle/username
 */
export async function getProfileByHandle(handle: string): Promise<(User & { clerkUserId: string | null }) | null> {
  // Normalize handle (remove @ if present)
  const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
  
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    try {
      const pg = await getPgDb();
      if (pg) {
        const user = await pg.getUserByUsernamePg(cleanHandle);
        return user ? { ...user, clerkUserId: user.clerk_user_id } : null;
      }
    } catch (error) {
      const shouldFallback = handlePgError(error, 'getProfileByHandle');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (development only)
  const user = Array.from(db.users.values()).find(
    u => u.username?.toLowerCase() === cleanHandle.toLowerCase()
  );
  return user ? { ...user, clerkUserId: user.clerk_user_id } : null;
}

/**
 * Update user profile fields (display_name, bio, avatar_url, banner_url)
 */
export async function updateUserProfile(userId: string, data: ProfileUpdateData): Promise<void> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    try {
      const pg = await getPgDb();
      if (pg) {
        await pg.updateUserProfilePg(userId, data);
        return;
      }
    } catch (error) {
      const shouldFallback = handlePgError(error, 'updateUserProfile');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (development only)
  const user = db.users.get(userId);
  if (user) {
    if (data.display_name !== undefined) user.display_name = data.display_name;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.avatar_url !== undefined) user.avatar_url = data.avatar_url;
    if (data.banner_url !== undefined) user.banner_url = data.banner_url;
    if (data.is_private !== undefined) user.is_private = data.is_private;
    user.updated_at = new Date();
    db.users.set(userId, user);
  }
}

// ============================================
// Handle History Operations
// ============================================

// In-memory handle history for development
const handleHistory = new Map<string, string>(); // old_handle (lowercase) -> new_handle

/**
 * Record a handle change for redirect purposes
 */
export async function addHandleHistory(userId: string, oldHandle: string, newHandle: string): Promise<void> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    try {
      const pg = await getPgDb();
      if (pg) {
        await pg.addHandleHistoryPg(userId, oldHandle, newHandle);
        return;
      }
    } catch (error) {
      const shouldFallback = handlePgError(error, 'addHandleHistory');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (development only)
  handleHistory.set(oldHandle.toLowerCase(), newHandle);
}

/**
 * Look up an old handle to find where it redirects to
 */
export async function getHandleRedirect(oldHandle: string): Promise<string | null> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    try {
      const pg = await getPgDb();
      if (pg) {
        return await pg.getHandleRedirectPg(oldHandle);
      }
    } catch (error) {
      const shouldFallback = handlePgError(error, 'getHandleRedirect');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (development only)
  return handleHistory.get(oldHandle.toLowerCase()) || null;
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
    try {
      const pg = await getPgDb();
      if (pg) {
        await pg.updateUserPasskeyPg(userId, passkeyData);
        return;
      }
    } catch (error) {
      const shouldFallback = handlePgError(error, 'updateUserPasskey');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (development only)
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
    try {
      const pg = await getPgDb();
      if (pg) {
        await pg.updatePasskeyCounterPg(userId, newCounter);
        return;
      }
    } catch (error) {
      const shouldFallback = handlePgError(error, 'updatePasskeyCounter');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (development only)
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
    try {
      const pg = await getPgDb();
      if (pg) {
        return await pg.createWalletPg(id, userId, data);
      }
    } catch (error) {
      const shouldFallback = handlePgError(error, 'createWallet');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (development only)
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
    security_level: data.securityLevel as 'password_only' | 'passkey_enabled',
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
    try {
      const pg = await getPgDb();
      if (pg) {
        return await pg.getWalletByUserIdPg(userId);
      }
    } catch (error) {
      const shouldFallback = handlePgError(error, 'getWalletByUserId');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (development only)
  const walletId = db.indices.walletsByUserId.get(userId);
  if (!walletId) return null;
  return db.wallets.get(walletId) || null;
}

export async function getWalletByAddress(address: string): Promise<WalletRecord | null> {
  // Use PostgreSQL if available
  if (USE_POSTGRES) {
    try {
      const pg = await getPgDb();
      if (pg) {
        return await pg.getWalletByAddressPg(address);
      }
    } catch (error) {
      const shouldFallback = handlePgError(error, 'getWalletByAddress');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (development only)
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
    try {
      const pg = await getPgDb();
      if (pg) {
        await pg.updateWalletPasskeyPg(userId, data);
        return;
      }
    } catch (error) {
      const shouldFallback = handlePgError(error, 'updateWalletPasskey');
      if (!shouldFallback) {
        throw error;
      }
    }
  }
  
  // Fallback to in-memory storage (development only)
  const walletId = db.indices.walletsByUserId.get(userId);
  if (!walletId) return;

  const wallet = db.wallets.get(walletId);
  if (wallet) {
    wallet.cipher_priv = data.cipherPriv;
    wallet.iv_priv = data.ivPriv;
    wallet.security_level = data.securityLevel as 'password_only' | 'passkey_enabled';
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
  
  // Increment counter
  currentRecord.count++;
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
