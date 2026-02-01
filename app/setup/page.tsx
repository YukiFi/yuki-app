"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSignerStatus, useSmartAccountClient } from "@account-kit/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const RESERVED_USERNAMES = [
  "admin", "root", "support", "help", "yuki", "system", "wallet",
  "api", "www", "mail", "ftp", "localhost", "webmaster", "postmaster",
  "hostmaster", "info", "contact", "abuse", "security", "privacy"
];

const ease = [0.22, 1, 0.36, 1] as const;

async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const response = await fetch("/api/user/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: username.toLowerCase(), type: "username" }),
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
  const { isConnected, isInitializing } = useSignerStatus();
  const { client } = useSmartAccountClient({});

  // Get wallet address from smart account client
  const walletAddress = client?.account?.address;

  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect if not connected
  useEffect(() => {
    if (!isInitializing && !isConnected) {
      router.push("/login");
    }
  }, [isInitializing, isConnected, router]);

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
      setError("Only letters, numbers, and underscores");
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }

    if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
      setError("Username is reserved");
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
        setError("Username is taken");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAvailable || !username || username.length < 3 || !walletAddress) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, walletAddress }),
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
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f]">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
      </div>
    );
  }

  // Not connected - will redirect
  if (!isConnected) {
    return null;
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f] px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-7 h-7 text-white/80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-medium text-white mb-2">Welcome, @{username}</h1>
          <p className="text-white/50 text-sm mb-8">Your wallet is ready</p>
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0f] px-4">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease }}
        className="mb-12"
      >
        <Image
          src="/images/Logo.svg"
          alt="Yuki"
          width={80}
          height={32}
        />
      </motion.div>

      <div className="w-full max-w-[420px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease }}
        >
          <Card className="border-0 bg-white/[0.04] backdrop-blur-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.35)] rounded-[32px]">
            <CardHeader className="text-center pb-6 pt-8 px-8">
              <CardTitle className="text-2xl font-medium text-white mb-2">
                Your username
              </CardTitle>
              <CardDescription className="text-white/50 text-sm">
                How others will find you
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="username" className="text-white/60 text-sm font-normal">Username</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">@</span>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                      placeholder="username"
                      className="pl-9 pr-10 transition-all duration-250 focus:shadow-[0_0_0_2px_rgba(225,168,240,0.3)]"
                      maxLength={15}
                      autoFocus
                      disabled={isSaving}
                      required
                    />

                    {/* Status indicator */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isChecking && (
                        <div className="w-4 h-4 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
                      )}
                      {!isChecking && isAvailable === true && (
                        <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Validation message */}
                  {username.length >= 3 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, ease }}
                      className={`text-xs ${error ? 'text-red-400/80' : isAvailable ? 'text-white/40' : 'text-white/30'
                        }`}
                    >
                      {error || (isAvailable ? 'Available' : isChecking ? 'Checking...' : '')}
                    </motion.p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSaving || !isAvailable || username.length < 3}
                  className="w-full transition-all duration-250"
                  size="lg"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#1a0a1f]/30 border-t-[#1a0a1f] rounded-full animate-spin" />
                      Saving
                    </span>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4, ease }}
          className="text-xs text-white/20 mt-8 text-center"
        >
          You can change your username once every 30 days
        </motion.p>
      </div>
    </div>
  );
}
