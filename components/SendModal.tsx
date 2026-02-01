/**
 * Send Modal Component
 * 
 * A production-ready modal for sending funds to other users.
 * Supports @username input only (no wallet addresses).
 * Includes quick access to contacts and recently interacted users.
 * Uses Alchemy Smart Wallets with sponsored gas (users never pay fees).
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useSmartAccountClient,
  useSendUserOperation,
} from '@account-kit/react';
import { encodeFunctionData, parseUnits, erc20Abi } from 'viem';
import {
  getUSDCBalance,
  USDC_DECIMALS,
  USDC_ADDRESS,
} from '@/lib/transactions/sendYUSD';

const BRAND_LAVENDER = '#e1a8f0';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string) => void;
}

interface ResolvedUser {
  walletAddress: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

interface Contact {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  walletAddress: string;
  nickname: string | null;
}

type Step = 'compose' | 'confirm' | 'sending' | 'success' | 'error';

export function SendModal({ isOpen, onClose, onSuccess }: SendModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { client } = useSmartAccountClient({});

  // Use Alchemy's sendUserOperation hook for sponsored gas transactions
  const { sendUserOperationAsync } = useSendUserOperation({
    client,
    waitForTxn: true,
    onSuccess: ({ hash }) => {
      setTxHash(hash);
      setStep('success');
      onSuccess?.(hash);
    },
    onError: (error) => {
      console.error('Transaction error:', error);
      setError(error.message || 'Transaction failed');
      setStep('error');
    },
  });

  const walletAddress = client?.account?.address;

  const [step, setStep] = useState<Step>('compose');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [resolvedUser, setResolvedUser] = useState<ResolvedUser | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Contacts and recent users
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recentUsers, setRecentUsers] = useState<ResolvedUser[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const numericAmount = parseFloat(amount) || 0;

  // Check if recipient is valid (username only)
  const isRecipientValid = recipient.length >= 3;

  // Check if sending to self
  const isSendingToSelf = resolvedUser?.walletAddress && walletAddress
    ? resolvedUser.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    : false;

  // Fetch balance when modal opens
  useEffect(() => {
    if (isOpen && walletAddress) {
      setIsLoadingBalance(true);
      getUSDCBalance(walletAddress as `0x${string}`)
        .then(bal => {
          setBalance(bal);
          setIsLoadingBalance(false);
        })
        .catch(() => {
          setBalance('0');
          setIsLoadingBalance(false);
        });
    }
  }, [isOpen, walletAddress]);

  // Fetch contacts and recent users when modal opens
  useEffect(() => {
    if (isOpen && walletAddress) {
      setIsLoadingContacts(true);

      // Fetch contacts
      fetch('/api/contacts', {
        headers: { 'x-wallet-address': walletAddress },
      })
        .then(res => res.ok ? res.json() : { contacts: [] })
        .then(data => {
          setContacts(data.contacts || []);
        })
        .catch(() => setContacts([]))
        .finally(() => setIsLoadingContacts(false));

      // TODO: Fetch recent users from activity
      // For now, leaving empty - will implement in next iteration
      setRecentUsers([]);
    }
  }, [isOpen, walletAddress]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('compose');
      setAmount('');
      setRecipient('');
      setResolvedUser(null);
      setError(null);
      setTxHash(null);
    }
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && step === 'compose') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  // Resolve username when it changes (with debounce)
  useEffect(() => {
    if (recipient.length < 3) {
      setResolvedUser(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsResolving(true);
      try {
        const res = await fetch('/api/user/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: recipient }),
        });

        if (res.ok) {
          const data = await res.json();
          setResolvedUser({
            walletAddress: data.walletAddress,
            username: data.username,
            displayName: data.displayName,
            avatarUrl: data.avatarUrl,
          });
          setError(null);
        } else {
          setResolvedUser(null);
        }
      } catch {
        setResolvedUser(null);
      } finally {
        setIsResolving(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [recipient]);

  const handleClose = () => {
    if (step !== 'sending') {
      onClose();
    }
  };

  const handleSelectUser = (user: Contact | ResolvedUser) => {
    const username = user.username;
    setRecipient(username.replace(/^@/, ''));
    setResolvedUser({
      walletAddress: user.walletAddress,
      username: username,
      displayName: user.displayName || undefined,
      avatarUrl: user.avatarUrl || undefined,
    });
  };

  const handleContinue = () => {
    if (numericAmount <= 0) {
      setError('Please enter an amount');
      return;
    }
    if (numericAmount > parseFloat(balance)) {
      setError('Insufficient balance');
      return;
    }

    if (!resolvedUser) {
      setError('User not found');
      return;
    }
    if (isSendingToSelf) {
      setError("You can't send to yourself");
      return;
    }

    setError(null);
    setStep('confirm');
  };

  const handleSend = async () => {
    if (!client) {
      setError('Wallet not ready');
      return;
    }

    const targetAddress = resolvedUser?.walletAddress;

    if (!targetAddress) {
      setError('No recipient address');
      return;
    }

    setStep('sending');
    setError(null);

    try {
      // Build the ERC20 transfer call data (using USDC)
      const transferData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [
          targetAddress as `0x${string}`,
          parseUnits(amount, USDC_DECIMALS),
        ],
      });

      // Send the user operation (gas is sponsored!)
      await sendUserOperationAsync({
        uo: {
          target: USDC_ADDRESS,
          data: transferData,
          value: 0n,
        },
      });
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
      setStep('error');
    }
  };

  // Display text for recipient
  const getRecipientDisplay = () => {
    if (resolvedUser) {
      return resolvedUser.displayName || resolvedUser.username;
    }
    return '';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0b0b0f]/90"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-[440px] mx-0 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {step === 'compose' && (
                <motion.div
                  key="compose"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white/[0.04] backdrop-blur-[40px] rounded-[32px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
                >
                  {/* Header */}
                  <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white/50 text-sm font-medium">Send</p>
                      <button
                        onClick={handleClose}
                        className="text-white/30 hover:text-white/50 transition-colors cursor-pointer p-1 -mr-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="px-6 sm:px-8 py-6 sm:py-8">
                    <div className="flex items-center justify-center gap-1 mb-6">
                      <span
                        className="text-5xl sm:text-6xl font-light"
                        style={{ color: BRAND_LAVENDER }}
                      >
                        $
                      </span>
                      <input
                        ref={inputRef}
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                            setAmount(val);
                            setError(null);
                          }
                        }}
                        placeholder="0"
                        className="text-5xl sm:text-6xl font-light text-white bg-transparent border-none outline-none w-40 sm:w-48"
                        style={{ caretColor: BRAND_LAVENDER }}
                      />
                    </div>

                    <div className="flex justify-center mb-8">
                      <span className="text-white/30 text-sm">
                        Available: {isLoadingBalance ? '...' : `$${parseFloat(balance).toFixed(2)}`}
                      </span>
                    </div>

                    {/* Contacts Quick Access */}
                    {isLoadingContacts ? (
                      <div className="mb-4">
                        <p className="text-white/40 text-xs font-medium mb-2">Contacts</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white/[0.04] rounded-xl animate-pulse"
                            >
                              <div className="w-6 h-6 rounded-full bg-white/10" />
                              <div className="w-16 h-4 bg-white/10 rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : contacts.length > 0 && (
                      <div className="mb-4">
                        <p className="text-white/40 text-xs font-medium mb-2">Contacts</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {contacts.slice(0, 5).map((contact) => (
                            <button
                              key={contact.id}
                              onClick={() => handleSelectUser(contact)}
                              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl transition-all duration-250 cursor-pointer"
                            >
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white/60">
                                {(contact.displayName || contact.username || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-white text-sm font-medium">
                                {contact.nickname || contact.displayName || contact.username}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recipient Input */}
                    <div className="space-y-3">
                      <label className="text-white/50 text-sm">To</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">@</span>
                        <input
                          type="text"
                          value={recipient}
                          onChange={(e) => {
                            let val = e.target.value;
                            // Remove @ if user types it (we already show it)
                            val = val.replace(/^@/, '');
                            setRecipient(val);
                            setError(null);
                          }}
                          placeholder="username"
                          className="w-full bg-white/[0.04] rounded-xl py-4 pr-4 pl-9 text-white focus:outline-none focus:bg-white/[0.06] transition-all duration-250 placeholder:text-white/20 font-medium border-0"
                        />

                        {/* Resolving indicator */}
                        {isResolving && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                          </div>
                        )}

                        {/* Resolved user indicator */}
                        {resolvedUser && !isResolving && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Resolved user preview */}
                      {resolvedUser && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-xl"
                        >
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white/60">
                            {(resolvedUser.displayName || resolvedUser.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {resolvedUser.displayName || resolvedUser.username}
                            </p>
                            <p className="text-white/40 text-xs truncate">
                              {resolvedUser.walletAddress.slice(0, 8)}...{resolvedUser.walletAddress.slice(-6)}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="px-6 sm:px-8 pb-4">
                      <p className="text-red-400 text-sm text-center">{error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-4">
                    <button
                      onClick={handleContinue}
                      disabled={!amount || !recipient || !resolvedUser}
                      className="w-full py-4 rounded-xl text-base font-medium transition-all duration-250 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      style={{ backgroundColor: BRAND_LAVENDER, color: '#1a0a1f' }}
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white/[0.04] backdrop-blur-[40px] rounded-[32px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
                >
                  {/* Header */}
                  <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white/50 text-sm font-medium">Confirm</p>
                      <button
                        onClick={handleClose}
                        className="text-white/30 hover:text-white/50 transition-colors cursor-pointer p-1 -mr-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="px-6 sm:px-8 py-6 sm:py-8">
                    <div className="text-center mb-8">
                      <p className="text-4xl sm:text-5xl font-light text-white">
                        ${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-white/40 text-sm mt-2">
                        to {getRecipientDisplay()}
                      </p>
                    </div>

                    <div className="bg-white/[0.03] rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Network Fee</span>
                        <span className="text-green-400 font-medium">Free ✨</span>
                      </div>
                    </div>

                    <p className="text-xs text-white/30 text-center mt-4">
                      Gas fees are sponsored by Yuki
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-4 flex gap-3">
                    <button
                      onClick={() => setStep('compose')}
                      className="flex-1 py-4 rounded-xl text-base font-medium bg-white/[0.06] text-white hover:bg-white/[0.1] transition-all duration-250 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSend}
                      className="flex-1 py-4 rounded-xl text-base font-medium transition-all duration-250 cursor-pointer"
                      style={{ backgroundColor: BRAND_LAVENDER, color: '#1a0a1f' }}
                    >
                      Send
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'sending' && (
                <motion.div
                  key="sending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white/[0.04] backdrop-blur-[40px] rounded-[32px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.35)] py-12 sm:py-16 px-6 sm:px-8"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-white/50 animate-spin mx-auto mb-6" />
                    <p className="text-white font-medium">Sending...</p>
                    <p className="text-white/50 text-sm mt-2">Confirming your transaction</p>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#0a0a0a] sm:bg-[#0a0a0a] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl overflow-hidden py-10 sm:py-12 px-6 sm:px-8"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                      style={{ backgroundColor: `${BRAND_LAVENDER}15` }}
                    >
                      <svg
                        className="w-8 h-8"
                        style={{ color: BRAND_LAVENDER }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>

                    <p className="text-white text-lg font-medium mb-1">Sent!</p>
                    <p className="text-white/50 text-sm">
                      ${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} to {getRecipientDisplay()}
                    </p>

                    {txHash && (
                      <a
                        href={`https://basescan.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-4 text-sm hover:underline"
                        style={{ color: BRAND_LAVENDER }}
                      >
                        View on Basescan →
                      </a>
                    )}

                    <button
                      onClick={handleClose}
                      className="w-full mt-8 py-4 rounded-xl text-base font-medium bg-white/[0.06] text-white hover:bg-white/[0.1] transition-all duration-250 cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#0a0a0a] sm:bg-[#0a0a0a] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl overflow-hidden py-10 sm:py-12 px-6 sm:px-8"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                      <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>

                    <p className="text-white text-lg font-medium mb-1">Transaction Failed</p>
                    <p className="text-white/50 text-sm">{error}</p>

                    <div className="flex gap-3 mt-8">
                      <button
                        onClick={handleClose}
                        className="flex-1 py-4 rounded-xl text-base font-medium bg-white/[0.06] text-white hover:bg-white/[0.1] transition-all duration-250 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setStep('confirm')}
                        className="flex-1 py-4 rounded-xl text-base font-medium transition-all duration-250 cursor-pointer"
                        style={{ backgroundColor: BRAND_LAVENDER, color: '#1a0a1f' }}
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
