/**
 * Public Profile Page
 * 
 * Displays a user's public profile at /<handle>
 * Server component that fetches profile data and checks ownership.
 * Handles redirects for old handles.
 */

import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getProfileByHandle, getHandleRedirect, getUserByWalletAddress } from '@/lib/db';
import { ProfileHeader } from '@/components/profile/ProfileHeader';

// Disable caching for this page to ensure fresh profile data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProfilePageProps {
  params: Promise<{ handle: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;

  // Fetch profile data
  const profile = await getProfileByHandle(handle);

  // If not found, check if this is an old handle that should redirect
  if (!profile || !profile.username) {
    const newHandle = await getHandleRedirect(handle.startsWith('@') ? handle : `@${handle}`);

    if (newHandle) {
      // 301 redirect to the new handle
      redirect(`/${newHandle.replace('@', '')}`);
    }

    notFound();
  }

  // Check if current user is the owner
  // With Alchemy Smart Wallets, we can't get the wallet address server-side
  // The client-side ProfileHeader component will handle ownership check
  const isOwner = false; // Client will determine this

  // Build public profile object
  const publicProfile = {
    handle: profile.username,
    displayName: profile.display_name,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    bannerUrl: profile.banner_url,
    isPrivate: profile.is_private ?? false,
    createdAt: profile.created_at.toISOString(),
    // Pass wallet address so client can check ownership
    walletAddress: profile.wallet_address,
    // Pass user ID for contact management
    id: profile.id,
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f]">
      <ProfileHeader profile={publicProfile} isOwner={isOwner} />
    </div>
  );
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);

  if (!profile || !profile.username) {
    return {
      title: 'User Not Found | Yuki',
    };
  }

  const displayName = profile.display_name || profile.username;

  return {
    title: `${displayName} (${profile.username}) | Yuki`,
    description: profile.bio || `${displayName}'s profile on Yuki`,
  };
}
