"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const RESERVED_USERNAMES = [
  "admin", "root", "support", "help", "yuki", "system", "wallet",
  "api", "www", "mail", "ftp", "localhost", "webmaster", "postmaster",
  "hostmaster", "info", "contact", "abuse", "security", "privacy"
];

async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const response = await fetch("/api/user/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: username.toLowerCase(), type: "username" }),
      credentials: "include",
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return !data.exists;
  } catch {
    return false;
  }
}

export default function SetupPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isLoaded, isSignedIn, router]);
  
  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      setIsChecking(false);
      setError(null);
      return;
    }
    
    // Basic validation
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Only letters, numbers, and underscores allowed");
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }
    
    if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
      setError("This username is reserved");
      setIsAvailable(false);
      setIsChecking(false);
      return;
    }
    
    setError(null);
    setIsChecking(true);
    setIsAvailable(null);
    
    const timer = setTimeout(async () => {
      const available = await checkUsernameAvailability(username);
      setIsAvailable(available);
      setIsChecking(false);
      if (!available) {
        setError("Username is already taken");
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAvailable || !username || username.length < 3) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch("/api/auth/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to save username");
      }
      
      setIsSuccess(true);
      
      // Redirect to dashboard after brief delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save username");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f12]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[#e1a8f0] rounded-full animate-spin" />
      </div>
    );
  }
  
  // Not signed in - will redirect
  if (!isSignedIn) {
    return null;
  }
  
  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[#0f0f12]">
        {/* Subtle brand glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[300px] -right-[300px] w-[600px] h-[600px] rounded-full bg-[#e1a8f0]/[0.04]" />
          <div className="absolute -bottom-[200px] -left-[200px] w-[400px] h-[400px] rounded-full bg-[#e1a8f0]/[0.02]" />
        </div>
        
        <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-12 relative z-10 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-20 h-20 rounded-full bg-[#e1a8f0]/10 flex items-center justify-center mx-auto mb-6 border border-[#e1a8f0]/20">
              <svg 
                className="w-10 h-10 text-[#e1a8f0]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-white mb-2">Welcome, @{username}!</h1>
            <p className="text-white/50 mb-8">Your account is all set up. Taking you to the dashboard...</p>
            <div className="w-8 h-8 border-2 border-white/20 border-t-[#e1a8f0] rounded-full animate-spin mx-auto" />
          </motion.div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[#0f0f12]">
      {/* Subtle brand glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[300px] -right-[300px] w-[600px] h-[600px] rounded-full bg-[#e1a8f0]/[0.04]" />
        <div className="absolute -bottom-[200px] -left-[200px] w-[400px] h-[400px] rounded-full bg-[#e1a8f0]/[0.02]" />
      </div>

      <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-12 relative z-10">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/images/Logo.svg"
            alt="Yuki Logo"
            width={80}
            height={32}
            className="transition-transform duration-200 hover:scale-105"
          />
        </div>

        {/* Setup Card */}
        <div>
          <Card>
            <CardHeader className="space-y-2 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e1a8f0]" />
                <span className="text-xs text-white/40 uppercase tracking-widest">
                  Final Step
                </span>
              </div>
              <CardTitle className="text-3xl sm:text-4xl">
                Choose Username
              </CardTitle>
              <CardDescription className="text-base">
                This is how others will find and pay you on Yuki
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="username" className="text-white/70 block">Username</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">@</span>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                      placeholder="username"
                      className="pl-9 pr-10"
                      maxLength={15}
                      autoFocus
                      disabled={isSaving}
                      required
                    />
                    
                    {/* Status indicator */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isChecking && (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-[#e1a8f0] rounded-full animate-spin" />
                      )}
                      {!isChecking && isAvailable === true && (
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {!isChecking && isAvailable === false && (
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  {/* Requirements */}
                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${username.length >= 3 ? 'bg-green-400' : 'bg-white/20'}`} />
                      <span className={`text-xs transition-colors ${username.length >= 3 ? 'text-white/60' : 'text-white/30'}`}>
                        3+ chars
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isAvailable === true ? 'bg-green-400' : isAvailable === false ? 'bg-red-400' : 'bg-white/20'}`} />
                      <span className={`text-xs transition-colors ${isAvailable === true ? 'text-white/60' : isAvailable === false ? 'text-red-400/80' : 'text-white/30'}`}>
                        {isAvailable === false ? 'Unavailable' : 'Available'}
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 bg-red-500/10 rounded-xl border border-red-500/20"
                  >
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  disabled={isSaving || !isAvailable || username.length < 3} 
                  className="w-full" 
                  size="lg"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-[#1a0a1f]/30 border-t-[#1a0a1f] rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-white/25 mt-8 text-center">
          You can change your username once every 30 days
        </p>
      </div>
    </div>
  );
}
