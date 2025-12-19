/**
 * Export Private Key Modal
 * 
 * HIGH-RISK ACTION - Requires step-up authentication.
 * If passkey is enabled, requires both password and passkey.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useWalletContext } from '@/lib/context/WalletContext';
import { decryptWallet, toHex, secureWipe } from '@/lib/crypto';

interface ExportPrivateKeyProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'warning' | 'password' | 'passkey' | 'reveal';

export function ExportPrivateKey({ isOpen, onClose }: ExportPrivateKeyProps) {
  const { encryptedWallet, hasWallet } = useWalletContext();
  
  const [step, setStep] = useState<Step>('warning');
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const privateKeyRef = useRef<Uint8Array | null>(null);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setStep('warning');
      setPassword('');
      setPrivateKey(null);
      setCopied(false);
      setError(null);
      setCountdown(30);
    } else {
      // Clean up when closing
      if (privateKeyRef.current) {
        secureWipe(privateKeyRef.current);
        privateKeyRef.current = null;
      }
      setPrivateKey(null);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    }
  }, [isOpen]);

  // Auto-hide private key after countdown
  useEffect(() => {
    if (step === 'reveal' && privateKey) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Auto close
            if (privateKeyRef.current) {
              secureWipe(privateKeyRef.current);
              privateKeyRef.current = null;
            }
            setPrivateKey(null);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }
  }, [step, privateKey, onClose]);

  const handlePasswordSubmit = async () => {
    if (!password || !encryptedWallet) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if passkey is required
      if (encryptedWallet.securityLevel === 'passkey_enabled') {
        // For passkey-enabled wallets, we need both password and passkey
        // First verify password works
        const decrypted = await decryptWallet(password, encryptedWallet);
        privateKeyRef.current = decrypted;
        setStep('passkey');
      } else {
        // Password-only: decrypt directly
        const decrypted = await decryptWallet(password, encryptedWallet);
        privateKeyRef.current = decrypted;
        setPrivateKey(toHex(decrypted));
        setStep('reveal');
      }
    } catch (err) {
      setError('Invalid password');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyVerify = async () => {
    if (!privateKeyRef.current) {
      setError('Session expired. Please try again.');
      setStep('password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify passkey
      const { startAuthentication } = await import('@simplewebauthn/browser');
      
      const authOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
        timeout: 60000,
        userVerification: 'required' as const,
      };

      await startAuthentication({
        optionsJSON: {
          ...authOptions,
          challenge: btoa(String.fromCharCode(...authOptions.challenge)),
        },
      });

      // Passkey verified, show private key
      setPrivateKey(toHex(privateKeyRef.current));
      setStep('reveal');
    } catch (err) {
      setError('Passkey verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!privateKey) return;
    
    try {
      await navigator.clipboard.writeText(privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen || !hasWallet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={step === 'reveal' ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 glass rounded-2xl border border-red-500/20 shadow-2xl animate-fade-in">
        <div className="p-6">
          {/* Warning Step */}
          {step === 'warning' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-fdfffc mb-2">Export Private Key</h3>
                <p className="text-sm text-gray-400">
                  This is a high-risk action. Your private key grants full control over your wallet.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-red-400">
                    <strong>Never share your private key.</strong> Anyone with your key can steal all your funds.
                  </p>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <svg className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-yellow-400">
                    Store your key in a secure location like a password manager or hardware device.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/5 text-gray-300 rounded-lg font-medium border border-white/10 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setStep('password');
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all"
                >
                  I Understand
                </button>
              </div>
            </>
          )}

          {/* Password Step */}
          {step === 'password' && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-xl font-medium text-fdfffc mb-2">Verify Password</h3>
                <p className="text-sm text-gray-400">
                  Enter your password to export your private key.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    ref={inputRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors disabled:opacity-50"
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('warning')}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-white/5 text-gray-300 rounded-lg font-medium border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePasswordSubmit}
                    disabled={isLoading || !password}
                    className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Passkey Step */}
          {step === 'passkey' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-fdfffc mb-2">Verify Passkey</h3>
                <p className="text-sm text-gray-400">
                  Use your passkey to complete the export.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                  <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('password')}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-white/5 text-gray-300 rounded-lg font-medium border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handlePasskeyVerify}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Verify Passkey
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Reveal Step */}
          {step === 'reveal' && privateKey && (
            <>
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-fdfffc mb-2">Your Private Key</h3>
                <p className="text-sm text-red-400">
                  Auto-hiding in {countdown} seconds
                </p>
              </div>

              {/* Private key display */}
              <div className="p-4 bg-dark-800/80 border border-red-500/20 rounded-lg mb-4 relative group">
                <p className="text-xs font-mono text-fdfffc break-all select-all">
                  {privateKey}
                </p>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-red-400">
                  Never share this key. Store it securely. This key will not be shown again.
                </p>
              </div>

              <button
                onClick={() => {
                  if (privateKeyRef.current) {
                    secureWipe(privateKeyRef.current);
                    privateKeyRef.current = null;
                  }
                  setPrivateKey(null);
                  onClose();
                }}
                className="w-full py-3 bg-white/5 text-gray-300 rounded-lg font-medium border border-white/10 hover:bg-white/10 transition-all"
              >
                Close & Clear
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
