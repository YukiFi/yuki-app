/**
 * Unlock Modal
 * 
 * Password prompt for unlocking the embedded wallet.
 * Used before any transaction signing operation.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useWalletContext } from '@/lib/context/WalletContext';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock?: () => void;
  title?: string;
  description?: string;
}

export function UnlockModal({ 
  isOpen, 
  onClose, 
  onUnlock,
  title = 'Unlock Wallet',
  description = 'Enter your password to sign this transaction',
}: UnlockModalProps) {
  const { unlockWallet, isUnlocking, isUnlocked, error } = useWalletContext();
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setLocalError(null);
      // Focus input after modal animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close modal when unlocked
  useEffect(() => {
    if (isUnlocked && isOpen) {
      onUnlock?.();
      onClose();
    }
  }, [isUnlocked, isOpen, onUnlock, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setLocalError('Password is required');
      return;
    }
    
    setLocalError(null);
    const result = await unlockWallet(password);
    
    if (!result.success) {
      setLocalError(result.error || 'Invalid password');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 glass rounded-2xl border border-white/10 shadow-2xl animate-fade-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-fdfffc">{title}</h3>
                <p className="text-sm text-gray-400">{description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-fdfffc transition-colors rounded-lg hover:bg-white/5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
                placeholder="Enter your password"
                disabled={isUnlocking}
                className="w-full bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors disabled:opacity-50"
              />
            </div>

            {/* Error */}
            {(localError || error) && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-400">{localError || error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isUnlocking}
                className="flex-1 py-3 bg-white/5 text-gray-300 rounded-lg font-medium border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUnlocking || !password}
                className="flex-1 py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUnlocking ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Unlock
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security indicator */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              <span>Your keys never leave your browser</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
