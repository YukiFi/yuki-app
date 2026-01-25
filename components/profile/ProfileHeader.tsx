'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { PublicProfile } from '@/lib/validation/profile';
import { EditProfileModal } from './EditProfileModal';

const BRAND_LAVENDER = "#e1a8f0";

interface ProfileHeaderProps {
  profile: PublicProfile;
  isOwner: boolean;
}

export function ProfileHeader({ profile, isOwner }: ProfileHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  
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
            
            {/* Edit button (only for owner) */}
            {isOwner && (
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
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
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

