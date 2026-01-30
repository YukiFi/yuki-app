/**
 * Profile Me API
 * 
 * GET /api/profile/me - Get current user's full profile (requires x-wallet-address header)
 * PATCH /api/profile/me - Update current user's profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUserByWalletAddress, updateUserProfile, updateUsername, getUserByUsername } from '@/lib/db';
import { profileUpdateSchema, type FullProfile } from '@/lib/validation/profile';
import { isReservedRoute } from '@/lib/constants/reserved-routes';

const COOLDOWN_DAYS = 30;

/**
 * Check if user can change username
 */
function checkUsernameCooldown(lastChanged: Date | null): { canChange: boolean; daysRemaining: number } {
  if (!lastChanged) {
    return { canChange: true, daysRemaining: 0 };
  }

  const now = new Date();
  const daysSinceChange = (now.getTime() - new Date(lastChanged).getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceChange < COOLDOWN_DAYS) {
    return { canChange: false, daysRemaining: Math.ceil(COOLDOWN_DAYS - daysSinceChange) };
  }

  return { canChange: true, daysRemaining: 0 };
}

/**
 * Get wallet address from request headers or body
 */
function getWalletAddressFromRequest(request: NextRequest): string | null {
  const walletAddress = request.headers.get('x-wallet-address');
  if (walletAddress && walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
    return walletAddress.toLowerCase();
  }
  return null;
}

/**
 * GET /api/profile/me
 * 
 * Get current user's full profile including private fields.
 */
export async function GET(request: NextRequest) {
  try {
    const walletAddress = getWalletAddressFromRequest(request);

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Not authenticated', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const user = await getOrCreateUserByWalletAddress(walletAddress);
    const cooldown = checkUsernameCooldown(user.username_last_changed);

    const fullProfile: FullProfile = {
      id: user.id,
      walletAddress: walletAddress,
      handle: user.username || '',
      displayName: user.display_name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      bannerUrl: user.banner_url,
      isPrivate: user.is_private ?? false,
      createdAt: user.created_at.toISOString(),
      usernameLastChanged: user.username_last_changed?.toISOString() || null,
      canChangeUsername: user.username ? cooldown.canChange : true,
      daysUntilUsernameChange: cooldown.daysRemaining,
    };

    return NextResponse.json(fullProfile);
  } catch (error) {
    console.error('[API] Get profile me error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile/me
 * 
 * Update current user's profile.
 */
export async function PATCH(request: NextRequest) {
  try {
    const walletAddress = getWalletAddressFromRequest(request);

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Not authenticated', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    console.log('[API] PATCH /api/profile/me - Request body:', JSON.stringify(body, null, 2));

    // Validate input
    const result = profileUpdateSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten();
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: errors },
        { status: 400 }
      );
    }

    console.log('[API] Validated data:', JSON.stringify(result.data, null, 2));

    const { displayName, bio, avatarUrl, bannerUrl, username } = result.data;

    // Get current user
    const user = await getOrCreateUserByWalletAddress(walletAddress);

    // Handle username change separately (has cooldown)
    if (username !== undefined) {
      const normalizedUsername = `@${username.replace(/^@/, '')}`;

      // Check if trying to set same username
      if (user.username?.toLowerCase() !== normalizedUsername.toLowerCase()) {
        // Check cooldown
        if (user.username) {
          const cooldown = checkUsernameCooldown(user.username_last_changed);
          if (!cooldown.canChange) {
            return NextResponse.json(
              {
                error: `Username can only be changed once every ${COOLDOWN_DAYS} days. Try again in ${cooldown.daysRemaining} days.`,
                code: 'RATE_LIMITED',
                daysRemaining: cooldown.daysRemaining
              },
              { status: 429 }
            );
          }
        }

        // Check if reserved
        if (isReservedRoute(username)) {
          return NextResponse.json(
            { error: 'This username is reserved', code: 'RESERVED_USERNAME' },
            { status: 400 }
          );
        }

        // Check if taken
        const existingUser = await getUserByUsername(normalizedUsername);
        if (existingUser && existingUser.id !== user.id) {
          return NextResponse.json(
            { error: 'Username is already taken', code: 'USERNAME_TAKEN' },
            { status: 409 }
          );
        }

        // Update username
        try {
          await updateUsername(user.id, normalizedUsername);
        } catch (error) {
          if (error instanceof Error && error.message === 'Username is already taken') {
            return NextResponse.json(
              { error: 'Username is already taken', code: 'USERNAME_TAKEN' },
              { status: 409 }
            );
          }
          throw error;
        }
      }
    }

    // Update profile fields
    const profileUpdates: Record<string, string | boolean | null | undefined> = {};
    if (displayName !== undefined) profileUpdates.display_name = displayName;
    if (bio !== undefined) profileUpdates.bio = bio;
    if (avatarUrl !== undefined) profileUpdates.avatar_url = avatarUrl;
    if (bannerUrl !== undefined) profileUpdates.banner_url = bannerUrl;
    if (result.data.isPrivate !== undefined) profileUpdates.is_private = result.data.isPrivate;

    console.log('[API] Profile updates to be saved:', JSON.stringify(profileUpdates, null, 2));

    if (Object.keys(profileUpdates).length > 0) {
      await updateUserProfile(user.id, profileUpdates);
      console.log('[API] Profile updated in database for user:', user.id);
    }

    // Fetch updated user
    const updatedUser = await getOrCreateUserByWalletAddress(walletAddress);
    const cooldown = checkUsernameCooldown(updatedUser.username_last_changed);

    const fullProfile: FullProfile = {
      id: updatedUser.id,
      walletAddress: walletAddress,
      handle: updatedUser.username || '',
      displayName: updatedUser.display_name,
      bio: updatedUser.bio,
      avatarUrl: updatedUser.avatar_url,
      isPrivate: updatedUser.is_private ?? false,
      bannerUrl: updatedUser.banner_url,
      createdAt: updatedUser.created_at.toISOString(),
      usernameLastChanged: updatedUser.username_last_changed?.toISOString() || null,
      canChangeUsername: updatedUser.username ? cooldown.canChange : true,
      daysUntilUsernameChange: cooldown.daysRemaining,
    };

    console.log('[API] Returning updated profile:', JSON.stringify({
      avatarUrl: fullProfile.avatarUrl,
      bannerUrl: fullProfile.bannerUrl,
      displayName: fullProfile.displayName,
    }, null, 2));

    return NextResponse.json({ success: true, profile: fullProfile });
  } catch (error) {
    console.error('[API] Update profile error:', error);

    const isDev = process.env.NODE_ENV !== 'production';
    const errorMessage = isDev && error instanceof Error
      ? `Internal server error: ${error.message}`
      : 'Internal server error';

    return NextResponse.json(
      { error: errorMessage, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
