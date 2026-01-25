/**
 * GET /api/auth/onboarding-status
 * 
 * Check if the current user has completed onboarding (has a username).
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserByClerkId } from '@/lib/db';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get or create internal user
    const user = await getOrCreateUserByClerkId(clerkUserId);
    
    // Check if user has completed onboarding
    const hasUsername = !!user.username && user.username.length > 0;
    
    return NextResponse.json({
      completed: hasUsername,
      username: user.username,
      // Add more onboarding steps here as needed
      steps: {
        username: hasUsername,
      },
    });
  } catch (error) {
    console.error('Onboarding status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

