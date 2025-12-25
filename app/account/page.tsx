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
      
      if (status !== "true" || !email) {
        router.push("/signin");
        return;
      }

      setIsLoggedIn(true);
      setUserEmail(email);
      setWalletAddress(wallet);

      // Fetch username and rate limit info from server
      try {
        const res = await fetch(`/api/auth/username?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.username) {
            setUsername(data.username);
          } else {
            setUsername(null);
          }
          
          // Calculate days until change allowed
          if (data.lastChanged) {
            const lastChangedTimestamp = new Date(data.lastChanged).getTime();
            const daysSinceChange = (Date.now() - lastChangedTimestamp) / (1000 * 60 * 60 * 24);
            
            if (daysSinceChange < 30) {
              setDaysUntilChange(Math.ceil(30 - daysSinceChange));
            } else {
              setDaysUntilChange(0);
            }
          } else {
            setDaysUntilChange(0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch username info", error);
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
    localStorage.removeItem("yuki_comfort_level");
    window.dispatchEvent(new Event("yuki_login_update"));
    router.push("/");
  };

  const checkAvailability = async (nameWithoutAt: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const normalizedName = nameWithoutAt.toLowerCase();
    const currentUsernameWithoutAt = username?.replace(/^@/, '').toLowerCase();
    
    if (normalizedName === currentUsernameWithoutAt) {
      return true;
    }
    
    if (RESERVED_USERNAMES.includes(normalizedName)) {
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    if (!isEditingUsername) {
      setIsChecking(false);
      setUsernameError("");
      setIsAvailable(null);
      return;
    }

    const trimmedName = newUsername.trim();
    
    if (!trimmedName || trimmedName.length < 3) {
      setIsChecking(false);
      setUsernameError("");
      setIsAvailable(null);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
      setIsChecking(false);
      setUsernameError("Only letters, numbers, and underscores allowed");
      setIsAvailable(false);
      return;
    }

    setIsChecking(true);
    setUsernameError("");
    setIsAvailable(null);
    
    const currentCheckId = ++checkIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const available = await checkAvailability(trimmedName);
        
        if (currentCheckId === checkIdRef.current) {
          setIsAvailable(available);
          if (!available) {
            setUsernameError("That username is already taken");
          } else {
            setUsernameError("");
          }
          setIsChecking(false);
        }
      } catch {
        if (currentCheckId === checkIdRef.current) {
          setIsChecking(false);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [newUsername, isEditingUsername, username]);

  const handleSaveUsername = async () => {
    if (!userEmail) {
      setUsernameError("Not logged in");
      return;
    }

    const trimmedName = newUsername.trim();
    const validUsername = "@" + trimmedName;
    
    if (trimmedName.length < 3) {
      setUsernameError("Username must be at least 3 characters long");
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return;
    }

    if (isAvailable === false) {
      setUsernameError("That username is already taken");
      return;
    }

    setIsSubmitting(true);
    setUsernameError("");

    try {
      const available = await checkAvailability(trimmedName);
      if (!available) {
        setUsernameError("That username is already taken");
        setIsSubmitting(false);
        setIsAvailable(false);
        return;
      }
    } catch {
      setUsernameError("Failed to verify availability. Please try again.");
      setIsSubmitting(false);
      return;
    }
    
    // Server-side update using email
    try {
      const res = await fetch("/api/auth/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: userEmail,
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
      setUsername(validUsername);
      setIsEditingUsername(false);
      setUsernameError("");
      setNewUsername("");
      setIsAvailable(null);
      window.dispatchEvent(new Event("yuki_login_update"));
    } catch {
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
    if (!userEmail) return;
    
    setIsChecking(true);
    
    // Fetch rate limit info from server
    try {
      const res = await fetch(`/api/auth/username?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        
        if (data.lastChanged) {
          const lastChangedTimestamp = new Date(data.lastChanged).getTime();
          const daysSinceChange = (Date.now() - lastChangedTimestamp) / (1000 * 60 * 60 * 24);
          
          if (daysSinceChange < 30) {
            setDaysUntilChange(Math.ceil(30 - daysSinceChange));
          } else {
            setDaysUntilChange(0);
          }
        } else {
          setDaysUntilChange(0);
        }
      } else {
        setDaysUntilChange(0);
      }
    } catch (error) {
      console.error("Failed to check rate limit from server");
      setDaysUntilChange(0);
    }
    
    setIsChecking(false);
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
    <div className="w-full py-12 animate-fade-in">
      {/* Header */}
      <section className="mb-12">
        <h1 className="text-2xl font-medium text-white mb-2">Account</h1>
        <p className="text-sm text-gray-500">Manage your profile and settings.</p>
      </section>

      {/* Username */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">Username</h2>
          {!isEditingUsername && (
            <button 
              onClick={startEditingUsername}
              disabled={isChecking || daysUntilChange > 0}
              className={`text-xs transition-colors cursor-pointer ${
                daysUntilChange > 0 
                  ? "text-gray-600 cursor-not-allowed" 
                  : "text-[#0F52FB]/70 hover:text-[#0F52FB] disabled:opacity-50"
              }`}
            >
              {isChecking ? "Loading..." : (username ? "Change" : "Set username")}
            </button>
          )}
        </div>
        
        {isEditingUsername ? (
          <div>
            {daysUntilChange > 0 ? (
              <div>
                <p className="text-sm text-yellow-500/80 mb-3">
                  You can change your username again in {daysUntilChange} days.
                </p>
                <button 
                  onClick={() => setIsEditingUsername(false)}
                  className="text-xs text-gray-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className={`flex items-center w-full bg-white/[0.02] border rounded-xl px-4 py-3 mb-2 transition-colors ${
                  usernameError ? 'border-red-500/50' : isAvailable === true ? 'border-[#0F52FB]/30' : 'border-white/10 focus-within:border-white/20'
                }`}>
                  <span className="text-gray-500 select-none mr-0.5">@</span>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => {
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
                      Checking...
                    </p>
                  ) : usernameError ? (
                    <p className="text-xs text-red-400">{usernameError}</p>
                  ) : isAvailable === true && newUsername.trim().length >= 3 ? (
                    <p className="text-xs text-[#0F52FB] flex items-center gap-1">
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
                    className="px-4 py-2 bg-[#0F52FB] text-white text-sm font-medium rounded-lg hover:bg-[#0F52FB]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                  <button 
                    onClick={() => setIsEditingUsername(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-white/5 text-gray-400 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
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
            <p className="text-white text-lg">{username || "Not set"}</p>
            <p className="text-xs text-gray-600 mt-1">
              {username 
                ? "Others can use this to send you funds." 
                : "Set a username to make it easier to receive funds."}
            </p>
            {daysUntilChange > 0 && username && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Can change in {daysUntilChange} {daysUntilChange === 1 ? 'day' : 'days'}
              </p>
            )}
          </div>
        )}
      </section>

      <div className="border-t border-white/5 my-8" />

      {/* Email */}
      <section className="mb-8">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">Email</h2>
        <p className="text-white">{userEmail || "Not set"}</p>
      </section>

      {/* Wallet Address */}
      <section className="mb-8">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">Wallet Address</h2>
        <p className="text-white font-mono text-sm">
          {walletAddress ? formatAddress(walletAddress) : "0x1234...5678"}
        </p>
        <p className="text-xs text-gray-600 mt-1">Managed by your login method.</p>
      </section>

      {/* Fiat Provider */}
      <section className="mb-8">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">Fiat Provider</h2>
        <p className="text-white">Connected</p>
        <p className="text-xs text-gray-600 mt-1">Enables deposits and withdrawals.</p>
      </section>

      <div className="border-t border-white/5 my-8" />

      {/* Links */}
      <section className="space-y-4">
        <Link 
          href="/security"
          className="flex items-center justify-between py-3 text-gray-400 hover:text-white transition-colors cursor-pointer group"
        >
          <span className="text-sm">Security</span>
          <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link 
          href="/help"
          className="flex items-center justify-between py-3 text-gray-400 hover:text-white transition-colors cursor-pointer group"
        >
          <span className="text-sm">Help</span>
          <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link 
          href="/documents"
          className="flex items-center justify-between py-3 text-gray-400 hover:text-white transition-colors cursor-pointer group"
        >
          <span className="text-sm">Legal</span>
          <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      <div className="border-t border-white/5 my-8" />

      {/* Log out */}
      <section>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
        >
          Log out
        </button>
      </section>
    </div>
  );
}
