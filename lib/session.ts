/**
 * Session management using iron-session
 * 
 * Sessions are stored in httpOnly, secure cookies.
 * The session only contains user ID and basic metadata - 
 * NEVER any wallet keys or sensitive crypto material.
 */

import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

// Session data structure
export interface SessionData {
  userId?: string;
  email?: string;
  isLoggedIn: boolean;
  walletAddress?: string;
  createdAt?: number;
  // Passkey challenge storage
  passkeyChallenge?: string;
  passkeyUserId?: string;
}

// Default session values
const defaultSession: SessionData = {
  isLoggedIn: false,
};

// Session options
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_replace_in_production',
  cookieName: 'yuki_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

/**
 * Get the current session from cookies (Server Components / Route Handlers)
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  
  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
  }
  
  return session;
}

/**
 * Create a new session for authenticated user
 */
export async function createUserSession(
  userId: string,
  email: string,
  walletAddress?: string
): Promise<void> {
  const session = await getSession();
  
  session.userId = userId;
  session.email = email;
  session.isLoggedIn = true;
  session.walletAddress = walletAddress;
  session.createdAt = Date.now();
  
  await session.save();
}

/**
 * Destroy the current session (logout)
 */
export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

/**
 * Get current user ID from session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session.userId || null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn && !!session.userId;
}
