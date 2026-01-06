"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0F52FB] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full py-8 animate-fade-in">
      {/* Header */}
      <section className="mb-8">
        <h1 className="text-4xl font-ttbold text-black tracking-tight mb-2">
          Settings
        </h1>
        <p className="text-gray-500">Manage your account and preferences</p>
      </section>

      {/* Account Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-black mb-3">Account</h2>
        
        <div className="bg-gray-50 rounded-3xl p-6 space-y-4">
          {/* Profile Info */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0F52FB] to-[#0a3eb8] flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {user?.firstName?.charAt(0) || user?.primaryEmailAddress?.emailAddress?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <p className="font-semibold text-black">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.firstName || "User"}
                </p>
                <p className="text-sm text-gray-500">
                  {user?.primaryEmailAddress?.emailAddress || user?.primaryPhoneNumber?.phoneNumber}
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              Edit Profile
            </button>
          </div>

          {/* Email */}
          {user?.primaryEmailAddress && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Email Address</p>
                <p className="text-sm text-gray-500">{user.primaryEmailAddress.emailAddress}</p>
              </div>
              <div className="flex items-center gap-2">
                {user.primaryEmailAddress.verification?.status === "verified" && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
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
                <p className="text-sm font-medium text-black">Phone Number</p>
                <p className="text-sm text-gray-500">{user.primaryPhoneNumber.phoneNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                {user.primaryPhoneNumber.verification?.status === "verified" && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    Verified
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Preferences Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-black mb-3">Preferences</h2>
        
        <div className="bg-gray-50 rounded-3xl p-6 space-y-4">
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black">Push Notifications</p>
              <p className="text-sm text-gray-500">Get notified about transactions and updates</p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationsEnabled ? "bg-[#0F52FB]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Email Updates Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-black">Email Updates</p>
              <p className="text-sm text-gray-500">Receive product updates and tips</p>
            </div>
            <button
              onClick={() => setEmailUpdates(!emailUpdates)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailUpdates ? "bg-[#0F52FB]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailUpdates ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Risk Tolerance */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Risk Tolerance</p>
                <p className="text-sm text-gray-500">Adjust how your money behaves</p>
              </div>
              <Link
                href="/configure"
                className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Configure
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-black mb-3">Security</h2>
        
        <div className="bg-gray-50 rounded-3xl p-6 space-y-4">
          <Link
            href="/security"
            className="flex items-center justify-between group"
          >
            <div>
              <p className="text-sm font-medium text-black group-hover:text-[#0F52FB] transition-colors">
                Security Settings
              </p>
              <p className="text-sm text-gray-500">Manage authentication and security</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#0F52FB] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 text-red-600 hover:text-red-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section>
        <h2 className="text-lg font-semibold text-black mb-3">About</h2>
        
        <div className="bg-gray-50 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">App Version</p>
            <p className="text-sm font-medium text-black">1.0.0</p>
          </div>
          
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <Link href="/help" className="flex items-center justify-between group">
              <p className="text-sm text-gray-700 group-hover:text-[#0F52FB] transition-colors">Help Center</p>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#0F52FB] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link href="/legal" className="flex items-center justify-between group">
              <p className="text-sm text-gray-700 group-hover:text-[#0F52FB] transition-colors">Legal & Privacy</p>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#0F52FB] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <a 
              href="mailto:support@yuki.finance" 
              className="flex items-center justify-between group"
            >
              <p className="text-sm text-gray-700 group-hover:text-[#0F52FB] transition-colors">Contact Support</p>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#0F52FB] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
