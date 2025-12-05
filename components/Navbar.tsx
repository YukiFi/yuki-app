"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAccount, useDisconnect } from "wagmi";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Vaults", href: "/vaults" },
  { name: "Portfolio", href: "/portfolio" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      const method = localStorage.getItem("yuki_auth_method");
      const email = localStorage.getItem("yuki_user_email");
      setIsLoggedIn(status === "true");
      setAuthMethod(method);
      setUserEmail(email);
    };

    // Check initially
    checkLoginStatus();

    // Listen for custom event to update state immediately
    window.addEventListener("yuki_login_update", checkLoginStatus);
    window.addEventListener("scroll", handleScroll);

    // Click outside handler
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

  // Logout function for demo purposes
  const handleLogout = () => {
    localStorage.removeItem("yuki_onboarding_complete");
    localStorage.removeItem("yuki_auth_method");
    localStorage.removeItem("yuki_user_email");
    localStorage.removeItem("yuki_wallet_address");
    localStorage.removeItem("yuki_balances");
    
    // Disconnect wallet if connected
    if (isConnected) {
      disconnect();
    }
    
    setIsLoggedIn(false);
    setIsProfileOpen(false);
    window.dispatchEvent(new Event("yuki_login_update"));
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  // Get display name based on auth method
  const getDisplayName = () => {
    if (authMethod === "wallet" && address) {
      return formatAddress(address);
    }
    if (authMethod === "email" && userEmail) {
      return userEmail.split("@")[0];
    }
    return "User";
  };

  // Get display subtitle
  const getDisplaySubtitle = () => {
    if (authMethod === "wallet" && address) {
      return formatAddress(address);
    }
    if (authMethod === "email" && userEmail) {
      return userEmail;
    }
    return "";
  };

  // Get initials for avatar
  const getInitials = () => {
    if (authMethod === "wallet" && address) {
      return address.slice(2, 4).toUpperCase();
    }
    if (authMethod === "email" && userEmail) {
      return userEmail.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header
      className={`fixed top-7 w-full z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-dark-900/80 backdrop-blur-md border-white/5 py-3"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6">
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
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="relative" ref={profileRef}>
                 <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                 >
                    <div className="text-sm text-right">
                        <div className="text-fdfffc font-medium">{getDisplayName()}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          {authMethod === "wallet" && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          )}
                          {authMethod === "email" && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                          )}
                          {getDisplaySubtitle()}
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
                        <span className="font-medium text-sm">{getInitials()}</span>
                    </div>
                 </button>

                 {/* Dropdown Menu */}
                 {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-dark-800 border border-white/10 rounded-lg shadow-xl py-1 animate-fade-in z-50">
                        <div className="px-4 py-2 border-b border-white/5 mb-1">
                            <p className="text-xs text-gray-500">Signed in with {authMethod === "wallet" ? "Wallet" : "Email"}</p>
                            <p className="text-sm text-fdfffc truncate">{getDisplaySubtitle()}</p>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors"
                        >
                            Logout
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
                  className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  <span>Get Started</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
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
          isMobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block py-2 text-gray-400 hover:text-fdfffc text-base font-medium border-b border-white/5"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            {isLoggedIn ? (
                <>
                    <div className="px-4 py-2 border-b border-white/5 mb-2">
                        <div className="text-sm font-medium text-fdfffc">{getDisplayName()}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          {authMethod === "wallet" && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          )}
                          {authMethod === "email" && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                          )}
                          {getDisplaySubtitle()}
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 bg-white/5 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium border border-white/10 hover:bg-white/10 transition-all cursor-pointer text-left"
                    >
                        Logout
                    </button>
                </>
            ) : (
                <>
                    <Link
                    href="/signin"
                    className="w-full px-4 py-3 bg-accent-primary text-white rounded-lg text-sm font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    >
                    Get Started
                    </Link>
                    <Link
                    href="/signin"
                    className="w-full px-4 py-3 bg-white/5 text-gray-300 hover:text-white rounded-lg text-sm font-medium border border-white/10 hover:bg-white/10 transition-all cursor-pointer text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                    >
                    Sign In
                    </Link>
                </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
