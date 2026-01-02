"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletContext } from "@/lib/context/WalletContext";
import { startRegistration } from "@simplewebauthn/browser";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    isAuthLoading, 
    hasWallet, 
    encryptedWallet,
    unlockWallet,
    isUnlocked,
    logout 
  } = useWalletContext();
  
  const [isEnablingPasskey, setIsEnablingPasskey] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeySuccess, setPasskeySuccess] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  
  // Username state
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [lastChanged, setLastChanged] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Fetch current username
  useEffect(() => {
    const fetchUsername = async () => {
      if (!user?.email) return;
      
      try {
        const res = await fetch(`/api/auth/username?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.username) {
            setUsername(data.username);
            setOriginalUsername(data.username);
          }
          if (data.lastChanged) {
            setLastChanged(data.lastChanged);
          }
        }
      } catch {
        // Ignore fetch errors
      }
    };
    
    fetchUsername();
  }, [user?.email]);

  const hasPasskeyEnabled = encryptedWallet?.securityLevel === "passkey_enabled";
  
  const handleUsernameUpdate = async () => {
    if (!user?.email || !username.trim()) return;
    
    // Validate username format
    const cleanUsername = username.startsWith("@") ? username : `@${username}`;
    if (cleanUsername.length < 2 || cleanUsername.length > 20) {
      setUsernameError("Username must be 1-19 characters");
      return;
    }
    
    if (!/^@[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return;
    }
    
    setUsernameLoading(true);
    setUsernameError(null);
    setUsernameSuccess(false);
    
    try {
      const res = await fetch("/api/auth/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, username: cleanUsername }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setUsernameError(data.error || "Failed to update username");
        return;
      }
      
      setUsername(data.username);
      setOriginalUsername(data.username);
      setLastChanged(data.lastChanged);
      setUsernameSuccess(true);
      
      // Dispatch event so navbar updates
      window.dispatchEvent(new Event("yuki_login_update"));
      
      setTimeout(() => setUsernameSuccess(false), 3000);
    } catch {
      setUsernameError("Failed to update username");
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleEnablePasskey = async () => {
    if (!hasWallet) {
      setPasskeyError("You need to create a wallet first before enabling passkey.");
      return;
    }

    // If wallet is not unlocked, show unlock modal
    if (!isUnlocked) {
      setShowUnlockModal(true);
      return;
    }

    await performPasskeyRegistration();
  };

  const handleUnlockAndEnable = async () => {
    setUnlockError(null);
    const result = await unlockWallet(unlockPassword);
    if (result.success) {
      setShowUnlockModal(false);
      setUnlockPassword("");
      await performPasskeyRegistration();
    } else {
      setUnlockError(result.error || "Failed to unlock wallet");
    }
  };

  const performPasskeyRegistration = async () => {
    setIsEnablingPasskey(true);
    setPasskeyError(null);

    try {
      // Step 1: Get registration options from server
      const optionsRes = await fetch("/api/passkey/register", {
        method: "POST",
      });
      
      if (!optionsRes.ok) {
        const error = await optionsRes.json();
        throw new Error(error.error || "Failed to get registration options");
      }
      
      const options = await optionsRes.json();

      // Step 2: Create credential with browser/device
      const credential = await startRegistration({ optionsJSON: options });

      // Step 3: Verify with server
      const verifyRes = await fetch("/api/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      if (!verifyRes.ok) {
        const error = await verifyRes.json();
        throw new Error(error.error || "Failed to verify passkey");
      }

      setPasskeySuccess(true);
      
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error("Passkey registration error:", error);
      setPasskeyError(
        error instanceof Error ? error.message : "Failed to enable passkey"
      );
    } finally {
      setIsEnablingPasskey(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full py-12 animate-fade-in">
      {/* Header */}
      <section className="mb-8 mt-4">
        <p className="text-sm text-gray-500 mb-2 font-medium">Settings</p>
        <h1 className="text-4xl font-medium text-white tracking-tight">
          Account & Security
        </h1>
      </section>

      {/* Account Section */}
      <div className="bg-white/[0.03] rounded-lg border border-white/5 mb-6 overflow-hidden">
        <div className="px-5 py-3 bg-white/[0.02]">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">Account</h2>
        </div>
        
        <div className="p-5 space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Username</label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                <input
                  type="text"
                  value={username.replace(/^@/, "")}
                  onChange={(e) => {
                    setUsername(e.target.value.replace(/^@/, ""));
                    setUsernameError(null);
                  }}
                  placeholder="username"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <button
                onClick={handleUsernameUpdate}
                disabled={usernameLoading || username === originalUsername.replace(/^@/, "") || !username.trim()}
                className="px-4 py-2 bg-[#0F52FB] text-white rounded-lg text-sm font-medium hover:bg-[#0F52FB]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {usernameLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Save"
                )}
              </button>
            </div>
            
            {usernameError && (
              <p className="text-sm text-red-400 mt-2">{usernameError}</p>
            )}
            
            {usernameSuccess && (
              <p className="text-sm text-emerald-400 mt-2">Username updated!</p>
            )}
            
            {lastChanged && (
              <p className="text-xs text-gray-600 mt-2">
                Can change again after 30 days
              </p>
            )}
          </div>
          
          {/* Email */}
          <div className="pt-4 border-t border-white/5">
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <p className="text-sm text-white">{user?.email}</p>
          </div>
          
          {/* Wallet Address */}
          {hasWallet && (
            <div className="pt-4 border-t border-white/5">
              <label className="block text-sm text-gray-400 mb-1">Wallet Address</label>
              <p className="text-sm text-white font-mono">{encryptedWallet?.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white/[0.03] rounded-lg border border-white/5 mb-6 overflow-hidden">
        <div className="px-5 py-3 bg-white/[0.02]">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">Security</h2>
        </div>
        
        <div className="p-5 space-y-4">
          {/* Security Level */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${hasPasskeyEnabled ? "bg-emerald-500" : "bg-yellow-500"}`} />
              <div>
                <p className="text-sm text-white">{hasPasskeyEnabled ? "Strong" : "Basic"} Security</p>
                <p className="text-xs text-gray-500">
                  {hasPasskeyEnabled ? "Password + Passkey" : "Password only"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Passkey */}
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white">Passkey</p>
                  {hasPasskeyEnabled && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">
                      Enabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {hasPasskeyEnabled 
                    ? "Sign in with Face ID, Touch ID, or Windows Hello"
                    : "Add biometric authentication for faster sign-in"}
                </p>
              </div>
              
              {!hasPasskeyEnabled && (
                <button
                  onClick={handleEnablePasskey}
                  disabled={isEnablingPasskey}
                  className="px-4 py-2 bg-[#0F52FB] text-white rounded-lg text-sm font-medium hover:bg-[#0F52FB]/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isEnablingPasskey ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Enable"
                  )}
                </button>
              )}
            </div>

            {passkeyError && (
              <p className="text-sm text-red-400 mt-3">{passkeyError}</p>
            )}

            {passkeySuccess && (
              <p className="text-sm text-emerald-400 mt-3">Passkey enabled!</p>
            )}
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-white/[0.03] rounded-lg border border-white/5 overflow-hidden">
        <div className="p-5">
          <button
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className="text-sm text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-white mb-2">Unlock Wallet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter your password to enable passkey.
            </p>
            
            <input
              type="password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors mb-4"
              onKeyDown={(e) => e.key === "Enter" && handleUnlockAndEnable()}
            />
            
            {unlockError && (
              <p className="text-sm text-red-400 mb-4">{unlockError}</p>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockPassword("");
                  setUnlockError(null);
                }}
                className="flex-1 px-4 py-2 bg-white/[0.03] text-gray-300 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlockAndEnable}
                className="flex-1 px-4 py-2 bg-[#0F52FB] text-white rounded-lg text-sm font-medium hover:bg-[#0F52FB]/90 transition-colors cursor-pointer"
              >
                Unlock & Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
