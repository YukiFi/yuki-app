"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";

const BRAND_LAVENDER = "#e1a8f0";

// Mock data - in production these would come from your backend
const MOCK_WALLET_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

// Check username availability via API
async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const response = await fetch("/api/user/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: username.toLowerCase(), type: "username" }),
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error("Failed to check username");
    }
    
    const data = await response.json();
    return !data.exists; // Available if username doesn't exist
  } catch (error) {
    console.error("Error checking username availability:", error);
    throw error;
  }
}

export default function SettingsPage() {
  const { user, isLoading: isLoaded, isAuthenticated, logout } = useAuth();
  const isLoadedReady = !isLoaded;
  
  // Username editing
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  
  // Profile picture
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Private key request
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [privateKeyStep, setPrivateKeyStep] = useState<"warning" | "verify" | "reveal">("warning");
  const [verificationCode, setVerificationCode] = useState("");
  const [revealedPrivateKey, setRevealedPrivateKey] = useState<string | null>(null);
  
  // Copy states
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Username data from API
  const [currentUsername, setCurrentUsername] = useState<string>("Not set");
  const [canChangeUsername, setCanChangeUsername] = useState(true);
  const [daysUntilChange, setDaysUntilChange] = useState(0);
  const [isLoadingUsernameData, setIsLoadingUsernameData] = useState(true);

  // Fetch username data from API on mount
  useEffect(() => {
    async function fetchUsernameData() {
      try {
        const response = await fetch("/api/auth/username", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUsername(data.username?.replace(/^@/, "") || "Not set");
          setCanChangeUsername(data.canChange);
          setDaysUntilChange(data.daysUntilChange || 0);
        }
      } catch (error) {
        console.error("Failed to fetch username data:", error);
      } finally {
        setIsLoadingUsernameData(false);
      }
    }
    
    if (isLoadedReady && isAuthenticated) {
      fetchUsernameData();
    }
  }, [isLoadedReady, isAuthenticated]);
  
  // Debounced username availability check - MUST be before any early returns
  useEffect(() => {
    if (!isEditingUsername || !newUsername) {
      setUsernameAvailable(null);
      setIsCheckingUsername(false);
      return;
    }

    // Basic validation first
    if (newUsername.length < 3) {
      setUsernameAvailable(null);
      setUsernameError("At least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameAvailable(null);
      setUsernameError("Letters, numbers, underscores only");
      return;
    }
    if (newUsername.toLowerCase() === currentUsername.toLowerCase()) {
      setUsernameAvailable(null);
      setUsernameError("Same as current username");
      return;
    }

    setUsernameError(null);
    setIsCheckingUsername(true);
    setUsernameAvailable(null);

    const timeoutId = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailability(newUsername);
        setUsernameAvailable(available);
        if (!available) {
          setUsernameError("Username is taken");
        }
      } catch {
        setUsernameError("Couldn't check availability");
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [newUsername, isEditingUsername, currentUsername]);

  // Loading state - after all hooks
  if (!isLoadedReady) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
      </div>
    );
  }
  
  const handleSaveUsername = async () => {
    if (!user) {
      setUsernameError("Not logged in");
      return;
    }
    if (!newUsername || newUsername.length < 3) {
      setUsernameError("At least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameError("Letters, numbers, underscores only");
      return;
    }
    if (!usernameAvailable) {
      return;
    }
    
    setIsSavingUsername(true);
    setUsernameError(null);
    
    try {
      // Update the username via our API endpoint
      const response = await fetch("/api/auth/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update username");
      }
      
      setUsernameSaved(true);
      
      // Show success briefly then close
      setTimeout(() => {
        setIsEditingUsername(false);
        setNewUsername("");
        setUsernameError(null);
        setUsernameAvailable(null);
        setUsernameSaved(false);
        // Reload to refresh user data
        window.location.reload();
      }, 1200);
    } catch (err: unknown) {
      console.error("Failed to update username:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save. Try again.";
      setUsernameError(errorMessage);
    } finally {
      setIsSavingUsername(false);
    }
  };
  
  const handleCancelUsernameEdit = () => {
    setIsEditingUsername(false);
    setNewUsername("");
    setUsernameError(null);
    setUsernameAvailable(null);
    setIsCheckingUsername(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingAvatar(true);
    // In production, upload to your storage and update user profile
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsUploadingAvatar(false);
  };

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(MOCK_WALLET_ADDRESS);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleRequestPrivateKey = () => {
    setShowPrivateKeyModal(true);
    setPrivateKeyStep("warning");
  };

  const handleVerify2FA = async () => {
    // In production, verify the code with your backend
    if (verificationCode.length === 6) {
      // Mock private key (never show real keys in logs/UI in production!)
      setRevealedPrivateKey("0x" + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join(""));
      setPrivateKeyStep("reveal");
    }
  };

  const handleCopyPrivateKey = async () => {
    if (revealedPrivateKey) {
      await navigator.clipboard.writeText(revealedPrivateKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const closePrivateKeyModal = () => {
    setShowPrivateKeyModal(false);
    setPrivateKeyStep("warning");
    setVerificationCode("");
    setRevealedPrivateKey(null);
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <div className="min-h-[calc(100vh-3.5rem)] w-full flex flex-col items-center px-4 sm:px-8 lg:px-16 py-8 sm:py-12">
        <div className="w-full max-w-[1100px]">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Settings</h1>
          </div>

          {/* Profile Section */}
          <section className="mb-6 sm:mb-8">
            <p className="text-white/50 text-xs font-medium tracking-wide mb-4 sm:mb-6">Profile</p>
            
            <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-4 py-4 sm:px-6 sm:py-5">
              {/* Avatar */}
              <div className="flex items-center gap-4 sm:gap-6 py-3 sm:py-4">
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="relative group cursor-pointer flex-shrink-0"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden">
                    <span className="text-xl sm:text-2xl font-medium text-white/60">{userInitial}</span>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                      {isUploadingAvatar ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </button>
                
                <div>
                  <p className="text-white font-medium text-sm sm:text-base mb-0.5">Profile photo</p>
                  <p className="text-white/40 text-xs sm:text-sm">Click to change</p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.04] my-1" />

              {/* Username */}
              <div className="py-3 sm:py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white/50 text-xs sm:text-sm mb-1.5">Username</p>
                    
                    {isEditingUsername ? (
                      <div>
                        {/* Input row */}
                        <div className="flex items-center gap-1">
                          <span className="text-white/40 text-base sm:text-lg">@</span>
                          <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => {
                              setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20));
                            }}
                            placeholder={currentUsername === "Not set" ? "username" : currentUsername}
                            className="bg-transparent text-white text-base sm:text-lg w-full max-w-[200px] focus:outline-none placeholder:text-white/20"
                            autoFocus
                            disabled={isSavingUsername || usernameSaved}
                          />
                        </div>
                        
                        {/* Status message */}
                        <div className="h-5 mt-2">
                          <AnimatePresence mode="wait">
                            {isCheckingUsername && !usernameError && (
                              <motion.div
                                key="checking"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="flex items-center gap-2"
                              >
                                <div className="w-3 h-3 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                                <span className="text-white/40 text-xs">Checking availability...</span>
                              </motion.div>
                            )}
                            {usernameError && (
                              <motion.p
                                key="error"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="text-red-400 text-xs"
                              >
                                {usernameError}
                              </motion.p>
                            )}
                            {!isCheckingUsername && usernameAvailable === true && !usernameError && !usernameSaved && (
                              <motion.div
                                key="available"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="flex items-center gap-2"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: BRAND_LAVENDER }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-xs" style={{ color: BRAND_LAVENDER }}>Username available</span>
                              </motion.div>
                            )}
                            {!isCheckingUsername && usernameAvailable === false && !usernameError && (
                              <motion.div
                                key="taken"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="flex items-center gap-2"
                              >
                                <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-red-400 text-xs">Username is taken</span>
                              </motion.div>
                            )}
                            {usernameSaved && (
                              <motion.div
                                key="saved"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="flex items-center gap-2"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: BRAND_LAVENDER }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-xs" style={{ color: BRAND_LAVENDER }}>Username saved!</span>
                              </motion.div>
                            )}
                            {!newUsername && !usernameError && !isCheckingUsername && (
                              <motion.p
                                key="hint"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-white/30 text-xs"
                              >
                                3-20 characters
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-white text-base sm:text-lg">
                          {currentUsername === "Not set" ? (
                            <span className="text-white/30">Not set</span>
                          ) : (
                            <>@{currentUsername}</>
                          )}
                        </p>
                        
                        {!canChangeUsername && (
                          <p className="text-white/30 text-xs mt-1">
                            Can change in {daysUntilChange} day{daysUntilChange !== 1 ? "s" : ""}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  
                  {isEditingUsername ? (
                    <div className="flex items-center gap-2 pt-5 sm:pt-6 flex-shrink-0">
                      <button
                        onClick={handleCancelUsernameEdit}
                        disabled={isSavingUsername || usernameSaved}
                        className="text-white/40 hover:text-white/60 text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <motion.button
                        onClick={handleSaveUsername}
                        disabled={!usernameAvailable || isCheckingUsername || isSavingUsername || usernameSaved}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all cursor-pointer min-w-[60px] sm:min-w-[70px] flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: usernameAvailable && !isSavingUsername && !usernameSaved ? "white" : "rgba(255,255,255,0.06)",
                          color: usernameAvailable && !isSavingUsername && !usernameSaved ? "black" : "rgba(255,255,255,0.4)"
                        }}
                        whileHover={usernameAvailable && !isSavingUsername ? { scale: 1.02 } : {}}
                        whileTap={usernameAvailable && !isSavingUsername ? { scale: 0.98 } : {}}
                      >
                        {isSavingUsername ? (
                          <>
                            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                            <span>Saving</span>
                          </>
                        ) : usernameSaved ? (
                          <>
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Saved</span>
                          </>
                        ) : (
                          "Save"
                        )}
                      </motion.button>
                    </div>
                  ) : (
                    <button
                      onClick={() => canChangeUsername && setIsEditingUsername(true)}
                      disabled={!canChangeUsername}
                      className="text-xs sm:text-sm transition-colors cursor-pointer flex-shrink-0 pt-5 sm:pt-6"
                      style={{ color: canChangeUsername ? BRAND_LAVENDER : "rgba(255,255,255,0.2)" }}
                    >
                      {canChangeUsername ? "Change" : "Locked"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="mb-6 sm:mb-8">
            <p className="text-white/50 text-xs font-medium tracking-wide mb-4 sm:mb-6">Security</p>
            
            <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-4 py-4 sm:px-6 sm:py-5">
              {/* 2FA / Passkey */}
              <div className="py-3 sm:py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm sm:text-base mb-0.5">Two-Factor Authentication</p>
                  <p className="text-white/40 text-xs sm:text-sm">Passkey or authenticator app</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className="text-white/30 text-xs sm:text-sm">Not set up</span>
                  <button 
                    className="text-xs sm:text-sm transition-colors cursor-pointer"
                    style={{ color: BRAND_LAVENDER }}
                  >
                    Set up
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Wallet Section */}
          <section className="mb-6 sm:mb-8">
            <p className="text-white/50 text-xs font-medium tracking-wide mb-4 sm:mb-6">Wallet</p>
            
            <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-4 py-4 sm:px-6 sm:py-5">
              {/* Public Address */}
              <div className="py-3 sm:py-4">
                <p className="text-white/50 text-xs sm:text-sm mb-1.5">Public Address</p>
                <div className="flex items-center gap-2 sm:gap-3">
                  <p className="text-white font-mono text-xs sm:text-sm">
                    {MOCK_WALLET_ADDRESS.slice(0, 6)}...{MOCK_WALLET_ADDRESS.slice(-4)}
                  </p>
                  <button
                    onClick={handleCopyAddress}
                    className="text-white/40 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    {copiedAddress ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: BRAND_LAVENDER }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                    )}
                  </button>
                  <a
                    href={`https://basescan.org/address/${MOCK_WALLET_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white/60 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.04] my-1" />

              {/* Private Key */}
              <div className="py-3 sm:py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm sm:text-base mb-0.5">Private Key</p>
                  <p className="text-white/40 text-xs sm:text-sm">Export your wallet's private key</p>
                </div>
                <button
                  onClick={handleRequestPrivateKey}
                  className="text-red-400/70 hover:text-red-400 text-xs sm:text-sm transition-colors cursor-pointer flex-shrink-0"
                >
                  Export
                </button>
              </div>
            </div>
          </section>

          {/* Sign Out */}
          <div className="pt-4 sm:pt-6">
            <button
              onClick={() => logout()}
              className="text-red-400/70 hover:text-red-400 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Private Key Export Modal */}
      <AnimatePresence>
        {showPrivateKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
            onClick={closePrivateKeyModal}
          >
            <div className="absolute inset-0 bg-black/80" />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full sm:max-w-md bg-black sm:rounded-3xl rounded-t-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                {privateKeyStep === "warning" && (
                  <motion.div
                    key="warning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6 sm:p-8"
                  >
                    <div 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6"
                      style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                    >
                      <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    
                    <h2 className="text-white text-lg sm:text-xl font-bold text-center mb-2">
                      Export Private Key
                    </h2>
                    <p className="text-white/50 text-xs sm:text-sm text-center mb-5 sm:mb-6">
                      Your private key gives full control of your wallet. Never share it with anyone.
                    </p>
                    
                    <div className="bg-red-500/[0.08] rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-5 sm:mb-6">
                      <p className="text-red-400/80 text-xs sm:text-sm">
                        <strong>Warning:</strong> Anyone with your private key can steal all your funds. Yuki will never ask for your private key.
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={closePrivateKeyModal}
                        className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium bg-white/[0.06] text-white/70 hover:bg-white/[0.1] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setPrivateKeyStep("verify")}
                        className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer"
                      >
                        Continue
                      </button>
                    </div>
                  </motion.div>
                )}

                {privateKeyStep === "verify" && (
                  <motion.div
                    key="verify"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6 sm:p-8"
                  >
                    <button
                      onClick={() => setPrivateKeyStep("warning")}
                      className="text-white/40 hover:text-white/60 transition-colors mb-5 sm:mb-6 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    
                    <h2 className="text-white text-lg sm:text-xl font-bold mb-2">
                      Verify your identity
                    </h2>
                    <p className="text-white/50 text-xs sm:text-sm mb-6 sm:mb-8">
                      Enter the 6-digit code from your authenticator app
                    </p>
                    
                    <div className="mb-6 sm:mb-8">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        className="w-full bg-white/[0.04] text-white text-xl sm:text-2xl text-center py-3 sm:py-4 rounded-xl sm:rounded-2xl focus:outline-none placeholder:text-white/20 font-mono tracking-[0.5em]"
                        autoFocus
                      />
                    </div>
                    
                    <button
                      onClick={handleVerify2FA}
                      disabled={verificationCode.length !== 6}
                      className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium transition-colors cursor-pointer"
                      style={{
                        backgroundColor: verificationCode.length === 6 ? "white" : "rgba(255,255,255,0.06)",
                        color: verificationCode.length === 6 ? "black" : "rgba(255,255,255,0.3)"
                      }}
                    >
                      Verify
                    </button>
                  </motion.div>
                )}

                {privateKeyStep === "reveal" && (
                  <motion.div
                    key="reveal"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-6 sm:p-8"
                  >
                    <div 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6"
                      style={{ backgroundColor: `${BRAND_LAVENDER}15` }}
                    >
                      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: BRAND_LAVENDER }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                      </svg>
                    </div>
                    
                    <h2 className="text-white text-lg sm:text-xl font-bold text-center mb-5 sm:mb-6">
                      Your Private Key
                    </h2>
                    
                    <div className="bg-white/[0.04] rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4">
                      <p className="text-white font-mono text-[10px] sm:text-xs break-all leading-relaxed">
                        {revealedPrivateKey}
                      </p>
                    </div>
                    
                    <button
                      onClick={handleCopyPrivateKey}
                      className="w-full py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium bg-white/[0.06] text-white/70 hover:bg-white/[0.1] transition-colors cursor-pointer flex items-center justify-center gap-2 mb-5 sm:mb-6"
                    >
                      {copiedKey ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: BRAND_LAVENDER }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                          </svg>
                          Copy to clipboard
                        </>
                      )}
                    </button>
                    
                    <div className="bg-red-500/[0.08] rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-5 sm:mb-6">
                      <p className="text-red-400/80 text-[10px] sm:text-xs">
                        Store this in a secure location. It will not be shown again.
                      </p>
                    </div>
                    
                    <button
                      onClick={closePrivateKeyModal}
                      className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium bg-white text-black cursor-pointer"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
