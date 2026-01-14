"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import CountryCodeSelector from "@/components/CountryCodeSelector";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignUp = searchParams.get("su") !== null;
  
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();

  // Redirect if already logged in
  useEffect(() => {
    if (userLoaded && isSignedIn) {
      router.push("/");
    }
  }, [userLoaded, isSignedIn, router]);
  
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"input" | "verify">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Show loading while checking auth status
  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f6f3] via-[#eae8e4] to-[#e0ddd8]">
        <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render login form if already signed in (will redirect)
  if (isSignedIn) {
    return null;
  }

  const formatPhoneNumber = (value: string, code: string): string => {
    const numbers = value.replace(/\D/g, "");
    
    // Format based on country code
    if (code === "+1") {
      // US/Canada formatting
      if (numbers.length <= 3) {
        return numbers;
      } else if (numbers.length <= 6) {
        return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
      } else {
        return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
      }
    } else {
      // International formatting - just return the numbers
      return numbers;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const formatted = formatPhoneNumber(e.target.value, countryCode);
    setPhoneNumber(formatted);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    setLoading(true);
    
    try {
      if (authMethod === "phone") {
        const numbers = phoneNumber.replace(/\D/g, "");
        
        if (numbers.length < 7) {
          setError("Please enter a valid phone number");
          setLoading(false);
          return;
        }

        const fullPhoneNumber = `${countryCode}${numbers}`;
        
        if (isSignUp) {
          await signUp?.create({
            phoneNumber: fullPhoneNumber,
          });
          
          await signUp?.preparePhoneNumberVerification({
            strategy: "phone_code",
          });
        } else {
          await signIn?.create({
            identifier: fullPhoneNumber,
          });
          
          const phoneFactor = signIn?.supportedFirstFactors?.find(
            (f): f is typeof f & { phoneNumberId: string } => f.strategy === "phone_code"
          );
          if (phoneFactor?.phoneNumberId) {
            await signIn?.prepareFirstFactor({
              strategy: "phone_code",
              phoneNumberId: phoneFactor.phoneNumberId,
            });
          }
        }
      } else {
        // Email flow
        if (!email || !email.includes("@")) {
          setError("Please enter a valid email address");
          setLoading(false);
          return;
        }

        if (isSignUp) {
          await signUp?.create({
            emailAddress: email,
          });
          
          await signUp?.prepareEmailAddressVerification({
            strategy: "email_code",
          });
        } else {
          await signIn?.create({
            identifier: email,
          });
          
          const emailFactor = signIn?.supportedFirstFactors?.find(
            (f): f is typeof f & { emailAddressId: string } => f.strategy === "email_code"
          );
          if (emailFactor?.emailAddressId) {
            await signIn?.prepareFirstFactor({
              strategy: "email_code",
              emailAddressId: emailFactor.emailAddressId,
            });
          }
        }
      }
      
      setStep("verify");
      setResendCooldown(60); // 60 second cooldown after sending code
    } catch (err: any) {
      console.error("Error sending code:", err);
      let errorMessage = err.errors?.[0]?.message || "Failed to send verification code. Please try again.";
      
      // Handle specific error cases
      if (errorMessage.includes("email_address is not a valid parameter")) {
        errorMessage = "Email authentication is not enabled. Please use phone authentication or contact support.";
      } else if (errorMessage.includes("too many") || errorMessage.includes("rate limit") || 
                 err.errors?.[0]?.code === "too_many_requests" ||
                 err.status === 429) {
        errorMessage = "Too many requests. Please wait a few minutes before trying again.";
        setResendCooldown(120); // 2 minute cooldown for rate limit
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (verificationCode.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    
    try {
      if (isSignUp) {
        // Verify sign up
        let result;
        if (authMethod === "phone") {
          result = await signUp?.attemptPhoneNumberVerification({
            code: verificationCode,
          });
        } else {
          result = await signUp?.attemptEmailAddressVerification({
            code: verificationCode,
          });
        }
        
        console.log("Sign up verification result:", result);
        
        if (result?.status === "complete") {
          console.log("Sign up verification complete, setting active session...");
          await setActiveSignUp?.({ session: result.createdSessionId });
          console.log("Session activated, redirecting to app...");
          window.location.href = "/";
          return;
        } else if (result?.status === "missing_requirements") {
          console.log("Missing requirements:", result.missingFields);
          
          // Clerk verified the email/phone but needs more info
          // Since we only collect phone/email, we should still try to activate the session
          if (signUp?.createdSessionId) {
            console.log("Attempting to activate session despite missing requirements...");
            try {
              await setActiveSignUp?.({ session: signUp.createdSessionId });
              console.log("Session activated successfully, redirecting to app...");
              window.location.href = "/";
              return;
            } catch (sessionErr) {
              console.error("Could not activate session:", sessionErr);
            }
          }
          
          // Last resort: Try to complete the sign up by updating with minimal info
          try {
            console.log("Attempting to update sign up to complete status...");
            const updateResult = await signUp?.update({});
            
            if (updateResult?.status === "complete") {
              await setActiveSignUp?.({ session: updateResult.createdSessionId });
              console.log("Sign up completed after update, redirecting...");
              window.location.href = "/";
              return;
            }
          } catch (updateErr) {
            console.error("Could not update sign up:", updateErr);
          }
          
          // If nothing worked, something is wrong with Clerk config
          setError("Account verification successful! Please check your Clerk settings or try signing in.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 3000);
          return;
        } else {
          console.log("Unexpected sign up result status:", result?.status, result);
        }
      } else {
        // Verify sign in
        let result;
        if (authMethod === "phone") {
          result = await signIn?.attemptFirstFactor({
            strategy: "phone_code",
            code: verificationCode,
          });
        } else {
          result = await signIn?.attemptFirstFactor({
            strategy: "email_code",
            code: verificationCode,
          });
        }
        
        if (result?.status === "complete") {
          console.log("Sign in verification complete, setting active session...");
          await setActiveSignIn?.({ session: result.createdSessionId });
          console.log("Session activated, redirecting...");
          // Use window.location for hard redirect to ensure middleware picks up the new session
          window.location.href = "/";
          return;
        } else {
          console.log("Unexpected sign in result status:", result?.status);
        }
      }
      
      // If we get here without returning, something unexpected happened
      setError("Verification completed but unable to proceed. Please try signing in again.");
    } catch (err: any) {
      console.error("Error verifying code:", err);
      
      // Check if already verified
      if (err.errors?.[0]?.code === "verification_already_verified" || 
          err.errors?.[0]?.message?.includes("already verified") ||
          err.errors?.[0]?.message?.includes("Already verified")) {
        console.log("User already verified, attempting to complete session...");
        
        // Try to complete the session anyway
        try {
          if (isSignUp && signUp?.createdSessionId) {
            await setActiveSignUp?.({ session: signUp.createdSessionId });
            window.location.href = "/";
            return;
          } else if (!isSignUp && signIn?.createdSessionId) {
            await setActiveSignIn?.({ session: signIn.createdSessionId });
            window.location.href = "/";
            return;
          }
        } catch {
          // If that fails, just redirect to login to try again
          setError("Already verified! Please sign in.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
          return;
        }
      }
      
      setError(err.errors?.[0]?.message || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) {
      setError(`Please wait ${resendCooldown} seconds before requesting a new code.`);
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      if (authMethod === "phone") {
        if (isSignUp) {
          await signUp?.preparePhoneNumberVerification({
            strategy: "phone_code",
          });
        } else {
          const phoneFactor = signIn?.supportedFirstFactors?.find(
            (f): f is typeof f & { phoneNumberId: string } => f.strategy === "phone_code"
          );
          if (phoneFactor?.phoneNumberId) {
            await signIn?.prepareFirstFactor({
              strategy: "phone_code",
              phoneNumberId: phoneFactor.phoneNumberId,
            });
          }
        }
      } else {
        if (isSignUp) {
          await signUp?.prepareEmailAddressVerification({
            strategy: "email_code",
          });
        } else {
          const emailFactor = signIn?.supportedFirstFactors?.find(
            (f): f is typeof f & { emailAddressId: string } => f.strategy === "email_code"
          );
          if (emailFactor?.emailAddressId) {
            await signIn?.prepareFirstFactor({
              strategy: "email_code",
              emailAddressId: emailFactor.emailAddressId,
            });
          }
        }
      }
      
      setResendCooldown(60); // 60 second cooldown after resending
    } catch (err: any) {
      let errorMessage = err.errors?.[0]?.message || "Failed to resend code. Please try again.";
      
      // Handle rate limit errors
      if (errorMessage.includes("too many") || errorMessage.includes("rate limit") || 
          err.errors?.[0]?.code === "too_many_requests" ||
          err.status === 429) {
        errorMessage = "Too many requests. Please wait a few minutes before trying again.";
        setResendCooldown(120); // 2 minute cooldown for rate limit
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while Clerk hooks initialize
  if (!signInLoaded || !signUpLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f6f3] via-[#eae8e4] to-[#e0ddd8]">
        <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Gradient background - matching landing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8f6f3] via-[#eae8e4] to-[#e0ddd8]" />
      
      {/* Grain overlay */}
      <div 
        className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating color accents - matching landing page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 0.12,
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
          }}
          transition={{ 
            scale: { duration: 1.5, delay: 0.5 },
            opacity: { duration: 1.5, delay: 0.5 },
            x: { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 },
            y: { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 1 },
          }}
          className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-br from-[#004BAD]/30 to-transparent blur-3xl"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 0.08,
            x: [0, -25, 35, 0],
            y: [0, 30, -25, 0],
          }}
          transition={{ 
            scale: { duration: 1.5, delay: 0.7 },
            opacity: { duration: 1.5, delay: 0.7 },
            x: { duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
            y: { duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
          }}
          className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] rounded-full bg-gradient-to-tr from-amber-200/20 to-transparent blur-3xl"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.06, 0.1, 0.06],
          }}
          transition={{ 
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.9 },
            opacity: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.9 },
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full bg-gradient-radial from-white/40 to-transparent"
        />
      </div>

      <div className="w-full max-w-lg mx-auto px-6 py-12 relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <Image
            src="/images/LogoBlack.svg"
            alt="Yuki Logo"
            width={80}
            height={32}
            className="transition-transform duration-300 hover:scale-105"
          />
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h1 
            className="font-headline text-4xl sm:text-5xl text-black tracking-tight mb-3"
            style={{
              WebkitFontSmoothing: "antialiased",
              textRendering: "geometricPrecision",
            }}
          >
            {isSignUp ? (
              <>
                GET
                <div className="h-2" />
                STARTED
              </>
            ) : (
              <>
                WELCOME
                <div className="h-2" />
                BACK
              </>
            )}
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            {step === "input" 
              ? isSignUp 
                ? `Enter your ${authMethod === "phone" ? "phone number" : "email"} to create your account`
                : `Enter your ${authMethod === "phone" ? "phone number" : "email"} to sign in`
              : `Enter the 6-digit code sent to your ${authMethod === "phone" ? "phone" : "email"}`
            }
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl p-8"
        >
          {step === "input" ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              {/* Auth Method Toggle */}
              <div className="flex gap-2 p-1.5 bg-black/5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAuthMethod("phone")}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    authMethod === "phone"
                      ? "bg-black text-white"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod("email")}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    authMethod === "email"
                      ? "bg-black text-white"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  Email
                </button>
              </div>

              {/* Phone Input */}
              {authMethod === "phone" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex items-stretch gap-3">
                    <CountryCodeSelector
                      value={countryCode}
                      onChange={(code) => {
                        setCountryCode(code);
                        setPhoneNumber(formatPhoneNumber(phoneNumber, code));
                      }}
                    />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder={countryCode === "+1" ? "(555) 123-4567" : "Phone number"}
                      required
                      className="flex-1 h-[52px] bg-white/80 rounded-xl px-4 text-black placeholder:text-gray-400 focus:outline-none focus:bg-white transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full h-[52px] bg-white/80 rounded-xl px-4 text-black placeholder:text-gray-400 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 rounded-xl"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {/* Clerk CAPTCHA - will be shown by Clerk when needed */}
              <div id="clerk-captcha" className="flex justify-center" />

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative w-full py-4 bg-black text-white rounded-full text-base font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden"
              >
                <span className="relative z-10">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Continue"
                  )}
                </span>
                <motion.div
                  className="absolute inset-0 bg-[#004BAD]"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-semibold">
                  Continue
                </span>
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setVerificationCode(value.slice(0, 6));
                  }}
                  placeholder="000000"
                  required
                  maxLength={6}
                  autoFocus
                  className="w-full bg-white/80 rounded-xl px-4 py-4 text-black text-2xl tracking-[0.3em] placeholder:text-gray-400 focus:outline-none focus:bg-white transition-all font-mono text-center"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Sent to {authMethod === "phone" ? `${countryCode} ${phoneNumber}` : email}
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 rounded-xl"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative w-full py-4 bg-black text-white rounded-full text-base font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden"
              >
                <span className="relative z-10">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify & Continue"
                  )}
                </span>
                <motion.div
                  className="absolute inset-0 bg-[#004BAD]"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-semibold">
                  Verify & Continue
                </span>
              </motion.button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("input");
                    setVerificationCode("");
                    setError(null);
                  }}
                  className="text-gray-600 hover:text-black transition-colors cursor-pointer font-medium"
                >
                  ← Change {authMethod === "phone" ? "number" : "email"}
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading || resendCooldown > 0}
                  className="text-gray-600 hover:text-black transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed font-medium"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </motion.div>

        {/* Footer */}
        {step === "input" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm text-gray-600 mt-6"
          >
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <a href="/login" className="text-black hover:underline font-semibold cursor-pointer">
                  Sign in
                </a>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <a href="/login?su" className="text-black hover:underline font-semibold cursor-pointer">
                  Sign up
                </a>
              </>
            )}
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xs text-gray-500 mt-8"
        >
          By continuing, you agree to Yuki's Terms of Service and Privacy Policy
        </motion.p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f6f3] via-[#eae8e4] to-[#e0ddd8]">
          <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
