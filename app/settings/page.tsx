"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

// Mock data - in production these would come from your backend
const MOCK_WALLET_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
const MOCK_LAST_USERNAME_CHANGE = new Date("2025-01-01"); // Example: user changed username on Jan 1, 2025

// Mock taken usernames for demo
const MOCK_TAKEN_USERNAMES = ["john", "admin", "yuki", "test", "user"];

// Check username availability (mock - replace with real API)
async function checkUsernameAvailability(username: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network delay
  return !MOCK_TAKEN_USERNAMES.includes(username.toLowerCase());
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  
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

  if (!isLoaded) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
      </div>
    );
  }

  // Username change logic
  const daysSinceLastChange = Math.floor(
    (Date.now() - MOCK_LAST_USERNAME_CHANGE.getTime()) / (1000 * 60 * 60 * 24)
  );
  const canChangeUsername = daysSinceLastChange >= 30;
  const daysUntilChange = 30 - daysSinceLastChange;

  const currentUsername = user?.username || "Not set";
  
  // Debounced username availability check
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
  
  const handleSaveUsername = async () => {
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
    
    try {
      // In production, call API to update username
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setUsernameSaved(true);
      
      // Show success briefly then close
      setTimeout(() => {
        setIsEditingUsername(false);
        setNewUsername("");
        setUsernameError(null);
        setUsernameAvailable(null);
        setUsernameSaved(false);
      }, 1200);
    } catch {
      setUsernameError("Failed to save. Try again.");
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

  const userInitial = user?.firstName?.charAt(0) 
    || user?.username?.charAt(0).toUpperCase()
    || user?.primaryEmailAddress?.emailAddress?.charAt(0).toUpperCase() 
    || "U";

  return (
    <>
      <div className="min-h-[calc(100vh-3.5rem)] px-6 sm:px-10 lg:px-16 py-12 max-w-2xl">
        {/* Header - no entrance animation */}
        <div className="mb-16">
          <h1 className="text-4xl font-medium text-white">Settings</h1>
        </div>

        {/* Profile Section - immediately visible */}
        <section className="mb-16">
          <h2 className="text-white/40 text-xs uppercase tracking-wider mb-6">Profile</h2>
          
          {/* Avatar */}
          <div className="flex items-start gap-6 mb-8">
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="relative group cursor-pointer"
            >
              <div className="w-20 h-20 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden">
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-medium text-white/60">{userInitial}</span>
                )}
                
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
            
            <div className="pt-2">
              <p className="text-white/50 text-sm mb-1">Profile photo</p>
              <p className="text-white/30 text-xs">Click to change</p>
            </div>
          </div>

          {/* Username */}
          <div className="py-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-white/50 text-sm mb-1">Username</p>
                
                {isEditingUsername ? (
                <div>
                    {/* Input row */}
                    <div className="flex items-center gap-1">
                      <span className="text-white/40 text-lg">@</span>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => {
                          setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20));
                        }}
                        placeholder={currentUsername === "Not set" ? "username" : currentUsername}
                        className="bg-transparent text-white text-lg w-44 focus:outline-none placeholder:text-white/20"
                        autoFocus
                        disabled={isSavingUsername || usernameSaved}
                      />
                      
                      {/* Status indicator */}
                      <div className="w-5 h-5 flex items-center justify-center ml-1">
                        <AnimatePresence mode="wait">
                          {isCheckingUsername && (
                            <motion.div
                              key="checking"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="w-4 h-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin"
                            />
                          )}
                          {!isCheckingUsername && usernameAvailable === true && !usernameSaved && (
                            <motion.svg
                              key="available"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              className="w-4 h-4 text-emerald-400"
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </motion.svg>
                          )}
                          {!isCheckingUsername && usernameAvailable === false && (
                            <motion.svg
                              key="taken"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              className="w-4 h-4 text-red-400"
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </motion.svg>
                          )}
                          {usernameSaved && (
                            <motion.svg
                              key="saved"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="w-4 h-4 text-emerald-400"
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </motion.svg>
                          )}
                        </AnimatePresence>
                </div>
              </div>
                    
                    {/* Status message */}
                    <div className="h-5 mt-1">
                      <AnimatePresence mode="wait">
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
                        {isCheckingUsername && !usernameError && (
                          <motion.p
                            key="checking"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-white/40 text-xs"
                          >
                            Checking availability...
                          </motion.p>
                        )}
                        {!isCheckingUsername && usernameAvailable === true && !usernameError && !usernameSaved && (
                          <motion.p
                            key="available"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-emerald-400/80 text-xs"
                          >
                            Username available
                          </motion.p>
                        )}
                        {usernameSaved && (
                          <motion.p
                            key="saved"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="text-emerald-400 text-xs"
                          >
                            Username saved!
                          </motion.p>
                        )}
                        {!newUsername && !usernameError && (
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
                  <p className="text-white text-lg">
                    {currentUsername === "Not set" ? (
                      <span className="text-white/30">Not set</span>
                    ) : (
                      <>@{currentUsername}</>
                    )}
                  </p>
                )}
                
                {!canChangeUsername && !isEditingUsername && (
                  <p className="text-white/30 text-xs mt-1">
                    Can change in {daysUntilChange} day{daysUntilChange !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              
              {isEditingUsername ? (
                <div className="flex items-center gap-2 pt-6">
              <button
                    onClick={handleCancelUsernameEdit}
                    disabled={isSavingUsername || usernameSaved}
                    className="text-white/40 hover:text-white/60 text-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
              </button>
                  <motion.button
                    onClick={handleSaveUsername}
                    disabled={!usernameAvailable || isCheckingUsername || isSavingUsername || usernameSaved}
                    className={`
                      px-4 py-2 rounded-lg text-sm transition-all cursor-pointer min-w-[70px] flex items-center justify-center gap-2
                      ${usernameAvailable && !isSavingUsername && !usernameSaved
                        ? "bg-white text-black hover:bg-white/90"
                        : "bg-white/[0.06] text-white/40"
                      }
                      disabled:cursor-not-allowed
                    `}
                    whileHover={usernameAvailable && !isSavingUsername ? { scale: 1.02 } : {}}
                    whileTap={usernameAvailable && !isSavingUsername ? { scale: 0.98 } : {}}
                  >
                    {isSavingUsername ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                        <span>Saving</span>
                      </>
                    ) : usernameSaved ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                  className={`text-sm transition-colors cursor-pointer ${
                    canChangeUsername 
                      ? "text-white/40 hover:text-white/60" 
                      : "text-white/20 cursor-not-allowed"
                  }`}
                >
                  {canChangeUsername ? "Change" : "Locked"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="mb-16">
          <h2 className="text-white/40 text-xs uppercase tracking-wider mb-6">Security</h2>
          
          {/* 2FA / Passkey */}
          <div className="py-5 flex items-center justify-between">
            <div>
              <p className="text-white text-base mb-1">Two-Factor Authentication</p>
              <p className="text-white/40 text-sm">Passkey or authenticator app</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-sm">Not set up</span>
              <button className="text-white/40 hover:text-white/60 text-sm transition-colors cursor-pointer">
                Set up
              </button>
            </div>
          </div>
        </section>

        {/* Wallet Section */}
        <section className="mb-16">
          <h2 className="text-white/40 text-xs uppercase tracking-wider mb-6">Wallet</h2>
          
          {/* Public Address */}
          <div className="py-5">
            <p className="text-white/50 text-sm mb-2">Public Address</p>
            <div className="flex items-center gap-3">
              <p className="text-white font-mono text-sm">
                {MOCK_WALLET_ADDRESS.slice(0, 6)}...{MOCK_WALLET_ADDRESS.slice(-4)}
              </p>
              <button
                onClick={handleCopyAddress}
                className="text-white/40 hover:text-white/60 transition-colors cursor-pointer"
              >
                {copiedAddress ? (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

          {/* Private Key */}
          <div className="py-5 flex items-center justify-between">
            <div>
              <p className="text-white text-base mb-1">Private Key</p>
              <p className="text-white/40 text-sm">Export your wallet's private key</p>
            </div>
            <button
              onClick={handleRequestPrivateKey}
              className="text-red-400/70 hover:text-red-400 text-sm transition-colors cursor-pointer"
            >
              Export
            </button>
          </div>
        </section>

        {/* Sign Out */}
        <div className="pt-8">
          <button
            onClick={() => signOut()}
            className="text-red-400/70 hover:text-red-400 text-sm font-medium transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Private Key Export Modal */}
      <AnimatePresence>
        {showPrivateKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={closePrivateKeyModal}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md mx-4 bg-[#121215] rounded-[28px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                {privateKeyStep === "warning" && (
                  <motion.div
                    key="warning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8"
                  >
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    
                    <h2 className="text-white text-xl font-medium text-center mb-2">
                      Export Private Key
                    </h2>
                    <p className="text-white/50 text-sm text-center mb-6">
                      Your private key gives full control of your wallet. Never share it with anyone.
                    </p>
                    
                    <div className="bg-red-500/[0.08] rounded-xl p-4 mb-6">
                      <p className="text-red-400/80 text-sm">
                        <strong>Warning:</strong> Anyone with your private key can steal all your funds. Yuki will never ask for your private key.
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={closePrivateKeyModal}
                        className="flex-1 py-4 rounded-2xl text-base font-medium bg-white/[0.06] text-white/70 hover:bg-white/[0.1] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setPrivateKeyStep("verify")}
                        className="flex-1 py-4 rounded-2xl text-base font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer"
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
                    className="p-8"
                  >
                    <button
                      onClick={() => setPrivateKeyStep("warning")}
                      className="text-white/40 hover:text-white/60 transition-colors mb-6 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    
                    <h2 className="text-white text-xl font-medium mb-2">
                      Verify your identity
                    </h2>
                    <p className="text-white/50 text-sm mb-8">
                      Enter the 6-digit code from your authenticator app
                    </p>
                    
                    <div className="mb-8">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        className="w-full bg-white/[0.04] text-white text-2xl text-center py-4 rounded-2xl focus:outline-none placeholder:text-white/20 font-mono tracking-[0.5em]"
                        autoFocus
                      />
                    </div>
                    
                    <button
                      onClick={handleVerify2FA}
                      disabled={verificationCode.length !== 6}
                      className={`w-full py-4 rounded-2xl text-base font-medium transition-colors cursor-pointer ${
                        verificationCode.length === 6
                          ? "bg-white text-black"
                          : "bg-white/[0.06] text-white/30"
                      }`}
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
                    className="p-8"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                      </svg>
                    </div>
                    
                    <h2 className="text-white text-xl font-medium text-center mb-6">
                      Your Private Key
                    </h2>
                    
                    <div className="bg-white/[0.04] rounded-xl p-4 mb-4">
                      <p className="text-white font-mono text-xs break-all leading-relaxed">
                        {revealedPrivateKey}
                      </p>
                    </div>
                    
                    <button
                      onClick={handleCopyPrivateKey}
                      className="w-full py-3 rounded-xl text-sm font-medium bg-white/[0.06] text-white/70 hover:bg-white/[0.1] transition-colors cursor-pointer flex items-center justify-center gap-2 mb-6"
                    >
                      {copiedKey ? (
                        <>
                          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                    
                    <div className="bg-red-500/[0.08] rounded-xl p-4 mb-6">
                      <p className="text-red-400/80 text-xs">
                        Store this in a secure location. It will not be shown again.
                      </p>
    </div>
                    
                    <button
                      onClick={closePrivateKeyModal}
                      className="w-full py-4 rounded-2xl text-base font-medium bg-white text-black cursor-pointer"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close button */}
              <button
                onClick={closePrivateKeyModal}
                className="absolute top-6 right-6 text-white/30 hover:text-white/50 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
