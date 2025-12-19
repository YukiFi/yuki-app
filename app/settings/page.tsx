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

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const hasPasskeyEnabled = encryptedWallet?.securityLevel === "passkey_enabled";

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
    <div className="min-h-screen pt-32 pb-12 px-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-fdfffc text-sm mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-medium text-fdfffc">Settings</h1>
          <p className="text-gray-400 mt-2">Manage your account and security settings</p>
        </div>

        {/* Account Section */}
        <div className="glass p-6 rounded-xl border border-white/5 mb-6">
          <h2 className="text-lg font-medium text-fdfffc mb-4">Account</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div>
                <p className="text-sm font-medium text-fdfffc">Email</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
            
            {hasWallet && (
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <p className="text-sm font-medium text-fdfffc">Wallet Address</p>
                  <p className="text-sm text-gray-400 font-mono">
                    {encryptedWallet?.address}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Section */}
        <div className="glass p-6 rounded-xl border border-white/5 mb-6">
          <h2 className="text-lg font-medium text-fdfffc mb-4">Security</h2>
          
          {/* Passkey */}
          <div className="p-4 bg-dark-800/50 rounded-lg border border-white/5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                  <h3 className="text-sm font-medium text-fdfffc">Passkey Authentication</h3>
                  {hasPasskeyEnabled && (
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                      Enabled
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {hasPasskeyEnabled 
                    ? "Your account is protected with a passkey. You can use Face ID, Touch ID, or your device's built-in authenticator to sign in."
                    : "Add a passkey for faster, more secure sign-in using Face ID, Touch ID, Windows Hello, or your password manager."}
                </p>
              </div>
              
              {!hasPasskeyEnabled && (
                <button
                  onClick={handleEnablePasskey}
                  disabled={isEnablingPasskey}
                  className="ml-4 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isEnablingPasskey ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enabling...
                    </div>
                  ) : (
                    "Enable Passkey"
                  )}
                </button>
              )}
            </div>

            {passkeyError && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{passkeyError}</p>
              </div>
            )}

            {passkeySuccess && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-400">Passkey enabled successfully!</p>
              </div>
            )}

            {/* Info about passkey providers */}
            {!hasPasskeyEnabled && (
              <div className="mt-4 p-3 bg-accent-primary/5 border border-accent-primary/10 rounded-lg">
                <p className="text-xs text-gray-400">
                  <span className="text-accent-primary font-medium">Supported:</span> iCloud Keychain, Google Password Manager, 1Password, Bitwarden, Proton Pass, Windows Hello, and more.
                </p>
              </div>
            )}
          </div>

          {/* Security Level Indicator */}
          <div className="mt-4 p-4 bg-dark-800/50 rounded-lg border border-white/5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                hasPasskeyEnabled 
                  ? "bg-green-500/10 border border-green-500/20" 
                  : "bg-yellow-500/10 border border-yellow-500/20"
              }`}>
                {hasPasskeyEnabled ? (
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-fdfffc">
                  Security Level: {hasPasskeyEnabled ? "Strong" : "Basic"}
                </p>
                <p className="text-xs text-gray-400">
                  {hasPasskeyEnabled 
                    ? "Password + Passkey protection" 
                    : "Password-only protection"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass p-6 rounded-xl border border-red-500/20">
          <h2 className="text-lg font-medium text-red-400 mb-4">Danger Zone</h2>
          
          <button
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-800 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 animate-fade-in">
            <h3 className="text-lg font-medium text-fdfffc mb-2">Unlock Wallet</h3>
            <p className="text-sm text-gray-400 mb-4">
              Enter your password to unlock your wallet and enable passkey.
            </p>
            
            <input
              type="password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-dark-900/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors mb-4"
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
                className="flex-1 px-4 py-2 bg-white/5 text-gray-300 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlockAndEnable}
                className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 transition-colors cursor-pointer"
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
