"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Activity", href: "/activity" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsProfileOpen(false);
  };

  // Get first letter for the simple profile icon
  const getInitial = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user?.primaryPhoneNumber?.phoneNumber) {
      return user.primaryPhoneNumber.phoneNumber.charAt(0);
    }
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Format phone for display
  const formatPhone = (phone: string | undefined) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  // Get display name
  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.primaryPhoneNumber?.phoneNumber) {
      return formatPhone(user.primaryPhoneNumber.phoneNumber);
    }
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress;
    }
    return "User";
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500`}
    >
  
      <div 
        className="absolute inset-0 bg-[#222528]"
        style={{ 
          opacity: scrolled ? 1 : 0,
          pointerEvents: "none",
        }}
      />
      
      <div className="mx-auto px-4 sm:px-6 py-3 relative z-10">
        <div className="flex items-center justify-between">
          {/* Left section: Logo and Desktop Navigation (nav options are now left aligned) */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/images/Yuki.svg"
                alt="Yuki Logo"
                width={80}
                height={32}
                className="h-6 w-auto transition-transform duration-300 group-hover:scale-105 invert"
              />
            </Link>

            {/* Desktop Navigation (immediately next to logo, left aligned) */}
            {isSignedIn && (
              <nav className="hidden md:flex items-center gap-1 ml-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive(item.href)
                        ? "bg-white/80 text-black"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-2">
            {isSignedIn ? (
              <>
                {/* Quick Actions */}
                <Link
                  href="/send"
                  className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                  title="Send Money"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Link>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                      <span className="text-xs font-semibold text-black">{getInitial()}</span>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-white/50 transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-full mt-2 w-64 bg-[#111]/95 backdrop-blur-xl rounded-2xl overflow-hidden"
                    >
                      {/* User Info */}
                      <div className="px-4 py-4 bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                            <span className="text-sm font-bold text-black">{getInitial()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {getDisplayName()}
                            </p>
                            {user?.primaryEmailAddress?.emailAddress && (
                              <p className="text-xs text-white/50 truncate">
                                {user.primaryEmailAddress.emailAddress}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <Link
                          href="/settings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link>

                        <Link
                          href="/help"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Help Center
                        </Link>

                        <Link
                          href="/legal"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Legal
                        </Link>
                      </div>
                      
                      <div className="py-2">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/login"
                  className="px-3 sm:px-5 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  Log In
                </Link>
                <Link
                  href="/login?su"
                  className="px-3 sm:px-5 py-2 bg-white hover:bg-white/90 text-black rounded-full text-sm font-medium transition-all duration-300"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={{
          height: isMobileMenuOpen ? "auto" : 0,
          opacity: isMobileMenuOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl overflow-hidden"
      >
        <div className="px-6 py-6">
          {isSignedIn && (
            <>
              {/* Navigation links */}
              <div className="space-y-1 mb-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-white text-black"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              <div className="pt-6 space-y-1">
                {/* User identity */}
                <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-white/5 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <span className="text-sm font-bold text-black">{getInitial()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {getDisplayName()}
                    </p>
                    {user?.primaryEmailAddress?.emailAddress && (
                      <p className="text-xs text-white/50 truncate">
                        {user.primaryEmailAddress.emailAddress}
                      </p>
                    )}
                  </div>
                </div>
                
                <Link
                  href="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>

                <Link
                  href="/help"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Help Center
                </Link>

                <Link
                  href="/legal"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Legal
                </Link>
                
                <div className="pt-4 mt-4">
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}

          {!isSignedIn && (
            <div className="flex flex-col gap-3">
              <Link
                href="/login?su"
                className="w-full py-3 bg-white text-black rounded-full text-sm font-medium text-center hover:bg-white/90 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className="w-full py-3 text-white/70 hover:text-white text-sm font-medium text-center hover:bg-white/10 rounded-full transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log In
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </header>
  );
}
