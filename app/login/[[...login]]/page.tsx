"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSignerStatus,
  useUser as useAlchemyUser,
  useAuthenticate,
} from "@account-kit/react";
import { AlchemySignerStatus } from "@account-kit/signer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const BRAND_LAVENDER = "#e1a8f0";
const easeOut = [0.22, 1, 0.36, 1] as const;

function LoginContent() {
  const router = useRouter();

  // Alchemy authentication hooks
  const signerStatus = useSignerStatus();
  const { isConnected, isInitializing, status, isAuthenticating: signerAuthenticating } = signerStatus;
  const alchemyUser = useAlchemyUser();
  const { authenticate, isPending: isAuthenticating } = useAuthenticate();

  // Determine if we're waiting for OTP verification based on signer status
  const isAwaitingOtp = status === AlchemySignerStatus.AWAITING_EMAIL_AUTH ||
    status === AlchemySignerStatus.AWAITING_OTP_AUTH;

  // Local state for custom email OTP flow
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"input" | "verify" | "success">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);

  // Ref to track if error animation should play
  const errorRef = useRef<HTMLDivElement>(null);

  // Debug: Log signer status changes
  useEffect(() => {
    console.log("[Auth] Signer status changed:", status, signerStatus);
  }, [status, signerStatus]);

  // Automatically switch to verify step when signer is awaiting OTP
  useEffect(() => {
    if (isAwaitingOtp && step === "input") {
      console.log("[Auth] Signer is awaiting OTP, switching to verify step");
      setStep("verify");
      setResendCooldown(60);
    }
  }, [isAwaitingOtp, step]);

  // Redirect if already connected - but wait a moment to ensure state is stable
  useEffect(() => {
    if (!isConnected || isInitializing) return;

    // Show success state briefly before redirecting
    setStep("success");
    const timer = setTimeout(() => {
      router.push("/");
    }, 1000);

    return () => clearTimeout(timer);
  }, [isConnected, isInitializing, router]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (verificationCode.length === 6 && step === "verify") {
      handleVerifyCode();
    }
  }, [verificationCode, step]);

  // Trigger shake animation on error
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.classList.remove('animate-shake');
      // Force reflow
      void errorRef.current.offsetWidth;
      errorRef.current.classList.add('animate-shake');
    }
  }, [error]);

  // Show loading while Alchemy initializes
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f12]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-white/20 border-t-[#e1a8f0] rounded-full"
        />
      </div>
    );
  }

  // Already connected - show success state
  if (isConnected || step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f12]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#e1a8f0]/20 to-[#e1a8f0]/5 flex items-center justify-center"
          >
            <svg className="w-8 h-8 text-[#e1a8f0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/70"
          >
            Welcome back!
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      console.log("[Auth] Starting email authentication for:", email);
      console.log("[Auth] Current signer status:", status);

      // Use Alchemy's authenticate with email OTP
      const result = await authenticate({
        type: "email",
        email: email,
      });

      console.log("[Auth] Authentication initiated, result:", result);
      console.log("[Auth] Signer status after authenticate:", status);
    } catch (err: unknown) {
      console.error("[Auth] Error sending code:", err);

      let errorMessage = "Failed to send verification code. Please check your email and try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
        console.error("[Auth] Full error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      // Verify the OTP code with Alchemy
      await authenticate({
        type: "otp",
        otpCode: verificationCode,
      });

      // Success! Show passkey prompt after a brief delay
      setTimeout(() => {
        setShowPasskeyPrompt(true);
      }, 500);
    } catch (err: unknown) {
      console.error("Error verifying code:", err);
      const errorMessage = err instanceof Error ? err.message : "Invalid verification code";
      setError(errorMessage);
      setVerificationCode("");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to authenticate with existing passkey
      await authenticate({
        type: "passkey",
        createNew: false,
      });
    } catch (err: unknown) {
      console.error("Passkey auth error:", err);
      // If no existing passkey, offer to create one
      const errorMessage = err instanceof Error ? err.message : "No passkey found";
      setError(`${errorMessage}. Would you like to create one after logging in with email?`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePasskey = async () => {
    setLoading(true);
    setError(null);

    try {
      await authenticate({
        type: "passkey",
        createNew: true,
        username: email || "yuki-user",
      });

      setShowPasskeyPrompt(false);
    } catch (err: unknown) {
      console.error("Passkey creation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create passkey";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setError(null);

    try {
      await authenticate({
        type: "email",
        email: email,
      });
      setResendCooldown(60);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to resend code";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0f12] px-4 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#e1a8f0]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#c47de0]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOut }}
        className="mb-8 relative z-10"
      >
        <Image
          src="/images/Yuki.svg"
          alt="Yuki"
          width={64}
          height={64}
          priority
          className="drop-shadow-2xl"
        />
      </motion.div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
        >
          <Card className="border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="mx-auto mb-4 w-12 h-12 rounded-full bg-gradient-to-br from-[#e1a8f0]/20 to-[#e1a8f0]/5 flex items-center justify-center"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  style={{ color: BRAND_LAVENDER }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                </svg>
              </motion.div>
              <CardTitle className="text-3xl sm:text-4xl">
                {step === "input" ? "Welcome" : "Verify"}
              </CardTitle>
              <CardDescription className="text-base">
                {step === "input"
                  ? "Sign in to your smart wallet"
                  : `Enter the 6-digit code sent to ${email}`
                }
              </CardDescription>
            </CardHeader>

            <CardContent>
              <AnimatePresence mode="wait">
                {step === "input" ? (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    {/* Email input */}
                    <form onSubmit={handleSendCode} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white/70">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          autoFocus
                          className="transition-all duration-200 focus:scale-[1.01]"
                        />
                      </div>

                      <AnimatePresence>
                        {error && (
                          <motion.div
                            ref={errorRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 bg-red-500/10 rounded-xl border border-red-500/20"
                          >
                            <p className="text-sm text-red-400">{error}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        size="lg"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-[#1a0a1f]/30 border-t-[#1a0a1f] rounded-full"
                            />
                            Sending...
                          </span>
                        ) : (
                          "Continue with Email"
                        )}
                      </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0f0f12] px-2 text-white/40">or</span>
                      </div>
                    </div>

                    {/* Passkey button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePasskeyAuth}
                      disabled={loading}
                      className="w-full border-white/10 hover:bg-white/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:border-[#e1a8f0]/30"
                      size="lg"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                      </svg>
                      Sign in with Passkey
                    </Button>
                  </motion.div>
                ) : (
                  /* Verification step */
                  <motion.form
                    key="verify"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    id="verify-form"
                    onSubmit={(e) => { e.preventDefault(); handleVerifyCode(); }}
                    className="space-y-5"
                  >
                    <div className="space-y-4">
                      <Label className="text-white/70">Verification Code</Label>
                      <div className="flex justify-center mt-2">
                        <InputOTP
                          maxLength={6}
                          value={verificationCode}
                          onChange={setVerificationCode}
                          autoFocus
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <p className="text-sm text-white/40 text-center">
                        Sent to {email}
                      </p>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          ref={errorRef}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 bg-red-500/10 rounded-xl border border-red-500/20"
                        >
                          <p className="text-sm text-red-400">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      disabled={loading || verificationCode.length !== 6}
                      className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      size="lg"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-[#1a0a1f]/30 border-t-[#1a0a1f] rounded-full"
                          />
                          Verifying...
                        </span>
                      ) : (
                        "Verify & Continue"
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-sm">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStep("input");
                          setVerificationCode("");
                          setError(null);
                        }}
                        className="transition-all duration-200 hover:scale-105"
                      >
                        ← Change email
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResendCode}
                        disabled={loading || resendCooldown > 0}
                        className="transition-all duration-200 hover:scale-105"
                      >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Passkey Creation Prompt */}
        <AnimatePresence>
          {showPasskeyPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-4"
            >
              <Card className="border-[#e1a8f0]/20 bg-gradient-to-br from-[#e1a8f0]/5 to-transparent backdrop-blur-xl">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#e1a8f0]/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#e1a8f0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Secure your account with a passkey</h3>
                      <p className="text-sm text-white/60 mb-4">
                        Sign in faster and more securely next time with biometric authentication.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreatePasskey}
                          disabled={loading}
                          size="sm"
                          className="transition-all duration-200 hover:scale-105"
                        >
                          Create Passkey
                        </Button>
                        <Button
                          onClick={() => setShowPasskeyPrompt(false)}
                          variant="ghost"
                          size="sm"
                          className="transition-all duration-200 hover:scale-105"
                        >
                          Maybe Later
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-white/25 mt-8 text-center"
        >
          By continuing, you agree to Yuki&apos;s Terms of Service and Privacy Policy
        </motion.p>

        {/* Debug: Show signer status (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-4 p-3 bg-white/5 rounded-lg text-xs text-white/40 font-mono"
          >
            <p>Signer: {status}</p>
            <p>Step: {step} | Loading: {loading ? 'yes' : 'no'}</p>
            <p>Awaiting OTP: {isAwaitingOtp ? 'yes' : 'no'}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f12]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-white/20 border-t-[#e1a8f0] rounded-full"
          />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
