"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

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
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const checkLoginStatus = () => {
      const status = localStorage.getItem("yuki_onboarding_complete");
      setIsLoggedIn(status === "true");
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
    setIsLoggedIn(false);
    setIsProfileOpen(false);
    window.dispatchEvent(new Event("yuki_login_update"));
  };

  return (
    <header
      className={`fixed top-7 w-full z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-dark-900/80 backdrop-blur-md border-white/5 py-3"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between">
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
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
                        <div className="text-fdfffc font-medium">Alex Thompson</div>
                        <div className="text-xs text-gray-500">0x71...3A9</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
                        <span className="font-medium text-sm">AT</span>
                    </div>
                 </button>

                 {/* Dropdown Menu */}
                 {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-white/10 rounded-lg shadow-xl py-1 animate-fade-in z-50">
                        <div className="px-4 py-2 border-b border-white/5 mb-1">
                            <p className="text-xs text-gray-500">Signed in as</p>
                            <p className="text-sm text-fdfffc truncate">Alex Thompson</p>
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
                <button className="px-4 py-2 text-gray-400 hover:text-fdfffc text-sm font-medium transition-colors duration-200 cursor-pointer">
                  Connect Wallet
                </button>
                <Link
                  href="/onboarding"
                  className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  <span>Start with Card</span>
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
        <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-4">
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
                        <div className="text-sm font-medium text-fdfffc">Alex Thompson</div>
                        <div className="text-xs text-gray-500">0x71...3A9</div>
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
                    href="/onboarding"
                    className="w-full px-4 py-3 bg-accent-primary text-white rounded-lg text-sm font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    >
                    Start with Card
                    </Link>
                    <button className="w-full px-4 py-3 bg-white/5 text-gray-300 hover:text-white rounded-lg text-sm font-medium border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                    Connect Wallet
                    </button>
                </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
