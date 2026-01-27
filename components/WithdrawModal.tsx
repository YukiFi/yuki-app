/**
 * Withdraw Modal Component
 * 
 * Allows users to withdraw to an external wallet.
 * Uses Alchemy Smart Wallets with sponsored gas.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useSmartAccountClient,
  useSendUserOperation,
} from '@account-kit/react';
import { encodeFunctionData, parseUnits, erc20Abi } from 'viem';
import { getUSDCBalance, isValidAddress, USDC_ADDRESS, USDC_DECIMALS } from '@/lib/transactions/sendYUSD';

const BRAND_LAVENDER = '#e1a8f0';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string) => void;
}

type Step = 'amount' | 'address' | 'confirm' | 'sending' | 'success' | 'error';

export function WithdrawModal({ isOpen, onClose, onSuccess }: WithdrawModalProps) {
  const { client } = useSmartAccountClient({});
  
  // Use Alchemy's sendUserOperation hook for sponsored gas transactions
  const { sendUserOperationAsync, isSendingUserOperation } = useSendUserOperation({
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
  
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [externalAddress, setExternalAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  
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
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('amount');
      setAmount('');
      setExternalAddress('');
      setError(null);
      setTxHash(null);
    }
  }, [isOpen]);
  
  const handleAmountSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (numAmount > parseFloat(balance)) {
      setError('Insufficient balance');
      return;
    }
    setError(null);
    setStep('address');
  };
  
  const handleAddressSubmit = () => {
    if (!isValidAddress(externalAddress)) {
      setError('Invalid Ethereum address');
      return;
    }
    setError(null);
    setStep('confirm');
  };
  
  const handleWithdraw = async () => {
    if (!client) {
      setError('Wallet not ready');
      return;
    }
    
    setStep('sending');
    setError(null);
    
    try {
      // Build the ERC20 transfer call data
      const transferData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [
          externalAddress as `0x${string}`,
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
  
  const handleClose = () => {
    if (step !== 'sending') {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full sm:max-w-md bg-black rounded-t-3xl sm:rounded-3xl overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {step === 'success' ? 'Withdrawn!' : 'Withdraw USDC'}
              </h2>
              {step !== 'sending' && (
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.1] transition-colors"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Steps */}
            {step === 'amount' && (
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-white/50 mb-2 block">Amount</label>
                  <div className="relative">
                    <span 
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-medium"
                      style={{ color: BRAND_LAVENDER }}
                    >
                      $
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      autoFocus
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl py-4 pl-10 pr-4 text-2xl text-white focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-white/40">
                      Available: {isLoadingBalance ? '...' : `$${parseFloat(balance).toFixed(2)}`}
                    </span>
                    <button
                      onClick={() => setAmount(balance)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      Max
                    </button>
                  </div>
                </div>
                
                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}
                
                <button
                  onClick={handleAmountSubmit}
                  disabled={!amount}
                  className="w-full py-4 rounded-2xl font-medium transition-all disabled:opacity-40"
                  style={{ backgroundColor: BRAND_LAVENDER, color: '#1a0a1f' }}
                >
                  Continue
                </button>
              </div>
            )}
            
            {step === 'address' && (
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-white/50 mb-2 block">Destination Address</label>
                  <input
                    type="text"
                    value={externalAddress}
                    onChange={(e) => setExternalAddress(e.target.value)}
                    placeholder="0x..."
                    autoFocus
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl py-4 px-4 text-white font-mono text-sm focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                
                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('amount')}
                    className="flex-1 py-4 rounded-2xl font-medium bg-white/[0.06] text-white hover:bg-white/[0.1] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleAddressSubmit}
                    disabled={!externalAddress}
                    className="flex-1 py-4 rounded-2xl font-medium transition-all disabled:opacity-40"
                    style={{ backgroundColor: BRAND_LAVENDER, color: '#1a0a1f' }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
            
            {step === 'confirm' && (
              <div className="space-y-6">
                <div className="bg-white/[0.03] rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-white/50">Amount</span>
                    <span className="text-white font-medium">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">To</span>
                    <span className="text-white font-mono text-sm">
                      {externalAddress.slice(0, 8)}...{externalAddress.slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/[0.06]">
                    <span className="text-white/50">Network Fee</span>
                    <span className="text-green-400 font-medium">Free ✨</span>
                  </div>
                </div>
                
                <p className="text-xs text-white/40 text-center">
                  Gas fees are sponsored by Yuki. You pay $0.
                </p>
                
                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('address')}
                    className="flex-1 py-4 rounded-2xl font-medium bg-white/[0.06] text-white hover:bg-white/[0.1] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleWithdraw}
                    className="flex-1 py-4 rounded-2xl font-medium transition-all"
                    style={{ backgroundColor: BRAND_LAVENDER, color: '#1a0a1f' }}
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            )}
            
            {step === 'sending' && (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-white/50 animate-spin mx-auto mb-6" />
                <p className="text-white font-medium">Processing...</p>
                <p className="text-white/50 text-sm mt-2">Confirming your withdrawal</p>
              </div>
            )}
            
            {step === 'success' && (
              <div className="py-8 text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: `${BRAND_LAVENDER}20` }}
                >
                  <svg 
                    className="w-8 h-8" 
                    style={{ color: BRAND_LAVENDER }}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-2xl font-semibold text-white mb-2">
                  ${parseFloat(amount).toFixed(2)} Withdrawn!
                </p>
                <p className="text-white/50 text-sm mb-6">
                  To {externalAddress.slice(0, 8)}...{externalAddress.slice(-6)}
                </p>
                {txHash && (
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                    style={{ color: BRAND_LAVENDER }}
                  >
                    View on Basescan →
                  </a>
                )}
                <button
                  onClick={handleClose}
                  className="w-full mt-8 py-4 rounded-2xl font-medium bg-white/[0.06] text-white hover:bg-white/[0.1] transition-colors"
                >
                  Done
                </button>
              </div>
            )}
            
            {step === 'error' && (
              <div className="py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-white mb-2">Withdrawal Failed</p>
                <p className="text-white/50 text-sm mb-6">{error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-4 rounded-2xl font-medium bg-white/[0.06] text-white hover:bg-white/[0.1] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep('confirm')}
                    className="flex-1 py-4 rounded-2xl font-medium"
                    style={{ backgroundColor: BRAND_LAVENDER, color: '#1a0a1f' }}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
