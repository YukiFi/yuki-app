/**
 * Create Wallet Modal
 * 
 * Flow for creating a new embedded wallet.
 * Generates keys client-side, encrypts with password, stores on server.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useWalletContext } from '@/lib/context/WalletContext';
import { validatePassword } from '@/lib/crypto';

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (address: string) => void;
}

type Step = 'password' | 'creating' | 'success';

export function CreateWalletModal({ isOpen, onClose, onSuccess }: CreateWalletModalProps) {
  const { createWallet, isCreating } = useWalletContext();
  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createdAddress, setCreatedAddress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('password');
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setCreatedAddress(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setStep('creating');

    const result = await createWallet(password);

    if (result.success && result.address) {
      setCreatedAddress(result.address);
      setStep('success');
      onSuccess?.(result.address);
    } else {
      setStep('password');
      setError(result.error || 'Failed to create wallet');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={step === 'success' ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 glass rounded-2xl border border-white/10 shadow-2xl animate-fade-in">
        <div className="p-6">
          {/* Password Step */}
          {step === 'password' && (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-fdfffc mb-2">Create Your Wallet</h3>
                <p className="text-sm text-gray-400">
                  Choose a strong password to secure your wallet. This password encrypts your private key.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    ref={inputRef}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors"
                  />
                </div>

                {/* Password requirements */}
                <div className="p-3 bg-white/5 border border-white/5 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Password requirements:</p>
                  <ul className="text-xs space-y-1">
                    <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-400' : 'text-gray-500'}`}>
                      <span>{password.length >= 8 ? '✓' : '○'}</span>
                      At least 8 characters
                    </li>
                    <li className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-400' : 'text-gray-500'}`}>
                      <span>{/[a-z]/.test(password) ? '✓' : '○'}</span>
                      One lowercase letter
                    </li>
                    <li className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-gray-500'}`}>
                      <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                      One uppercase letter
                    </li>
                    <li className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-400' : 'text-gray-500'}`}>
                      <span>{/[0-9]/.test(password) ? '✓' : '○'}</span>
                      One number
                    </li>
                  </ul>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Warning */}
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <svg className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-xs text-yellow-400">
                    <strong>Important:</strong> This password cannot be recovered. If you lose it, you will lose access to your funds.
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 bg-white/5 text-gray-300 rounded-lg font-medium border border-white/10 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!password || !confirmPassword}
                    className="flex-1 py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all disabled:opacity-50"
                  >
                    Create Wallet
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Creating Step */}
          {step === 'creating' && (
            <div className="text-center py-8">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-accent-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-accent-primary border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-medium text-fdfffc mb-2">Creating Your Wallet</h3>
              <p className="text-sm text-gray-400">
                Generating keys and encrypting your wallet...
              </p>
              <div className="mt-4 text-xs text-gray-500">
                This happens entirely in your browser.
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && createdAddress && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-fdfffc mb-2">Wallet Created!</h3>
              <p className="text-sm text-gray-400 mb-4">
                Your wallet has been created and secured.
              </p>

              {/* Address display */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg mb-6">
                <p className="text-xs text-gray-500 mb-2">Your wallet address</p>
                <p className="text-sm font-mono text-fdfffc break-all">
                  {createdAddress}
                </p>
              </div>

              {/* Security level indicator */}
              <div className="flex items-center justify-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-6">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span className="text-xs text-yellow-400">
                  Security Level: Basic (Password Only)
                </span>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {/* Security footer */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              <span>Non-custodial • Your keys, your crypto</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
