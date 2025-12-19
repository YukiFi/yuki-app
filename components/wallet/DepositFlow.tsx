/**
 * Deposit Flow Component
 * 
 * Handles the complete USDC deposit flow:
 * 1. Buy USDC via Coinbase Pay (on-ramp) -> funds sent to user's EOA
 * 2. Unlock wallet
 * 3. Approve USDC spending
 * 4. Deposit to Yuki Vault
 */

'use client';

import { useState, useEffect } from 'react';
import { useWalletContext } from '@/lib/context/WalletContext';
import { UnlockModal } from './UnlockModal';
import { CreateWalletModal } from './CreateWalletModal';
import { 
  USDC_ADDRESS, 
  YUKI_VAULT_ADDRESS, 
  ERC20_ABI, 
  VAULT_ABI,
  formatUSDC,
  parseUSDC,
  USDC_DECIMALS,
} from '@/lib/constants';
import { createPublicClient, createWalletClient, http, encodeFunctionData, parseUnits } from 'viem';
import { mainnet } from 'viem/chains';

type DepositStep = 'amount' | 'onramp' | 'unlock' | 'approve' | 'deposit' | 'success';

interface DepositFlowProps {
  isOpen: boolean;
  onClose: () => void;
  vaultId?: string;
  vaultName?: string;
}

export function DepositFlow({ isOpen, onClose, vaultId, vaultName }: DepositFlowProps) {
  const { 
    hasWallet, 
    encryptedWallet,
    isUnlocked,
    account,
    fetchWallet,
  } = useWalletContext();

  const [step, setStep] = useState<DepositStep>('amount');
  const [amount, setAmount] = useState('');
  const [usdcBalance, setUsdcBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Modal states
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);

  // Public client for reading blockchain state
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('amount');
      setAmount('');
      setError(null);
      setTxHash(null);
    }
  }, [isOpen]);

  // Fetch USDC balance when wallet is available
  useEffect(() => {
    const fetchBalance = async () => {
      if (!encryptedWallet?.address) return;
      
      try {
        const balance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [encryptedWallet.address as `0x${string}`],
        });
        setUsdcBalance(balance);
      } catch (err) {
        console.error('Failed to fetch USDC balance:', err);
      }
    };

    fetchBalance();
  }, [encryptedWallet?.address]);

  const handleAmountSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Check if user has wallet
    if (!hasWallet) {
      setShowCreateWallet(true);
      return;
    }

    const depositAmount = parseUSDC(amount);
    
    // Check if user has enough USDC
    if (depositAmount > usdcBalance) {
      // Need to on-ramp first
      setStep('onramp');
    } else {
      // Has enough USDC, proceed to unlock
      if (!isUnlocked) {
        setShowUnlock(true);
      } else {
        // Already unlocked, proceed to approve
        setStep('approve');
        await handleApprove();
      }
    }
  };

  const handleOnRampComplete = () => {
    // After on-ramp, user needs to unlock and approve
    if (!isUnlocked) {
      setShowUnlock(true);
    } else {
      setStep('approve');
      handleApprove();
    }
  };

  const handleUnlockSuccess = () => {
    setShowUnlock(false);
    setStep('approve');
    handleApprove();
  };

  const handleApprove = async () => {
    if (!account) {
      setError('Wallet not unlocked');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const depositAmount = parseUSDC(amount);
      
      // Check current allowance
      const allowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [account.address, YUKI_VAULT_ADDRESS],
      });

      if (allowance >= depositAmount) {
        // Already approved, proceed to deposit
        setStep('deposit');
        await handleDeposit();
        return;
      }

      // Prepare approve transaction
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [YUKI_VAULT_ADDRESS, depositAmount],
      });

      // Get gas estimate
      const gasEstimate = await publicClient.estimateGas({
        account: account.address,
        to: USDC_ADDRESS,
        data,
      });

      // Get current gas price
      const gasPrice = await publicClient.getGasPrice();

      // Get nonce
      const nonce = await publicClient.getTransactionCount({
        address: account.address,
      });

      // Sign and send transaction
      const signedTx = await account.signTransaction({
        to: USDC_ADDRESS,
        data,
        gas: gasEstimate,
        gasPrice,
        nonce,
        chainId: mainnet.id,
      });

      const hash = await publicClient.sendRawTransaction({
        serializedTransaction: signedTx,
      });

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      setStep('deposit');
      await handleDeposit();
    } catch (err) {
      console.error('Approve error:', err);
      setError('Failed to approve USDC spending');
      setStep('amount');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!account) {
      setError('Wallet not unlocked');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const depositAmount = parseUSDC(amount);
      
      // Prepare deposit transaction
      const data = encodeFunctionData({
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [depositAmount],
      });

      // Get gas estimate
      const gasEstimate = await publicClient.estimateGas({
        account: account.address,
        to: YUKI_VAULT_ADDRESS,
        data,
      });

      // Get current gas price
      const gasPrice = await publicClient.getGasPrice();

      // Get nonce
      const nonce = await publicClient.getTransactionCount({
        address: account.address,
      });

      // Sign and send transaction
      const signedTx = await account.signTransaction({
        to: YUKI_VAULT_ADDRESS,
        data,
        gas: gasEstimate,
        gasPrice,
        nonce,
        chainId: mainnet.id,
      });

      const hash = await publicClient.sendRawTransaction({
        serializedTransaction: signedTx,
      });

      setTxHash(hash);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      setStep('success');
    } catch (err) {
      console.error('Deposit error:', err);
      setError('Failed to deposit to vault');
      setStep('amount');
    } finally {
      setIsLoading(false);
    }
  };

  const openCoinbasePay = () => {
    // Coinbase Pay URL with pre-filled destination
    const address = encryptedWallet?.address;
    if (!address) return;

    // Generate Coinbase Pay URL
    // In production, use the Coinbase Pay SDK
    const coinbasePayUrl = `https://pay.coinbase.com/buy/select-asset?appId=${process.env.NEXT_PUBLIC_COINBASE_PAY_APP_ID || 'demo'}&addresses={"${address}":["ethereum"]}&assets=["USDC"]&presetFiatAmount=${amount}`;
    
    window.open(coinbasePayUrl, '_blank', 'width=500,height=700');
    
    // Show a message that they should complete the purchase and come back
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={step === 'success' ? onClose : undefined}
        />
        
        <div className="relative w-full max-w-md mx-4 glass rounded-2xl border border-white/10 shadow-2xl animate-fade-in">
          <div className="p-6">
            {/* Amount Step */}
            {step === 'amount' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-medium text-fdfffc">Deposit USDC</h3>
                    <p className="text-sm text-gray-400">
                      {vaultName || 'Yuki Vault'}
                    </p>
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

                {/* Balance display */}
                {encryptedWallet?.address && (
                  <div className="p-3 bg-white/5 border border-white/5 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">USDC Balance</span>
                      <span className="text-sm font-medium text-fdfffc">
                        ${formatUSDC(usdcBalance)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Amount input */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full bg-dark-800/50 border border-white/10 rounded-lg pl-8 pr-16 py-3 text-fdfffc placeholder:text-gray-600 focus:outline-none focus:border-accent-primary/50 transition-colors text-xl font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      USDC
                    </span>
                  </div>
                </div>

                {/* Quick amounts */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {['100', '500', '1000', '5000'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className="py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-fdfffc transition-colors"
                    >
                      ${preset}
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                    <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleAmountSubmit}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all disabled:opacity-50"
                >
                  Continue
                </button>
              </>
            )}

            {/* On-ramp Step */}
            {step === 'onramp' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-fdfffc mb-2">Buy USDC</h3>
                  <p className="text-sm text-gray-400">
                    You need ${parseFloat(amount).toFixed(2)} USDC. Purchase with card or bank transfer.
                  </p>
                </div>

                {/* Wallet address info */}
                <div className="p-3 bg-white/5 border border-white/5 rounded-lg mb-4">
                  <p className="text-xs text-gray-500 mb-1">USDC will be sent to</p>
                  <p className="text-sm font-mono text-fdfffc break-all">
                    {encryptedWallet?.address}
                  </p>
                </div>

                <button
                  onClick={openCoinbasePay}
                  className="w-full py-3 bg-[#0052FF] text-white rounded-lg font-medium hover:bg-[#0052FF]/90 transition-colors flex items-center justify-center gap-2 mb-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                  Buy with Coinbase Pay
                </button>

                <button
                  onClick={handleOnRampComplete}
                  className="w-full py-3 bg-white/5 text-gray-300 rounded-lg font-medium border border-white/10 hover:bg-white/10 transition-all"
                >
                  I already have USDC
                </button>

                <button
                  onClick={() => setStep('amount')}
                  className="w-full py-2 text-gray-500 text-sm hover:text-gray-300 transition-colors mt-2"
                >
                  Back
                </button>
              </>
            )}

            {/* Approve/Deposit Loading Steps */}
            {(step === 'approve' || step === 'deposit') && (
              <div className="text-center py-8">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-accent-primary/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-accent-primary border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-medium text-fdfffc mb-2">
                  {step === 'approve' ? 'Approving USDC...' : 'Depositing...'}
                </h3>
                <p className="text-sm text-gray-400">
                  {step === 'approve' 
                    ? 'Confirm the transaction in your wallet'
                    : 'Your deposit is being processed'}
                </p>
              </div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-fdfffc mb-2">Deposit Complete!</h3>
                <p className="text-sm text-gray-400 mb-4">
                  ${amount} USDC has been deposited to {vaultName || 'the vault'}.
                </p>

                {txHash && (
                  <a
                    href={`https://etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-accent-primary hover:underline mb-6"
                  >
                    View on Etherscan
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium shadow-button-primary hover:shadow-button-primary-hover transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Wallet Modal */}
      <CreateWalletModal
        isOpen={showCreateWallet}
        onClose={() => setShowCreateWallet(false)}
        onSuccess={() => {
          setShowCreateWallet(false);
          fetchWallet();
          handleAmountSubmit();
        }}
      />

      {/* Unlock Modal */}
      <UnlockModal
        isOpen={showUnlock}
        onClose={() => setShowUnlock(false)}
        onUnlock={handleUnlockSuccess}
        title="Unlock to Deposit"
        description="Enter your password to sign the deposit transaction"
      />
    </>
  );
}
