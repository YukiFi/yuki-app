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
const ease = [0.22, 1, 0.36, 1] as const;

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
  const [step, setStep] = useState<"input" | "verify" | "passkey" | "success">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Ref to track if error animation should play
  const errorRef = useRef<HTMLDivElement>(null);

  // Ref to track if user manually changed step (to prevent auto-switching)
  const manualStepChangeRef = useRef(false);

  // Debug: Log signer status changes
  useEffect(() => {
    console.log("[Auth] Signer status changed:", status, signerStatus);
  }, [status, signerStatus]);

  // Automatically switch to verify step when signer is awaiting OTP
  useEffect(() => {
    if (isAwaitingOtp && step === "input" && !manualStepChangeRef.current) {
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

  // Also redirect if manually set to success step
  useEffect(() => {
    if (step === "success" && isConnected) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [step, isConnected, router]);

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

  // Show loading while Alchemy initializes
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0f] px-4">
        <div className="mb-12">
          <Image
            src="/images/Yuki.svg"
            alt="Yuki"
            width={56}
            height={56}
            priority
          />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full"
        />
      </div>
    );
  }

  // Already connected - show success state
  if (isConnected || step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease }}
            className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/[0.04] flex items-center justify-center"
          >
            <svg className="w-7 h-7 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3, ease }}
            className="text-white/60 text-sm"
          >
            Welcome back
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
    // Reset manual step change flag so auto-switching works
    manualStepChangeRef.current = false;

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

      // Success! Go to passkey step
      setStep("passkey");
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

      // Passkey created, will redirect via the isConnected effect
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0f] px-4">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease }}
        className="mb-12"
      >
        <Image
          src="/images/appletname.svg"
          alt="Yuki"
          width={120}
          height={94}
          priority
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
                {step === "input" ? "Sign in" : step === "verify" ? "Verify" : "Secure your wallet"}
              </CardTitle>
              <CardDescription className="text-white/50 text-sm">
                {step === "input"
                  ? "Access your wallet"
                  : step === "verify"
                    ? `Code sent to ${email}`
                    : "Add biometric authentication"
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <AnimatePresence mode="wait">
                {step === "input" ? (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease }}
                    className="space-y-6"
                  >
                    {/* Email input */}
                    <form onSubmit={handleSendCode} className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="email" className="text-white/60 text-sm font-normal">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          autoFocus
                          className="transition-all duration-250 focus:shadow-[0_0_0_2px_rgba(225,168,240,0.3)]"
                        />
                      </div>

                      <AnimatePresence>
                        {error && (
                          <motion.div
                            ref={errorRef}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2, ease }}
                            className="p-4 bg-red-500/10 rounded-2xl"
                          >
                            <p className="text-sm text-red-400/90">{error}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full transition-all duration-250"
                        size="lg"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-[#1a0a1f]/30 border-t-[#1a0a1f] rounded-full"
                            />
                            Sending
                          </span>
                        ) : (
                          "Continue"
                        )}
                      </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/[0.06]" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white/[0.04] backdrop-blur-sm px-4 py-1 rounded-full text-white/30">or</span>
                      </div>
                    </div>

                    {/* Passkey button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePasskeyAuth}
                      disabled={loading}
                      className="w-full border-0 bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-250 focus:shadow-[0_0_0_2px_rgba(225,168,240,0.3)]"
                      size="lg"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                      </svg>
                      Passkey
                    </Button>
                  </motion.div>
                ) : step === "verify" ? (
                  /* Verification step */
                  <motion.form
                    key="verify"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease }}
                    id="verify-form"
                    onSubmit={(e) => { e.preventDefault(); handleVerifyCode(); }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <Label className="text-white/60 text-sm font-normal">Verification code</Label>
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
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          ref={errorRef}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2, ease }}
                          className="p-4 bg-red-500/10 rounded-2xl"
                        >
                          <p className="text-sm text-red-400/90">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      disabled={loading || verificationCode.length !== 6}
                      className="w-full transition-all duration-250"
                      size="lg"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-[#1a0a1f]/30 border-t-[#1a0a1f] rounded-full"
                          />
                          Verifying
                        </span>
                      ) : (
                        "Verify"
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-sm">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          manualStepChangeRef.current = true;
                          setStep("input");
                          setVerificationCode("");
                          setError(null);
                        }}
                        className="transition-all duration-250 text-white/40 hover:text-white/60"
                      >
                        ← Change email
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResendCode}
                        disabled={loading || resendCooldown > 0}
                        className="transition-all duration-250 text-white/40 hover:text-white/60"
                      >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
                      </Button>
                    </div>
                  </motion.form>
                ) : (
                  /* Passkey step */
                  <motion.div
                    key="passkey"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <p className="text-white/60 text-sm max-w-[280px]">
                        Sign in faster next time with biometric authentication
                      </p>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2, ease }}
                          className="p-4 bg-red-500/10 rounded-2xl"
                        >
                          <p className="text-sm text-red-400/90">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-3">
                      <Button
                        onClick={handleCreatePasskey}
                        disabled={loading}
                        className="w-full transition-all duration-250"
                        size="lg"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-[#1a0a1f]/30 border-t-[#1a0a1f] rounded-full"
                            />
                            Creating
                          </span>
                        ) : (
                          "Create passkey"
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          // Skip passkey, will redirect via isConnected effect
                          setStep("success");
                        }}
                        variant="ghost"
                        className="w-full transition-all duration-250 text-white/40 hover:text-white/60"
                        size="lg"
                      >
                        Skip for now
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4, ease }}
          className="text-xs text-white/20 mt-8 text-center"
        >
          By continuing, you agree to Yuki's Terms and Privacy Policy
        </motion.p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0f] px-4">
          <div className="mb-12">
            <Image
              src="/images/appletname.svg"
              alt="Yuki"
              width={120}
              height={94}
              priority
            />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full"
          />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
