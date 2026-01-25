/**
 * GET /api/profile/[handle]
 * 
 * Get public profile by handle. This is a public endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProfileByHandle } from '@/lib/db';
import type { PublicProfile } from '@/lib/validation/profile';

interface RouteParams {
  params: Promise<{ handle: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { handle } = await params;
    
    if (!handle) {
      return NextResponse.json(
        { error: 'Handle is required', code: 'MISSING_HANDLE' },
        { status: 400 }
      );
    }
    
    const profile = await getProfileByHandle(handle);
    
    if (!profile || !profile.username) {
      return NextResponse.json(
        { error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Return public profile data only
    const publicProfile: PublicProfile = {
      handle: profile.username,
      displayName: profile.display_name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      bannerUrl: profile.banner_url,
      isPrivate: profile.is_private ?? false,
      createdAt: profile.created_at.toISOString(),
    };
    
    return NextResponse.json(publicProfile);
  } catch (error) {
    console.error('[API] Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

