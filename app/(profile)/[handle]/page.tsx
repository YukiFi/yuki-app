/**
 * Public Profile Page
 * 
 * Displays a user's public profile at /<handle>
 * Server component that fetches profile data and checks ownership.
 * Handles redirects for old handles.
 */

import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { getProfileByHandle, getHandleRedirect } from '@/lib/db';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTransactionFeed } from '@/components/profile/ProfileTransactionFeed';

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
  const { userId: clerkUserId } = await auth();
  const isOwner = !!(clerkUserId && profile.clerk_user_id === clerkUserId);
  
  // Build public profile object
  const publicProfile = {
    handle: profile.username,
    displayName: profile.display_name,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    bannerUrl: profile.banner_url,
    isPrivate: profile.is_private ?? false,
    createdAt: profile.created_at.toISOString(),
  };
  
  return (
    <div className="min-h-screen bg-black">
      <ProfileHeader profile={publicProfile} isOwner={isOwner} />
      
      {/* Transaction feed */}
      <div className="max-w-[600px] mx-auto px-4">
        <ProfileTransactionFeed 
          isPrivate={publicProfile.isPrivate} 
          isOwner={isOwner} 
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  
  if (!profile || !profile.username) {
    return {
      title: 'User not found | Yuki',
    };
  }
  
  const displayName = profile.display_name || profile.username.replace('@', '');
  
  return {
    title: `${displayName} (${profile.username}) | Yuki`,
    description: profile.bio || `View ${displayName}'s profile on Yuki`,
  };
}
