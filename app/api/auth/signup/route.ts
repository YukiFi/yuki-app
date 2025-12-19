/**
 * POST /api/auth/signup
 * 
 * Register a new user with email/password.
 * Does NOT create a wallet - that happens client-side on first deposit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, checkRateLimit } from '@/lib/db';
import { hashPassword, validateEmail, generateId } from '@/lib/auth';
import { createUserSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await checkRateLimit(`signup:${ip}`, 10);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Check if user exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const userId = generateId();
    const user = await createUser(userId, email, passwordHash);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }
    
    // Create session
    await createUserSession(userId, email);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        hasWallet: false,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
