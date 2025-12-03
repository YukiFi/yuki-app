"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// Simulate steps
type Step = "email" | "personal" | "payment" | "processing" | "success";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fake data
  const [formData, setFormData] = useState({
    email: "demo@example.com",
    firstName: "Alex",
    lastName: "Thompson",
    dob: "1995-04-12",
    address: "123 Innovation Drive",
    city: "San Francisco",
    state: "CA",
    zip: "94105",
    cardNumber: "4242 4242 4242 4242",
    expiry: "12/25",
    cvc: "123",
  });

  // Auto-progress through "processing" state
  useEffect(() => {
    if (step === "processing") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStep("success");
            
            // Store login state
            localStorage.setItem("yuki_onboarding_complete", "true");
            // Dispatch custom event to notify other components
            window.dispatchEvent(new Event("yuki_login_update"));
            
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleNext = (nextStep: Step) => {
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setLoading(false);
      setStep(nextStep);
    }, 800);
  };

  const renderStepIndicator = () => {
    const steps = ["email", "personal", "payment"];
    const currentIdx = steps.indexOf(step === "processing" || step === "success" ? "payment" : step);

    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                idx <= currentIdx ? "bg-accent-primary" : "bg-white/10"
              }`}
            />
            {idx < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-2 transition-colors duration-300 ${
                  idx < currentIdx ? "bg-accent-primary" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-dark-900 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-5 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {step !== "processing" && step !== "success" && renderStepIndicator()}

        <div className="glass p-8 rounded-xl border border-white/5 shadow-2xl">
          
          {/* Step 1: Email */}
          {step === "email" && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-medium text-fdfffc mb-2">Create your account</h2>
              <p className="text-gray-400 mb-6 text-sm">Enter your email to get started with Yuki.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc focus:outline-none focus:border-accent-primary/50 transition-colors cursor-default"
                  />
                </div>
                
                <button
                  onClick={() => handleNext("personal")}
                  disabled={loading}
                  className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Continue
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  By continuing, you agree to our <span className="text-accent-primary cursor-pointer hover:underline">Terms of Service</span> and <span className="text-accent-primary cursor-pointer hover:underline">Privacy Policy</span>.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Personal Info */}
          {step === "personal" && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-medium text-fdfffc mb-2">Verify Identity</h2>
              <p className="text-gray-400 mb-6 text-sm">We need a few details to verify your identity.</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      readOnly
                      className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc focus:outline-none cursor-default"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      readOnly
                      className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc focus:outline-none cursor-default"
                    />
                  </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Date of Birth</label>
                    <input
                      type="text"
                      value={formData.dob}
                      readOnly
                      className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc focus:outline-none cursor-default"
                    />
                  </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Street Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    readOnly
                    className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc focus:outline-none cursor-default"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">City</label>
                    <input type="text" value={formData.city} readOnly className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc focus:outline-none cursor-default" />
                   </div>
                   <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">State</label>
                    <input type="text" value={formData.state} readOnly className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc focus:outline-none cursor-default" />
                   </div>
                   <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">ZIP</label>
                    <input type="text" value={formData.zip} readOnly className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc focus:outline-none cursor-default" />
                   </div>
                </div>
                
                <button
                  onClick={() => handleNext("payment")}
                  disabled={loading}
                  className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Verify & Continue"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === "payment" && (
            <div className="animate-fade-in">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-medium text-fdfffc">Add Payment Method</h2>
                 <div className="flex gap-2 opacity-50">
                    {/* Simple Card Icons */}
                    <div className="w-8 h-5 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold">VISA</div>
                    <div className="w-8 h-5 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold">MC</div>
                 </div>
               </div>

              <div className="p-4 bg-dark-800/30 rounded-lg border border-white/5 mb-6">
                <div className="flex justify-between items-center mb-4">
                   <span className="text-sm text-gray-400">Initial Deposit</span>
                   <span className="text-lg font-medium text-fdfffc">$1,000.00</span>
                </div>
                <div className="h-px w-full bg-white/5 mb-4"></div>
                <div className="space-y-4">
                   <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Card Number</label>
                      <div className="relative">
                        <input
                            type="text"
                            value={formData.cardNumber}
                            readOnly
                            className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc focus:outline-none pl-10 cursor-default"
                        />
                         <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                         </svg>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Expiry</label>
                        <input
                            type="text"
                            value={formData.expiry}
                            readOnly
                            className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc focus:outline-none cursor-default"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">CVC</label>
                        <input
                            type="text"
                            value={formData.cvc}
                            readOnly
                            className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc focus:outline-none cursor-default"
                        />
                      </div>
                   </div>
                </div>
              </div>
              
              <button
                onClick={() => setStep("processing")}
                className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Pay $1,000.00 & Start Earning
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                Bank-level 256-bit encryption
              </div>
            </div>
          )}

          {/* Step 4: Processing */}
          {step === "processing" && (
            <div className="animate-fade-in text-center py-8">
               <div className="relative w-24 h-24 mx-auto mb-8">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                     <circle className="text-white/5 stroke-current" strokeWidth="4" cx="50" cy="50" r="46" fill="none"></circle>
                     <circle className="text-accent-primary stroke-current transition-all duration-200 ease-linear" strokeWidth="4" strokeLinecap="round" cx="50" cy="50" r="46" fill="none" strokeDasharray="289.02652413026095" strokeDashoffset={289.02652413026095 - (289.02652413026095 * progress) / 100} transform="rotate(-90 50 50)"></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-sm font-medium text-gray-400">{Math.round(progress)}%</span>
                  </div>
               </div>
               <h2 className="text-xl font-medium text-fdfffc mb-2">Processing Payment</h2>
               <p className="text-gray-500 text-sm">Creating your smart wallet and depositing funds...</p>
            </div>
          )}

          {/* Step 5: Success */}
          {step === "success" && (
            <div className="animate-fade-in text-center py-4">
               <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
               </div>
               <h2 className="text-2xl font-medium text-fdfffc mb-2">You're all set!</h2>
               <p className="text-gray-400 mb-8 text-sm">
                  Your deposit of <span className="text-fdfffc font-medium">$1,000.00</span> has been successfully processed. Your smart wallet is ready.
               </p>
               
               <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/')}
                    className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                  <button 
                     onClick={() => router.push('/')}
                     className="w-full py-3 text-gray-400 hover:text-fdfffc text-sm font-medium transition-colors cursor-pointer"
                  >
                     View Transaction Details
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
