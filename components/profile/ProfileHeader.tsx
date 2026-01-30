'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { PublicProfile } from '@/lib/validation/profile';
import { EditProfileModal } from './EditProfileModal';
import { useAuth } from '@/lib/hooks/useAuth';

const BRAND_LAVENDER = "#e1a8f0";

interface ProfileHeaderProps {
  profile: PublicProfile;
  isOwner?: boolean; // Made optional - will be determined client-side
}

export function ProfileHeader({ profile, isOwner: serverIsOwner }: ProfileHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const { user, isAuthenticated, walletAddress } = useAuth();

  // Contact management state
  const [isContact, setIsContact] = useState(false);
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  const [contactId, setContactId] = useState<string | null>(null);

  // Determine ownership client-side by comparing wallet addresses
  const isOwner = useMemo(() => {
    // If server already confirmed ownership, use that
    if (serverIsOwner) return true;

    // Check if current user's wallet matches profile wallet
    if (!isAuthenticated || !user?.walletAddress || !profile.walletAddress) {
      return false;
    }

    return user.walletAddress.toLowerCase() === profile.walletAddress.toLowerCase();
  }, [serverIsOwner, isAuthenticated, user?.walletAddress, profile.walletAddress]);

  // Check if profile user is in contacts
  useEffect(() => {
    if (!isAuthenticated || !walletAddress || isOwner) return;

    setIsLoadingContact(true);
    fetch('/api/contacts', {
      headers: { 'x-wallet-address': walletAddress },
    })
      .then(res => res.ok ? res.json() : { contacts: [] })
      .then(data => {
        const contact = data.contacts?.find((c: any) =>
          c.walletAddress.toLowerCase() === profile.walletAddress?.toLowerCase()
        );
        setIsContact(!!contact);
        setContactId(contact?.id || null);
      })
      .catch(() => {
        setIsContact(false);
        setContactId(null);
      })
      .finally(() => setIsLoadingContact(false));
  }, [isAuthenticated, walletAddress, isOwner, profile.walletAddress]);

  const handleAddContact = async () => {
    if (!walletAddress) return;

    setIsLoadingContact(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ username: profile.handle }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsContact(true);
        setContactId(data.contact.id);
      }
    } catch (error) {
      console.error('Failed to add contact:', error);
    } finally {
      setIsLoadingContact(false);
    }
  };

  const handleRemoveContact = async () => {
    if (!walletAddress || !contactId) return;

    setIsLoadingContact(true);
    try {
      // Get the user ID from the profile (use walletAddress as identifier)
      const profileUserId = profile.walletAddress;

      if (!profileUserId) {
        console.error('No profile user ID available');
        return;
      }

      const res = await fetch(`/api/contacts?userId=${encodeURIComponent(profileUserId)}`, {
        method: 'DELETE',
        headers: {
          'x-wallet-address': walletAddress,
        },
      });

      if (res.ok) {
        setIsContact(false);
        setContactId(null);
      }
    } catch (error) {
      console.error('Failed to remove contact:', error);
    } finally {
      setIsLoadingContact(false);
    }
  };

  // Get display name or fallback to handle
  const displayName = profile.displayName || profile.handle.replace('@', '');
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <div className="relative">
        {/* Banner */}
        <div className="relative h-32 sm:h-48 bg-white/[0.03] overflow-hidden">
          {profile.bannerUrl ? (
            <img
              src={profile.bannerUrl}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${BRAND_LAVENDER}10 0%, transparent 50%, ${BRAND_LAVENDER}05 100%)`,
              }}
            />
          )}
        </div>

        {/* Profile info section */}
        <div className="max-w-[600px] mx-auto px-4">
          <div className="relative flex justify-between items-start">
            {/* Avatar */}
            <div className="-mt-12 sm:-mt-16 relative z-10">
              <div
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-black overflow-hidden bg-black"
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: `${BRAND_LAVENDER}20` }}
                  >
                    <span
                      className="text-3xl sm:text-4xl font-bold"
                      style={{ color: BRAND_LAVENDER }}
                    >
                      {initial}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action button (Edit for owner, Add/Remove Contact for others) */}
            {isOwner ? (
              <div className="mt-3 sm:mt-4">
                <motion.button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-sm font-medium border border-white/20 text-white hover:bg-white/5 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Edit profile
                </motion.button>
              </div>
            ) : isAuthenticated && (
              <div className="mt-3 sm:mt-4">
                <motion.button
                  onClick={isContact ? handleRemoveContact : handleAddContact}
                  disabled={isLoadingContact}
                  className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-sm font-medium border border-white/20 text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isLoadingContact ? 1 : 1.02 }}
                  whileTap={{ scale: isLoadingContact ? 1 : 0.98 }}
                >
                  {isLoadingContact ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                      {isContact ? 'Removing...' : 'Adding...'}
                    </span>
                  ) : (
                    isContact ? 'Remove from Contacts' : 'Add to Contacts'
                  )}
                </motion.button>
              </div>
            )}
          </div>

          {/* Name and handle */}
          <div className="mt-3 sm:mt-4">
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {displayName}
            </h1>
            <p className="text-white/40 text-sm sm:text-base">
              {profile.handle}
            </p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-3 text-white/80 text-sm sm:text-base whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {/* Join date */}
          <p className="mt-3 text-white/30 text-xs sm:text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Edit modal */}
      {isOwner && (
        <EditProfileModal
          profile={profile}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}

