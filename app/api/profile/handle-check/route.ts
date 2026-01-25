/**
 * POST /api/profile/handle-check
 * 
 * Check if a handle/username is available.
 * Rate limited to prevent abuse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/db';
import { isReservedRoute } from '@/lib/constants/reserved-routes';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: { handle?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }
    
    const { handle } = body;
    
    if (!handle || typeof handle !== 'string') {
      return NextResponse.json(
        { error: 'Handle is required', code: 'MISSING_HANDLE' },
        { status: 400 }
      );
    }
    
    // Validate format
    const cleanHandle = handle.replace(/^@/, '');
    
    if (cleanHandle.length < 3) {
      return NextResponse.json({
        available: false,
        reason: 'TOO_SHORT',
        message: 'Username must be at least 3 characters',
      });
    }
    
    if (cleanHandle.length > 20) {
      return NextResponse.json({
        available: false,
        reason: 'TOO_LONG',
        message: 'Username must be at most 20 characters',
      });
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(cleanHandle)) {
      return NextResponse.json({
        available: false,
        reason: 'INVALID_CHARS',
        message: 'Username can only contain letters, numbers, and underscores',
      });
    }
    
    // Check if reserved
    if (isReservedRoute(cleanHandle)) {
      return NextResponse.json({
        available: false,
        reason: 'RESERVED',
        message: 'This username is reserved',
      });
    }
    
    // Check if taken
    const normalizedHandle = `@${cleanHandle}`;
    const existingUser = await getUserByUsername(normalizedHandle);
    
    if (existingUser) {
      return NextResponse.json({
        available: false,
        reason: 'TAKEN',
        message: 'Username is already taken',
      });
    }
    
    return NextResponse.json({
      available: true,
    });
  } catch (error) {
    console.error('[API] Handle check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

