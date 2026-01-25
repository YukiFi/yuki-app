"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import CountryCodeSelector from "@/components/CountryCodeSelector";

const easeOut = [0.22, 1, 0.36, 1] as const;

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
  
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("email");
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

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (verificationCode.length === 6 && step === "verify") {
      const form = document.getElementById("verify-form") as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }
  }, [verificationCode, step]);

  // Show loading while checking auth status
  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f12]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[#e1a8f0] rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render login form if already signed in (will redirect)
  if (isSignedIn) {
    return null;
  }

  const formatPhoneNumber = (value: string, code: string): string => {
    const numbers = value.replace(/\D/g, "");
    
    if (code === "+1") {
      if (numbers.length <= 3) {
        return numbers;
      } else if (numbers.length <= 6) {
        return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
      } else {
        return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
      }
    } else {
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
        // Extract only digits from the phone number
        let numbers = phoneNumber.replace(/\D/g, "");
        
        // Get the country code digits (without the +)
        const countryCodeDigits = countryCode.replace(/\D/g, "");
        
        // For US/Canada (+1), if user entered 11 digits starting with 1, strip the leading 1
        // to avoid doubling the country code
        if (countryCodeDigits === "1" && numbers.length === 11 && numbers.startsWith("1")) {
          numbers = numbers.slice(1);
        }
        
        // For US/Canada, we need exactly 10 digits for the subscriber number
        if (countryCodeDigits === "1" && numbers.length !== 10) {
          setError(`Please enter a 10-digit phone number (you entered ${numbers.length} digits)`);
          setLoading(false);
          return;
        }
        
        // For other countries, minimum 7 digits
        if (countryCodeDigits !== "1" && numbers.length < 7) {
          setError("Please enter a valid phone number");
          setLoading(false);
          return;
        }

        // Create E.164 format: +[country code][subscriber number]
        // Ensure country code starts with + and has no extra characters
        const fullPhoneNumber = `+${countryCodeDigits}${numbers}`;
        
        console.log("Attempting auth with phone:", fullPhoneNumber);
        console.log("Country code:", countryCode, "-> digits:", countryCodeDigits);
        console.log("Phone digits:", numbers, "length:", numbers.length);
        
        if (isSignUp) {
          await signUp?.create({ phoneNumber: fullPhoneNumber });
          await signUp?.preparePhoneNumberVerification({ strategy: "phone_code" });
        } else {
          const signInAttempt = await signIn?.create({ identifier: fullPhoneNumber });
          
          if (!signInAttempt) {
            throw new Error("Failed to create sign-in attempt");
          }
          
          const phoneFactor = signInAttempt.supportedFirstFactors?.find(
            (f): f is typeof f & { phoneNumberId: string } => f.strategy === "phone_code"
          );
          
          if (phoneFactor?.phoneNumberId) {
            await signIn?.prepareFirstFactor({
              strategy: "phone_code",
              phoneNumberId: phoneFactor.phoneNumberId,
            });
          } else {
            throw new Error("Phone verification not available for this account");
          }
        }
      } else {
        if (!email || !email.includes("@")) {
          setError("Please enter a valid email address");
          setLoading(false);
          return;
        }

        if (isSignUp) {
          await signUp?.create({ emailAddress: email });
          await signUp?.prepareEmailAddressVerification({ strategy: "email_code" });
        } else {
          const signInAttempt = await signIn?.create({ identifier: email });
          
          if (!signInAttempt) {
            throw new Error("Failed to create sign-in attempt");
          }
          
          const emailFactor = signInAttempt.supportedFirstFactors?.find(
            (f): f is typeof f & { emailAddressId: string } => f.strategy === "email_code"
          );
          
          if (emailFactor?.emailAddressId) {
            await signIn?.prepareFirstFactor({
              strategy: "email_code",
              emailAddressId: emailFactor.emailAddressId,
            });
          } else {
            throw new Error("Email verification not available for this account");
          }
        }
      }
      
      setStep("verify");
      setResendCooldown(60);
    } catch (err: unknown) {
      console.error("Error sending code:", err);
      const clerkError = err as { errors?: { message?: string; code?: string; longMessage?: string; meta?: { paramName?: string } }[]; status?: number };
      
      // Log full error for debugging
      console.log("Clerk error details:", JSON.stringify(clerkError.errors, null, 2));
      
      let errorMessage = clerkError.errors?.[0]?.longMessage || clerkError.errors?.[0]?.message || "Failed to send verification code. Please try again.";
      const errorCode = clerkError.errors?.[0]?.code;
      
      // Handle specific Clerk errors
      if (errorCode === "form_identifier_not_found") {
        // User doesn't exist
        errorMessage = "No account found. Please sign up first.";
      } else if (errorCode === "form_param_format_invalid" || errorMessage.includes("Identifier is invalid")) {
        // This usually means phone auth isn't enabled in Clerk, or the identifier type isn't allowed
        let debugNumbers = phoneNumber.replace(/\D/g, "");
        const debugCountryDigits = countryCode.replace(/\D/g, "");
        if (debugCountryDigits === "1" && debugNumbers.length === 11 && debugNumbers.startsWith("1")) {
          debugNumbers = debugNumbers.slice(1);
        }
        const debugFullNumber = `+${debugCountryDigits}${debugNumbers}`;
        console.log("Phone number that was rejected:", debugFullNumber);
        errorMessage = isSignUp 
          ? "Phone sign-up may not be enabled. Try email or check Clerk settings."
          : "Could not sign in with this phone. Try email, or check if phone sign-in is enabled in Clerk.";
      } else if (errorMessage.includes("email_address is not a valid parameter")) {
        errorMessage = "Email authentication is not enabled. Please use phone authentication or contact support.";
      } else if (errorMessage.includes("too many") || errorMessage.includes("rate limit") || 
                 clerkError.errors?.[0]?.code === "too_many_requests" ||
                 clerkError.status === 429) {
        errorMessage = "Too many requests. Please wait a few minutes before trying again.";
        setResendCooldown(120);
      } else if (clerkError.errors?.[0]?.code === "form_param_format_invalid") {
        errorMessage = "Invalid phone number format. Please enter a valid phone number.";
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
        let result;
        if (authMethod === "phone") {
          result = await signUp?.attemptPhoneNumberVerification({ code: verificationCode });
        } else {
          result = await signUp?.attemptEmailAddressVerification({ code: verificationCode });
        }
        
        if (result?.status === "complete") {
          await setActiveSignUp?.({ session: result.createdSessionId });
          window.location.href = "/";
          return;
        } else if (result?.status === "missing_requirements") {
          if (signUp?.createdSessionId) {
            try {
              await setActiveSignUp?.({ session: signUp.createdSessionId });
              window.location.href = "/";
              return;
            } catch (sessionErr) {
              console.error("Could not activate session:", sessionErr);
            }
          }
          
          try {
            const updateResult = await signUp?.update({});
            if (updateResult?.status === "complete") {
              await setActiveSignUp?.({ session: updateResult.createdSessionId });
              window.location.href = "/";
              return;
            }
          } catch (updateErr) {
            console.error("Could not update sign up:", updateErr);
          }
          
          setError("Account verification successful! Please check your Clerk settings or try signing in.");
          setTimeout(() => { window.location.href = "/login"; }, 3000);
          return;
        }
      } else {
        let result;
        if (authMethod === "phone") {
          result = await signIn?.attemptFirstFactor({ strategy: "phone_code", code: verificationCode });
        } else {
          result = await signIn?.attemptFirstFactor({ strategy: "email_code", code: verificationCode });
        }
        
        if (result?.status === "complete") {
          await setActiveSignIn?.({ session: result.createdSessionId });
          window.location.href = "/";
          return;
        }
      }
      
      setError("Verification completed but unable to proceed. Please try signing in again.");
    } catch (err: unknown) {
      console.error("Error verifying code:", err);
      const clerkError = err as { errors?: { message?: string; code?: string }[] };
      
      if (clerkError.errors?.[0]?.code === "verification_already_verified" || 
          clerkError.errors?.[0]?.message?.includes("already verified") ||
          clerkError.errors?.[0]?.message?.includes("Already verified")) {
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
          setError("Already verified! Please sign in.");
          setTimeout(() => { window.location.href = "/login"; }, 1500);
          return;
        }
      }
      
      setError(clerkError.errors?.[0]?.message || "Invalid verification code. Please try again.");
      setVerificationCode("");
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
          await signUp?.preparePhoneNumberVerification({ strategy: "phone_code" });
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
          await signUp?.prepareEmailAddressVerification({ strategy: "email_code" });
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
      
      setResendCooldown(60);
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message?: string; code?: string }[]; status?: number };
      let errorMessage = clerkError.errors?.[0]?.message || "Failed to resend code. Please try again.";
      
      if (errorMessage.includes("too many") || errorMessage.includes("rate limit") || 
          clerkError.errors?.[0]?.code === "too_many_requests" ||
          clerkError.status === 429) {
        errorMessage = "Too many requests. Please wait a few minutes before trying again.";
        setResendCooldown(120);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while Clerk hooks initialize
  if (!signInLoaded || !signUpLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f12]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[#e1a8f0] rounded-full animate-spin" />
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
        {/* Logo - immediately visible */}
        <div className="mb-8">
          <Image
            src="/images/Logo.svg"
            alt="Yuki Logo"
            width={80}
            height={32}
            className="transition-transform duration-200 hover:scale-105"
          />
        </div>

        {/* Login Card - immediately visible */}
        <div>
          <Card>
            <CardHeader className="space-y-2 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e1a8f0]" />
                <span className="text-xs text-white/40 uppercase tracking-widest">
                  {isSignUp ? "Create Account" : "Sign In"}
                </span>
              </div>
              <CardTitle className="text-3xl sm:text-4xl">
                {isSignUp ? "Get Started" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-base">
                {step === "input" 
                  ? isSignUp 
                    ? `Enter your ${authMethod === "phone" ? "phone number" : "email"} to create your account`
                    : `Enter your ${authMethod === "phone" ? "phone number" : "email"} to sign in`
                  : `Enter the 6-digit code sent to your ${authMethod === "phone" ? "phone" : "email"}`
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {step === "input" ? (
                <form onSubmit={handleSendCode} className="space-y-5">
                  {/* Auth Method Tabs */}
                  <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "phone" | "email")}>
                    <TabsList className="w-full">
                      <TabsTrigger value="phone">Phone</TabsTrigger>
                      <TabsTrigger value="email">Email</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="phone">
                      <div className="space-y-2.5 mt-5">
                        <Label htmlFor="phone" className="text-white/70 block">Phone Number</Label>
                        <div className="flex items-stretch gap-3">
                          <CountryCodeSelector
                            value={countryCode}
                            onChange={(code) => {
                              setCountryCode(code);
                              setPhoneNumber(formatPhoneNumber(phoneNumber, code));
                            }}
                          />
                          <Input
                            id="phone"
                            type="tel"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            placeholder={countryCode === "+1" ? "(555) 123-4567" : "Phone number"}
                            required
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="email">
                      <div className="space-y-2.5">
                        <Label htmlFor="email" className="text-white/70 block mt-5">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

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

                  {/* Clerk CAPTCHA */}
                  <div id="clerk-captcha" className="flex justify-center" />

                  <Button type="submit" disabled={loading} className="w-full" size="lg">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-[#1a0a1f]/30 border-t-[#1a0a1f] rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>
              ) : (
                <form id="verify-form" onSubmit={handleVerifyCode} className="space-y-5">
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
                      Sent to {authMethod === "phone" ? `${countryCode} ${phoneNumber}` : email}
                    </p>
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

                  <Button type="submit" disabled={loading || verificationCode.length !== 6} className="w-full" size="lg">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-[#1a0a1f]/30 border-t-[#1a0a1f] rounded-full animate-spin" />
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
                    >
                      ← Change {authMethod === "phone" ? "number" : "email"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResendCode}
                      disabled={loading || resendCooldown > 0}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer - immediately visible */}
        {step === "input" && (
          <p className="text-sm text-white/40 mt-6 text-center">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <a href="/login" className="text-[#e1a8f0] hover:text-[#edc4f5] transition-colors duration-200 font-medium">
                  Sign in
                </a>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <a href="/login?su" className="text-[#e1a8f0] hover:text-[#edc4f5] transition-colors duration-200 font-medium">
                  Sign up
                </a>
              </>
            )}
          </p>
        )}

        <p className="text-xs text-white/25 mt-8 text-center">
          By continuing, you agree to Yuki&apos;s Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f12]">
          <div className="w-8 h-8 border-2 border-white/20 border-t-[#e1a8f0] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
