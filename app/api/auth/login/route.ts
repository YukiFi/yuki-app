/**
 * POST /api/auth/login
 * 
 * Authenticate user with email/password.
 * Returns session cookie and wallet status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getWalletByUserId, checkRateLimit, updateUserFailedAttempts, resetUserFailedAttempts, resetRateLimit } from '@/lib/db';
import { verifyPassword, validateEmail, sanitizeInput } from '@/lib/auth';
import { createUserSession } from '@/lib/session';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOGIN ATTEMPT START ===');
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Login attempt for email:', email);
    
    // Validate input
    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Sanitize and validate email
    const sanitizedEmail = sanitizeInput(email);
    if (!validateEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await checkRateLimit(`login:${ip}`, 10);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Find user
    const user = await getUserByEmail(sanitizedEmail);
    if (!user) {
      console.log('Login failed: User not found for email:', sanitizedEmail);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    console.log('User found:', user.id);
    
    // Check if account is locked
    if (user.locked_until) {
      const lockExpiry = new Date(user.locked_until);
      if (lockExpiry > new Date()) {
        const remainingMinutes = Math.ceil((lockExpiry.getTime() - Date.now()) / 60000);
        return NextResponse.json(
          { error: `Account locked. Try again in ${remainingMinutes} minutes.` },
          { status: 423 }
        );
      } else {
        // Lock expired, reset
        await resetUserFailedAttempts(user.id);
      }
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    
    console.log('Password verification result:', isValid);
    
    if (!isValid) {
      // Increment failed attempts
      const newFailedAttempts = user.failed_attempts + 1;
      let lockedUntil: Date | null = null;
      
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }
      
      await updateUserFailedAttempts(user.id, newFailedAttempts, lockedUntil);
      
      console.log('Login failed: Invalid password. Failed attempts:', newFailedAttempts);
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Reset failed attempts on successful login
    await resetUserFailedAttempts(user.id);
    await resetRateLimit(`login:${ip}`);
    
    // Check if user has a wallet
    const wallet = await getWalletByUserId(user.id);
    
    // Create session
    await createUserSession(user.id, sanitizedEmail, wallet?.address);
    
    console.log('=== LOGIN SUCCESS - Session created for:', sanitizedEmail, '===');
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        hasWallet: !!wallet,
        walletAddress: wallet?.address,
        securityLevel: wallet?.security_level,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
