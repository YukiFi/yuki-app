/**
 * POST /api/auth/signup
 * 
 * Register a new user with email/password.
 * Does NOT create a wallet - that happens client-side on first deposit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, checkRateLimit } from '@/lib/db';
import { hashPassword, validateEmail, validatePassword, generateId, sanitizeInput } from '@/lib/auth';
import { createUserSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIGNUP ATTEMPT START ===');
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Signup attempt for email:', email);
    
    // Validate input presence
    if (!email || !password) {
      console.log('Signup failed: Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Sanitize and validate email
    const sanitizedEmail = sanitizeInput(email);
    console.log('Original email:', email, '| Sanitized email:', sanitizedEmail);
    
    if (!validateEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Validate password with security requirements
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors 
        },
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
    console.log('Checking if user exists with email:', sanitizedEmail);
    const existingUser = await getUserByEmail(sanitizedEmail);
    console.log('Existing user found:', existingUser ? 'YES - ' + existingUser.id : 'NO');
    
    if (existingUser) {
      console.log('Signup failed: Email already exists:', sanitizedEmail);
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    
    console.log('Email available, creating user...');
    
    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const userId = generateId();
    console.log('Attempting to create user with ID:', userId, 'Email:', sanitizedEmail);
    const user = await createUser(userId, sanitizedEmail, passwordHash);
    
    console.log('User creation result:', user ? 'SUCCESS' : 'FAILED (email exists?)');
    
    if (!user) {
      console.log('Signup failed: Database error creating user (likely duplicate email)');
      return NextResponse.json(
        { error: 'Failed to create account. Email may already be in use.' },
        { status: 500 }
      );
    }
    
    // Create session
    await createUserSession(userId, sanitizedEmail);
    
    console.log('=== SIGNUP SUCCESS - Session created for:', sanitizedEmail, '===');
    
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
