"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pt-24 pb-12 relative">
      {/* Ambient glow */}
      <motion.div
        animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#004BAD]/15 rounded-full blur-[150px] pointer-events-none"
      />

      <div className="max-w-[800px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <h1 
            className="font-finder text-4xl sm:text-5xl text-white tracking-tight mb-3"
            style={{ 
              WebkitFontSmoothing: "antialiased",
              textRendering: "geometricPrecision",
            }}
          >
            SETTINGS
          </h1>
          <p className="text-white/40">Manage your account and preferences</p>
        </motion.section>

        {/* Account Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h2 className="text-white/40 text-sm uppercase tracking-widest mb-4">Account</h2>
          
          <div className="bg-white/5 rounded-2xl p-6 space-y-5">
            {/* Profile Info */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                  <span className="text-xl font-bold text-black">
                    {user?.firstName?.charAt(0) || user?.primaryEmailAddress?.emailAddress?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.firstName || "User"}
                  </p>
                  <p className="text-sm text-white/40">
                    {user?.primaryEmailAddress?.emailAddress || user?.primaryPhoneNumber?.phoneNumber}
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-white hover:bg-white/20 transition-colors cursor-pointer">
                Edit Profile
              </button>
            </div>

            {/* Email */}
            {user?.primaryEmailAddress && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Email Address</p>
                  <p className="text-sm text-white/40">{user.primaryEmailAddress.emailAddress}</p>
                </div>
                <div className="flex items-center gap-2">
                  {user.primaryEmailAddress.verification?.status === "verified" && (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Phone */}
            {user?.primaryPhoneNumber && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Phone Number</p>
                  <p className="text-sm text-white/40">{user.primaryPhoneNumber.phoneNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  {user.primaryPhoneNumber.verification?.status === "verified" && (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* Preferences Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h2 className="text-white/40 text-sm uppercase tracking-widest mb-4">Preferences</h2>
          
          <div className="bg-white/5 rounded-2xl p-6 space-y-5">
            {/* Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Push Notifications</p>
                <p className="text-sm text-white/40">Get notified about transactions and updates</p>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  notificationsEnabled ? "bg-white" : "bg-white/20"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                    notificationsEnabled ? "translate-x-6 bg-black" : "translate-x-1 bg-white/60"
                  }`}
                />
              </button>
            </div>

            {/* Email Updates Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Email Updates</p>
                <p className="text-sm text-white/40">Receive product updates and tips</p>
              </div>
              <button
                onClick={() => setEmailUpdates(!emailUpdates)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  emailUpdates ? "bg-white" : "bg-white/20"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                    emailUpdates ? "translate-x-6 bg-black" : "translate-x-1 bg-white/60"
                  }`}
                />
              </button>
            </div>

            {/* Risk Tolerance */}
            <div className="pt-5 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Risk Tolerance</p>
                  <p className="text-sm text-white/40">Adjust how your money behaves</p>
                </div>
                <Link
                  href="/configure"
                  className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-white hover:bg-white/20 transition-colors"
                >
                  Configure
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Security Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h2 className="text-white/40 text-sm uppercase tracking-widest mb-4">Security</h2>
          
          <div className="bg-white/5 rounded-2xl p-6 space-y-5">
            <Link
              href="/security"
              className="flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-medium text-white group-hover:text-white/80 transition-colors">
                  Security Settings
                </p>
                <p className="text-sm text-white/40">Manage authentication and security</p>
              </div>
              <svg className="w-5 h-5 text-white/30 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <div className="pt-5 border-t border-white/10">
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </motion.section>

        {/* About Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-white/40 text-sm uppercase tracking-widest mb-4">About</h2>
          
          <div className="bg-white/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/50">App Version</p>
              <p className="text-sm font-medium text-white">1.0.0</p>
            </div>
            
            <div className="pt-5 border-t border-white/10 space-y-4">
              <Link href="/help" className="flex items-center justify-between group">
                <p className="text-sm text-white/70 group-hover:text-white transition-colors">Help Center</p>
                <svg className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <Link href="/legal" className="flex items-center justify-between group">
                <p className="text-sm text-white/70 group-hover:text-white transition-colors">Legal & Privacy</p>
                <svg className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <a 
                href="mailto:support@yuki.finance" 
                className="flex items-center justify-between group"
              >
                <p className="text-sm text-white/70 group-hover:text-white transition-colors">Contact Support</p>
                <svg className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
