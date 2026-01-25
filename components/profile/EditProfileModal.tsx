'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadButton } from '@uploadthing/react';
import type { PublicProfile } from '@/lib/validation/profile';
import type { OurFileRouter } from '@/lib/uploadthing';

const BRAND_LAVENDER = "#e1a8f0";
const MAX_DISPLAY_NAME = 50;
const MAX_BIO = 160;

interface EditProfileModalProps {
  profile: PublicProfile;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  displayName: string;
  bio: string;
  username: string;
  avatarUrl: string;
  bannerUrl: string;
  isPrivate: boolean;
}

export function EditProfileModal({ profile, isOpen, onClose }: EditProfileModalProps) {
  const initialData: FormData = {
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    username: profile.handle.replace('@', ''),
    avatarUrl: profile.avatarUrl || '',
    bannerUrl: profile.bannerUrl || '',
    isPrivate: profile.isPrivate ?? false,
  };
  
  const [formData, setFormData] = useState<FormData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = 
      formData.displayName !== initialData.displayName ||
      formData.bio !== initialData.bio ||
      formData.username !== initialData.username ||
      formData.avatarUrl !== initialData.avatarUrl ||
      formData.bannerUrl !== initialData.bannerUrl ||
      formData.isPrivate !== initialData.isPrivate;
    setHasUnsavedChanges(hasChanges);
  }, [formData, initialData.displayName, initialData.bio, initialData.username, initialData.avatarUrl, initialData.bannerUrl, initialData.isPrivate]);
  
  // Focus trap
  useEffect(() => {
    if (isOpen) {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0] as HTMLElement;
      firstElement?.focus();
    }
  }, [isOpen]);
  
  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, hasUnsavedChanges]);
  
  // Debounced username check
  const checkUsernameAvailability = useCallback(async (username: string) => {
    // Skip if same as current
    if (username.toLowerCase() === profile.handle.replace('@', '').toLowerCase()) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }
    
    // Basic validation
    if (username.length < 3) {
      setUsernameStatus('invalid');
      setUsernameError('At least 3 characters');
      return;
    }
    
    if (username.length > 20) {
      setUsernameStatus('invalid');
      setUsernameError('At most 20 characters');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameStatus('invalid');
      setUsernameError('Letters, numbers, underscores only');
      return;
    }
    
    setUsernameStatus('checking');
    setUsernameError(null);
    
    try {
      const response = await fetch('/api/profile/handle-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: username }),
      });
      
      const data = await response.json();
      
      if (data.available) {
        setUsernameStatus('available');
        setUsernameError(null);
      } else {
        setUsernameStatus('taken');
        setUsernameError(data.message || 'Username unavailable');
      }
    } catch {
      setUsernameStatus('idle');
      setUsernameError('Could not check availability');
    }
  }, [profile.handle]);
  
  // Trigger username check with debounce
  useEffect(() => {
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }
    
    if (formData.username && formData.username !== profile.handle.replace('@', '')) {
      usernameCheckTimeout.current = setTimeout(() => {
        checkUsernameAvailability(formData.username);
      }, 500);
    } else {
      setUsernameStatus('idle');
      setUsernameError(null);
    }
    
    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [formData.username, profile.handle, checkUsernameAvailability]);
  
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Discard them?')) {
        setFormData(initialData);
        onClose();
      }
    } else {
      onClose();
    }
  };
  
  const handleSave = async () => {
    // Validate username if changed
    if (formData.username !== initialData.username && usernameStatus !== 'available' && usernameStatus !== 'idle') {
      setError('Please fix username issues before saving');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updates: Record<string, string | null> = {};
      
      if (formData.displayName !== initialData.displayName) {
        updates.displayName = formData.displayName || null;
      }
      if (formData.bio !== initialData.bio) {
        updates.bio = formData.bio || null;
      }
      if (formData.username !== initialData.username) {
        updates.username = formData.username;
      }
      if (formData.avatarUrl !== initialData.avatarUrl) {
        updates.avatarUrl = formData.avatarUrl || null;
      }
      if (formData.bannerUrl !== initialData.bannerUrl) {
        updates.bannerUrl = formData.bannerUrl || null;
      }
      if (formData.isPrivate !== initialData.isPrivate) {
        updates.isPrivate = formData.isPrivate;
      }
      
      const response = await fetch('/api/profile/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }
      
      // Success - reload page to reflect changes
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };
  
  const canSave = hasUnsavedChanges && 
    !isSaving && 
    (usernameStatus === 'idle' || usernameStatus === 'available') &&
    formData.displayName.length <= MAX_DISPLAY_NAME &&
    formData.bio.length <= MAX_BIO;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80" />
          
          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-black rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-white/[0.06]">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleClose}
                  className="p-2 -ml-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className="text-lg font-bold text-white">Edit profile</h2>
              </div>
              
              <motion.button
                onClick={handleSave}
                disabled={!canSave}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer disabled:cursor-not-allowed"
                style={{
                  backgroundColor: canSave ? 'white' : 'rgba(255,255,255,0.1)',
                  color: canSave ? 'black' : 'rgba(255,255,255,0.3)',
                }}
                whileHover={canSave ? { scale: 1.02 } : {}}
                whileTap={canSave ? { scale: 0.98 } : {}}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </motion.button>
            </div>
            
            {/* Banner upload area */}
            <div className="relative h-32 bg-white/[0.03] group">
              {formData.bannerUrl ? (
                <img 
                  src={formData.bannerUrl} 
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND_LAVENDER}10 0%, transparent 50%)`,
                  }}
                />
              )}
              
              {/* Upload button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <UploadButton<OurFileRouter, "bannerUploader">
                  endpoint="bannerUploader"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]?.ufsUrl) {
                      setFormData(prev => ({ ...prev, bannerUrl: res[0].ufsUrl }));
                    }
                  }}
                  onUploadError={(error) => {
                    setError(`Banner upload failed: ${error.message}`);
                  }}
                  appearance={{
                    button: "bg-black/60 hover:bg-black/80 text-white text-sm px-4 py-2 rounded-full transition-colors",
                    allowedContent: "hidden",
                  }}
                  content={{
                    button: (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                        </svg>
                        <span>{formData.bannerUrl ? 'Change' : 'Add banner'}</span>
                      </div>
                    ),
                  }}
                />
              </div>
            </div>
            
            {/* Avatar */}
            <div className="px-4 -mt-12 relative z-10 mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-black overflow-hidden bg-black relative">
                {formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl} 
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: `${BRAND_LAVENDER}20` }}
                  >
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: BRAND_LAVENDER }}
                    >
                      {formData.displayName?.charAt(0)?.toUpperCase() || formData.username?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                
                {/* Upload button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <UploadButton<OurFileRouter, "avatarUploader">
                    endpoint="avatarUploader"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]?.ufsUrl) {
                        setFormData(prev => ({ ...prev, avatarUrl: res[0].ufsUrl }));
                      }
                    }}
                    onUploadError={(error) => {
                      setError(`Avatar upload failed: ${error.message}`);
                    }}
                    appearance={{
                      button: "w-full h-full bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 hover:opacity-100",
                      allowedContent: "hidden",
                    }}
                    content={{
                      button: (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                        </svg>
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Form fields */}
            <div className="px-4 pb-6 space-y-4">
              {/* Display name */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-white/50 text-xs">Display name</label>
                  <span 
                    className="text-xs"
                    style={{ 
                      color: formData.displayName.length > MAX_DISPLAY_NAME ? '#ef4444' : 'rgba(255,255,255,0.3)' 
                    }}
                  >
                    {formData.displayName.length}/{MAX_DISPLAY_NAME}
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Your name"
                  maxLength={MAX_DISPLAY_NAME + 10}
                  className="w-full bg-white/[0.04] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/20"
                />
              </div>
              
              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-white/50 text-xs">Bio</label>
                  <span 
                    className="text-xs"
                    style={{ 
                      color: formData.bio.length > MAX_BIO ? '#ef4444' : 'rgba(255,255,255,0.3)' 
                    }}
                  >
                    {formData.bio.length}/{MAX_BIO}
                  </span>
                </div>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell people about yourself"
                  rows={3}
                  maxLength={MAX_BIO + 20}
                  className="w-full bg-white/[0.04] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/20 resize-none"
                />
              </div>
              
              {/* Username */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-white/50 text-xs">Username</label>
                  {usernameStatus === 'checking' && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                      <span className="text-white/30 text-xs">Checking...</span>
                    </div>
                  )}
                  {usernameStatus === 'available' && (
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: '#22c55e' }}
                      />
                      <span className="text-xs" style={{ color: '#22c55e' }}>Available</span>
                    </div>
                  )}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-red-400 text-xs">{usernameError}</span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">@</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) 
                    }))}
                    placeholder="username"
                    className="w-full bg-white/[0.04] text-white pl-8 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/20"
                  />
                </div>
                <p className="mt-1.5 text-white/20 text-xs">
                  Can be changed once every 30 days
                </p>
              </div>
              
              {/* Privacy toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-white text-sm font-medium">Private account</p>
                  <p className="text-white/40 text-xs">Hide transactions from your profile</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    formData.isPrivate ? '' : 'bg-white/10'
                  }`}
                  style={formData.isPrivate ? { backgroundColor: BRAND_LAVENDER } : {}}
                >
                  <div 
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      formData.isPrivate ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Error message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

