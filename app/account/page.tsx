"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Reserved usernames to simulate "taken" status
const RESERVED_USERNAMES = [
  "@admin",
  "@yuki",
  "@support",
  "@help",
  "@system",
  "@wallet",
  "@haruxe",
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
  
  // Rate limiting state
  const [daysUntilChange, setDaysUntilChange] = useState(0);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      const email = localStorage.getItem("yuki_user_email");
      const wallet = localStorage.getItem("yuki_wallet_address");
      
      if (status !== "true") {
        router.push("/signin");
        return;
      }

      setIsLoggedIn(true);
      setUserEmail(email);
      setWalletAddress(wallet);

      // Fetch username status from server
      try {
        const res = await fetch(`/api/auth/username?userId=${MOCK_USER_ID}`);
        if (res.ok) {
          const data = await res.json();
          setUsername(data.username);
          
          if (data.lastChanged) {
            localStorage.setItem("yuki_username_last_changed", new Date(data.lastChanged).getTime().toString());
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
    localStorage.removeItem("yuki_username");
    localStorage.removeItem("yuki_username_last_changed");
    window.dispatchEvent(new Event("yuki_login_update"));
    router.push("/");
  };

  const checkAvailability = async (name: string): Promise<boolean> => {
    // Basic format check before API call
    if (name.length < 4) return true; // Let validation handle length
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (RESERVED_USERNAMES.includes(name.toLowerCase())) {
      if (name === username) return true;
      return false;
    }
    
    return true;
  };

  // Debounced availability check effect
  useEffect(() => {
    if (!isEditingUsername || !newUsername) {
      setIsChecking(false);
      setUsernameError("");
      return;
    }

    // Don't check if user just typed @ or nothing
    if (newUsername.trim() === "") return;

    let validUsername = "@" + newUsername.trim();

    // Only check if basic format looks okay (alphanumeric check)
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername.trim())) {
       // Let the user keep typing without error until submit or obvious invalid char
       return; 
    }

    setIsChecking(true);
    setUsernameError("");

    const timer = setTimeout(async () => {
      try {
        const isAvailable = await checkAvailability(validUsername);
        if (!isAvailable) {
          setUsernameError("That username is already taken");
        } else {
          setUsernameError("");
        }
      } catch (err) {
        // Ignore errors during live check
      } finally {
        setIsChecking(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [newUsername, isEditingUsername, username]);

  const handleSaveUsername = async () => {
    // Basic validation
    let validUsername = "@" + newUsername.trim();
    
    if (validUsername.length < 4) {
      setUsernameError("Username must be at least 3 characters long");
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername.trim())) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return;
    }

    // If currently checking, wait? Or just rely on previous result?
    // We'll do a final check to be safe.
    setIsChecking(true);
    const isAvailable = await checkAvailability(validUsername);
    if (!isAvailable) {
      setUsernameError("That username is already taken");
      setIsChecking(false);
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
        setIsChecking(false);
        return;
      }

      const now = Date.now();
      localStorage.setItem("yuki_username", validUsername);
      localStorage.setItem("yuki_username_last_changed", now.toString());
      
      setUsername(validUsername);
      setIsEditingUsername(false);
      setUsernameError("");
      window.dispatchEvent(new Event("yuki_login_update"));
    } catch (error) {
      setUsernameError("Network error. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveUsername();
    } else if (e.key === 'Escape') {
      setIsEditingUsername(false);
    }
  };

  const startEditingUsername = async () => {
    setIsChecking(true);
    // Fetch latest status from server before allowing edit
    try {
      const res = await fetch(`/api/auth/username?userId=${MOCK_USER_ID}`);
      if (res.ok) {
        const data = await res.json();
        
        if (data.lastChanged) {
          const lastChangedDate = new Date(data.lastChanged).getTime();
          const daysSinceChange = (Date.now() - lastChangedDate) / (1000 * 60 * 60 * 24);
          
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
      console.error("Failed to check rate limit");
    } finally {
      setIsChecking(false);
      // Initialize WITHOUT the @ sign for editing
      setNewUsername(username ? username.replace(/^@/, '') : "");
      setIsEditingUsername(true);
      setUsernameError("");
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

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
                {isChecking ? "Checking..." : (username ? "Change" : "Set username")}
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
                    usernameError ? 'border-red-500/50' : 'border-white/10 focus-within:border-white/20'
                  }`}>
                    <span className="text-gray-400 select-none mr-0.5">@</span>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.replace(/^@/, ''))}
                      onKeyDown={handleKeyDown}
                      placeholder="username"
                      className="bg-transparent border-none outline-none w-full text-white placeholder:text-gray-600 p-0"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-between min-h-[20px] mb-3">
                    {isChecking ? (
                       <p className="text-xs text-gray-500 flex items-center gap-1.5">
                         <span className="w-2 h-2 border border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                         Checking availability...
                       </p>
                    ) : usernameError ? (
                      <p className="text-xs text-red-400">{usernameError}</p>
                    ) : (
                      <p className="text-xs text-green-500/0 user-select-none">Available</p> // spacer
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveUsername}
                      disabled={isChecking || !!usernameError || !newUsername}
                      className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setIsEditingUsername(false)}
                      className="px-4 py-2 bg-white/5 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
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
