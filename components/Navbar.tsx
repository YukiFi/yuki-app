"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAccount, useDisconnect } from "wagmi";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Activity", href: "/activity" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const checkLoginStatus = async () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      const method = localStorage.getItem("yuki_auth_method");
      const email = localStorage.getItem("yuki_user_email");
      
      setIsLoggedIn(status === "true");
      setAuthMethod(method);
      setUserEmail(email);
      
      // Fetch username from server if logged in
      if (status === "true" && email) {
        try {
          const res = await fetch(`/api/auth/username?email=${encodeURIComponent(email)}`);
          if (res.ok) {
            const data = await res.json();
            setUsername(data.username || null);
          } else {
            setUsername(null);
          }
        } catch {
          setUsername(null);
        }
      } else {
        setUsername(null);
      }
    };

    checkLoginStatus();
    window.addEventListener("yuki_login_update", checkLoginStatus);
    window.addEventListener("scroll", handleScroll);

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("yuki_login_update", checkLoginStatus);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("yuki_onboarding_complete");
    localStorage.removeItem("yuki_auth_method");
    localStorage.removeItem("yuki_user_email");
    localStorage.removeItem("yuki_wallet_address");
    localStorage.removeItem("yuki_balances");
    localStorage.removeItem("yuki_username");
    
    if (isConnected) {
      disconnect();
    }
    
    setIsLoggedIn(false);
    setIsProfileOpen(false);
    window.dispatchEvent(new Event("yuki_login_update"));
  };

  // Get first letter for the simple profile icon
  const getInitial = () => {
    if (username) {
      return username.replace('@', '').charAt(0).toUpperCase();
    }
    if (userEmail) {
      return userEmail.charAt(0).toUpperCase();
    }
    if (address) {
      return address.charAt(2).toUpperCase();
    }
    return "U";
  };

  // Format address for display in account section
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-dark-900/80 backdrop-blur-md border-white/5 py-3"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="max-w-2xl mx-auto px-6">
        <div className="flex items-center justify-between relative">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/images/logo-blue.png"
              alt="Yuki Logo"
              width={32}
              height={32}
              className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-bold text-xl tracking-tight text-fdfffc">
              Yuki
            </span>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              demo
            </span>
          </Link>

          {/* Desktop Navigation - Absolutely centered */}
          <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-400 hover:text-fdfffc text-sm font-medium transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center">
            {isLoggedIn ? (
              <div className="relative" ref={profileRef}>
                {/* Simple profile button - muted gray, just initial */}
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-9 h-9 rounded-lg bg-white/[0.03] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
                >
                  <span className="text-sm font-medium">{getInitial()}</span>
                </button>

                {/* Dropdown Menu - clean, minimal */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-3 w-64 bg-[#1a1a1a] rounded-lg shadow-2xl animate-fade-in z-50 overflow-hidden">
                    
                    {/* Account Section */}
                    <Link
                      href="/account"
                      onClick={() => setIsProfileOpen(false)}
                      className="block hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="px-5 py-3 bg-white/[0.02]">
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Account</p>
                      </div>
                      <div className="px-5 py-4 space-y-1.5">
                        {username && (
                          <p className="text-sm text-white font-medium">{username}</p>
                        )}
                        {userEmail && (
                          <p className="text-xs text-gray-500">{userEmail}</p>
                        )}
                        {address && (
                          <p className="text-xs text-gray-500 font-mono">{formatAddress(address)}</p>
                        )}
                        <p className="text-xs text-gray-600">Connected (Demo)</p>
                      </div>
                    </Link>
                    
                    <div className="h-px bg-white/5" />
                    
                    {/* Security */}
                    <Link
                      href="/security"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-5 py-3.5 text-sm text-gray-400 hover:text-white hover:bg-white/[0.03] transition-colors"
                    >
                      Security
                    </Link>
                    
                    {/* Activity */}
                    <Link
                      href="/activity"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-5 py-3.5 text-sm text-gray-400 hover:text-white hover:bg-white/[0.03] transition-colors"
                    >
                      Activity
                    </Link>
                    
                    <div className="h-px bg-white/5" />
                    
                    {/* Documents */}
                    <Link
                      href="/documents"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-5 py-3.5 text-sm text-gray-400 hover:text-white hover:bg-white/[0.03] transition-colors"
                    >
                      Documents
                    </Link>
                    
                    {/* Help */}
                    <Link
                      href="/help"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-5 py-3.5 text-sm text-gray-400 hover:text-white hover:bg-white/[0.03] transition-colors"
                    >
                      Help
                    </Link>
                    
                    <div className="h-px bg-white/5" />
                    
                    {/* Log out - separated, last */}
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-5 py-3.5 text-sm text-gray-500 hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="px-4 py-2 text-gray-400 hover:text-fdfffc text-sm font-medium transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/signin"
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-fdfffc p-2 hover:bg-white/5 rounded-md transition-colors cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`block h-0.5 w-6 bg-fdfffc transition-all duration-300 ${
                  isMobileMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              ></span>
              <span
                className={`block h-0.5 w-6 bg-fdfffc transition-all duration-300 ${
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              ></span>
              <span
                className={`block h-0.5 w-6 bg-fdfffc transition-all duration-300 ${
                  isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden bg-dark-900/95 backdrop-blur-xl border-b border-white/5 transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Navigation links */}
          <div className="space-y-1 mb-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-3 text-gray-400 hover:text-fdfffc text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {isLoggedIn ? (
            <div className="border-t border-white/5 pt-6 space-y-1">
              {/* Account info */}
              <div className="pb-4 mb-2">
                {username && (
                  <p className="text-sm text-white font-medium mb-1">{username}</p>
                )}
                {userEmail && (
                  <p className="text-sm text-gray-500">{userEmail}</p>
                )}
                {address && (
                  <p className="text-xs text-gray-600 font-mono mt-1">{formatAddress(address)}</p>
                )}
              </div>
              
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-3 text-gray-400 hover:text-white text-sm"
              >
                Account
              </Link>
              <Link
                href="/security"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-3 text-gray-400 hover:text-white text-sm"
              >
                Security
              </Link>
              <Link
                href="/activity"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-3 text-gray-400 hover:text-white text-sm"
              >
                Activity
              </Link>
              <Link
                href="/documents"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-3 text-gray-400 hover:text-white text-sm"
              >
                Documents
              </Link>
              <Link
                href="/help"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-3 text-gray-400 hover:text-white text-sm"
              >
                Help
              </Link>
              
              <div className="pt-4 mt-4 border-t border-white/5">
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-3 text-gray-500 hover:text-white text-sm cursor-pointer"
                >
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-white/5 pt-6 flex flex-col gap-3">
              <Link
                href="/signin"
                className="w-full py-3 bg-white text-black rounded-lg text-sm font-medium text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Get Started
              </Link>
              <Link
                href="/signin"
                className="w-full py-3 text-gray-400 hover:text-white text-sm font-medium text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
