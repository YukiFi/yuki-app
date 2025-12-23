"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Reserved usernames to simulate "taken" status
const RESERVED_USERNAMES = [
  "admin",
  "yuki",
  "support",
  "help",
  "system",
  "wallet",
  "haruxe",
];

// Mock ID to ensure consistency in demo
const MOCK_USER_ID = "mock-user-123";

export default function AccountPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Username editing state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  
  // Rate limiting state
  const [daysUntilChange, setDaysUntilChange] = useState(0);
  
  // Ref to track the latest check
  const checkIdRef = useRef(0);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      const email = localStorage.getItem("yuki_user_email");
      const wallet = localStorage.getItem("yuki_wallet_address");
      const storedUsername = localStorage.getItem("yuki_username");
      
      if (status !== "true") {
        router.push("/signin");
        return;
      }

      setIsLoggedIn(true);
      setUserEmail(email);
      setWalletAddress(wallet);
      
      // Use localStorage as source of truth for username (since in-memory DB resets)
      if (storedUsername) {
        setUsername(storedUsername);
      }

      // Try to fetch from server, but fall back to localStorage
      try {
        const res = await fetch(`/api/auth/username?userId=${MOCK_USER_ID}`);
        if (res.ok) {
          const data = await res.json();
          // Only update if server has a username, otherwise keep localStorage value
          if (data.username) {
            setUsername(data.username);
          }
          
          if (data.lastChanged) {
            localStorage.setItem("yuki_username_last_changed", new Date(data.lastChanged).getTime().toString());
          }
        }
      } catch (error) {
        console.error("Failed to fetch username info", error);
        // Keep localStorage value on error
      }
    };

    checkLoginStatus();
    window.addEventListener("yuki_login_update", checkLoginStatus);
    return () => window.removeEventListener("yuki_login_update", checkLoginStatus);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("yuki_onboarding_complete");
    localStorage.removeItem("yuki_auth_method");
    localStorage.removeItem("yuki_user_email");
    localStorage.removeItem("yuki_wallet_address");
    localStorage.removeItem("yuki_balances");
    localStorage.removeItem("yuki_username");
    localStorage.removeItem("yuki_username_last_changed");
    window.dispatchEvent(new Event("yuki_login_update"));
    router.push("/");
  };

  const checkAvailability = async (nameWithoutAt: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const normalizedName = nameWithoutAt.toLowerCase();
    const currentUsernameWithoutAt = username?.replace(/^@/, '').toLowerCase();
    
    // Allow if it's their current username
    if (normalizedName === currentUsernameWithoutAt) {
      return true;
    }
    
    // Check reserved list
    if (RESERVED_USERNAMES.includes(normalizedName)) {
      return false;
    }
    
    return true;
  };

  // Debounced availability check effect
  useEffect(() => {
    if (!isEditingUsername) {
      setIsChecking(false);
      setUsernameError("");
      setIsAvailable(null);
      return;
    }

    const trimmedName = newUsername.trim();
    
    // Don't check if empty or too short
    if (!trimmedName || trimmedName.length < 3) {
      setIsChecking(false);
      setUsernameError("");
      setIsAvailable(null);
      return;
    }

    // Check format
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
      setIsChecking(false);
      setUsernameError("Only letters, numbers, and underscores allowed");
      setIsAvailable(false);
      return;
    }

    // Start checking
    setIsChecking(true);
    setUsernameError("");
    setIsAvailable(null);
    
    const currentCheckId = ++checkIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const available = await checkAvailability(trimmedName);
        
        // Only update if this is still the latest check
        if (currentCheckId === checkIdRef.current) {
          setIsAvailable(available);
          if (!available) {
            setUsernameError("That username is already taken");
          } else {
            setUsernameError("");
          }
          setIsChecking(false);
        }
      } catch (err) {
        if (currentCheckId === checkIdRef.current) {
          setIsChecking(false);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [newUsername, isEditingUsername, username]);

  const handleSaveUsername = async () => {
    const trimmedName = newUsername.trim();
    const validUsername = "@" + trimmedName;
    
    // Validation
    if (trimmedName.length < 3) {
      setUsernameError("Username must be at least 3 characters long");
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return;
    }

    // 30-day rate limit check (client-side enforcement)
    const storedLastChanged = localStorage.getItem("yuki_username_last_changed");
    if (storedLastChanged) {
      const lastChangedTimestamp = parseInt(storedLastChanged);
      const daysSinceChange = (Date.now() - lastChangedTimestamp) / (1000 * 60 * 60 * 24);
      
      if (daysSinceChange < 30) {
        const daysRemaining = Math.ceil(30 - daysSinceChange);
        setUsernameError(`You can only change your username once every 30 days. Try again in ${daysRemaining} days.`);
        return;
      }
    }

    // If we already know it's not available, don't proceed
    if (isAvailable === false) {
      setUsernameError("That username is already taken");
      return;
    }

    setIsSubmitting(true);
    setUsernameError("");

    // Final availability check
    try {
      const available = await checkAvailability(trimmedName);
      if (!available) {
        setUsernameError("That username is already taken");
        setIsSubmitting(false);
        setIsAvailable(false);
        return;
      }
    } catch (err) {
      setUsernameError("Failed to verify availability. Please try again.");
      setIsSubmitting(false);
      return;
    }
    
    // Server-side update
    try {
      const res = await fetch("/api/auth/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: MOCK_USER_ID,
          username: validUsername 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setUsernameError(data.error || "Failed to update username");
        setIsSubmitting(false);
        return;
      }

      // Success!
      const now = Date.now();
      localStorage.setItem("yuki_username", validUsername);
      localStorage.setItem("yuki_username_last_changed", now.toString());
      
      setUsername(validUsername);
      setIsEditingUsername(false);
      setUsernameError("");
      setNewUsername("");
      setIsAvailable(null);
      window.dispatchEvent(new Event("yuki_login_update"));
    } catch (error) {
      setUsernameError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting && !isChecking && isAvailable !== false) {
      e.preventDefault();
      handleSaveUsername();
    } else if (e.key === 'Escape') {
      setIsEditingUsername(false);
    }
  };

  const startEditingUsername = async () => {
    setIsChecking(true);
    
    // Check localStorage first (since in-memory server DB resets)
    const storedLastChanged = localStorage.getItem("yuki_username_last_changed");
    let lastChangedTimestamp: number | null = storedLastChanged ? parseInt(storedLastChanged) : null;
    
    // Try to fetch from server as well
    try {
      const res = await fetch(`/api/auth/username?userId=${MOCK_USER_ID}`);
      if (res.ok) {
        const data = await res.json();
        
        // Use server value if available (more authoritative)
        if (data.lastChanged) {
          lastChangedTimestamp = new Date(data.lastChanged).getTime();
          // Sync to localStorage
          localStorage.setItem("yuki_username_last_changed", lastChangedTimestamp.toString());
        }
      }
    } catch (error) {
      console.error("Failed to check rate limit from server");
    }
    
    // Calculate days until change allowed
    if (lastChangedTimestamp) {
      const daysSinceChange = (Date.now() - lastChangedTimestamp) / (1000 * 60 * 60 * 24);
      
      if (daysSinceChange < 30) {
        setDaysUntilChange(Math.ceil(30 - daysSinceChange));
      } else {
        setDaysUntilChange(0);
      }
    } else {
      setDaysUntilChange(0);
    }
    
    setIsChecking(false);
    // Initialize WITHOUT the @ sign for editing
    setNewUsername(username ? username.replace(/^@/, '') : "");
    setIsEditingUsername(true);
    setUsernameError("");
    setIsAvailable(null);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const canSubmit = !isSubmitting && !isChecking && isAvailable !== false && newUsername.trim().length >= 3;

  if (!isLoggedIn) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 pb-24 animate-fade-in">
      {/* Back link */}
      <div className="pt-8 pb-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {/* Header */}
      <section className="pb-10">
        <h1 className="text-2xl font-medium text-white mb-2">Account</h1>
        <p className="text-gray-500 text-sm">Your account information</p>
      </section>

      {/* Account Details */}
      <section className="space-y-6">
        
        {/* Username Section */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Username</p>
            {!isEditingUsername && (
              <button 
                onClick={startEditingUsername}
                disabled={isChecking}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isChecking ? "Loading..." : (username ? "Change" : "Set username")}
              </button>
            )}
          </div>
          
          {isEditingUsername ? (
            <div className="mt-2">
              {daysUntilChange > 0 ? (
                <div className="mb-4">
                  <p className="text-sm text-yellow-500 mb-2">
                    You can change your username again in {daysUntilChange} days.
                  </p>
                  <button 
                    onClick={() => setIsEditingUsername(false)}
                    className="text-xs text-gray-500 hover:text-white underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className={`flex items-center w-full bg-white/5 border rounded-xl px-4 py-3 mb-2 transition-colors ${
                    usernameError ? 'border-red-500/50' : isAvailable === true ? 'border-green-500/30' : 'border-white/10 focus-within:border-white/20'
                  }`}>
                    <span className="text-gray-400 select-none mr-0.5">@</span>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => {
                        // Remove any @ that user might paste
                        const value = e.target.value.replace(/@/g, '');
                        setNewUsername(value);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="username"
                      className="bg-transparent border-none outline-none w-full text-white placeholder:text-gray-600 p-0"
                      autoFocus
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex items-center min-h-[20px] mb-3">
                    {isChecking ? (
                       <p className="text-xs text-gray-500 flex items-center gap-1.5">
                         <span className="w-2 h-2 border border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                         Checking availability...
                       </p>
                    ) : usernameError ? (
                      <p className="text-xs text-red-400">{usernameError}</p>
                    ) : isAvailable === true && newUsername.trim().length >= 3 ? (
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Available
                      </p>
                    ) : null}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveUsername}
                      disabled={!canSubmit}
                      className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? "Saving..." : "Save"}
                    </button>
                    <button 
                      onClick={() => setIsEditingUsername(false)}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-white/5 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-3">
                    Usernames can only be changed once every 30 days.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div>
              <p className="text-white text-lg font-medium">{username || "Not set"}</p>
              <p className="text-xs text-gray-600 mt-1">
                {username 
                  ? "Others can use this to send you funds." 
                  : "Set a username to make it easier to receive funds."}
              </p>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Email</p>
          <p className="text-white">{userEmail || "Not set"}</p>
        </div>

        {/* Wallet Address */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Wallet address</p>
          <p className="text-white font-mono text-sm">
            {walletAddress ? formatAddress(walletAddress) : "0x1234...5678"}
          </p>
          <p className="text-xs text-gray-600 mt-2">Read-only. Managed by your login method.</p>
        </div>

        {/* Fiat Provider */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Fiat provider</p>
          <p className="text-white">Connected (Demo)</p>
          <p className="text-xs text-gray-600 mt-2">Enables deposits and withdrawals in your local currency.</p>
        </div>
      </section>

      {/* Log out */}
      <section className="mt-12 pt-8 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          Log out
        </button>
      </section>
    </div>
  );
}
