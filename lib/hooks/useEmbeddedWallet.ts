/**
 * Embedded Wallet Hook
 * 
 * This hook manages the embedded wallet lifecycle:
 * - Wallet creation (client-side key generation)
 * - Unlock/lock (password-based decryption)
 * - Transaction signing
 * - Passkey upgrade
 * 
 * SECURITY: All cryptographic operations happen in the browser.
 * The private key NEVER leaves the browser in plaintext.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  createEncryptedWallet, 
  decryptWallet, 
  toHex, 
  secureWipe,
  type EncryptedWalletData 
} from '@/lib/crypto';
import type { LocalAccount } from 'viem/accounts';

// Unlock session timeout (10 minutes)
const UNLOCK_TIMEOUT_MS = 10 * 60 * 1000;

export interface WalletState {
  // Wallet data from server
  encryptedWallet: EncryptedWalletData | null;
  hasWallet: boolean;
  
  // Unlock state
  isUnlocked: boolean;
  account: LocalAccount | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUnlocking: boolean;
  
  // Error state
  error: string | null;
}

export interface UseEmbeddedWalletReturn extends WalletState {
  // Actions
  fetchWallet: () => Promise<void>;
  createWallet: (password: string) => Promise<{ success: boolean; error?: string; address?: string }>;
  unlockWallet: (password: string) => Promise<{ success: boolean; error?: string }>;
  lockWallet: () => void;
  signMessage: (message: string) => Promise<`0x${string}` | null>;
  signTransaction: (tx: object) => Promise<`0x${string}` | null>;
  
  // Passkey upgrade
  upgradeToPasskey: (password: string) => Promise<{ success: boolean; error?: string }>;
}

export function useEmbeddedWallet(): UseEmbeddedWalletReturn {
  const [state, setState] = useState<WalletState>({
    encryptedWallet: null,
    hasWallet: false,
    isUnlocked: false,
    account: null,
    isLoading: true,
    isCreating: false,
    isUnlocking: false,
    error: null,
  });

  // Store decrypted key in ref (memory only, never persisted)
  const privateKeyRef = useRef<Uint8Array | null>(null);
  const unlockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-lock after timeout
  const scheduleAutoLock = useCallback(() => {
    if (unlockTimeoutRef.current) {
      clearTimeout(unlockTimeoutRef.current);
    }
    unlockTimeoutRef.current = setTimeout(() => {
      // Lock wallet
      if (privateKeyRef.current) {
        secureWipe(privateKeyRef.current);
        privateKeyRef.current = null;
      }
      setState(prev => ({
        ...prev,
        isUnlocked: false,
        account: null,
      }));
    }, UNLOCK_TIMEOUT_MS);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unlockTimeoutRef.current) {
        clearTimeout(unlockTimeoutRef.current);
      }
      if (privateKeyRef.current) {
        secureWipe(privateKeyRef.current);
        privateKeyRef.current = null;
      }
    };
  }, []);

  // Fetch wallet from server
  const fetchWallet = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/wallet');
      const data = await response.json();
      
      if (response.ok && data.hasWallet) {
        setState(prev => ({
          ...prev,
          encryptedWallet: data.wallet,
          hasWallet: true,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          encryptedWallet: null,
          hasWallet: false,
          isLoading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch wallet',
      }));
    }
  }, []);

  // Create new wallet
  const createWallet = useCallback(async (password: string): Promise<{ success: boolean; error?: string; address?: string }> => {
    setState(prev => ({ ...prev, isCreating: true, error: null }));
    
    try {
      // Step 1: Generate and encrypt wallet client-side
      const { encryptedData, address } = await createEncryptedWallet(password, 1);
      
      // Step 2: Send encrypted data to server
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedWallet: encryptedData }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setState(prev => ({
          ...prev,
          encryptedWallet: encryptedData,
          hasWallet: true,
          isCreating: false,
        }));
        return { success: true, address };
      } else {
        setState(prev => ({ ...prev, isCreating: false, error: data.error }));
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = 'Failed to create wallet';
      setState(prev => ({ ...prev, isCreating: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Unlock wallet with password
  const unlockWallet = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.encryptedWallet) {
      return { success: false, error: 'No wallet to unlock' };
    }
    
    setState(prev => ({ ...prev, isUnlocking: true, error: null }));
    
    try {
      // Decrypt wallet client-side
      const privateKey = await decryptWallet(password, state.encryptedWallet);
      
      // Store in ref (memory only)
      privateKeyRef.current = privateKey;
      
      // Create viem account
      const { privateKeyToAccount } = await import('viem/accounts');
      const account = privateKeyToAccount(toHex(privateKey));
      
      setState(prev => ({
        ...prev,
        isUnlocked: true,
        account,
        isUnlocking: false,
      }));
      
      // Schedule auto-lock
      scheduleAutoLock();
      
      return { success: true };
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isUnlocking: false, 
        error: 'Invalid password' 
      }));
      return { success: false, error: 'Invalid password' };
    }
  }, [state.encryptedWallet, scheduleAutoLock]);

  // Lock wallet
  const lockWallet = useCallback(() => {
    if (unlockTimeoutRef.current) {
      clearTimeout(unlockTimeoutRef.current);
    }
    if (privateKeyRef.current) {
      secureWipe(privateKeyRef.current);
      privateKeyRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isUnlocked: false,
      account: null,
    }));
  }, []);

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<`0x${string}` | null> => {
    if (!state.account) {
      return null;
    }
    
    try {
      // Reset auto-lock timer on activity
      scheduleAutoLock();
      
      const signature = await state.account.signMessage({ message });
      return signature;
    } catch (error) {
      console.error('Sign message error:', error);
      return null;
    }
  }, [state.account, scheduleAutoLock]);

  // Sign transaction
  const signTransaction = useCallback(async (tx: object): Promise<`0x${string}` | null> => {
    if (!state.account) {
      return null;
    }
    
    try {
      // Reset auto-lock timer on activity
      scheduleAutoLock();
      
      const signature = await state.account.signTransaction(tx as Parameters<typeof state.account.signTransaction>[0]);
      return signature;
    } catch (error) {
      console.error('Sign transaction error:', error);
      return null;
    }
  }, [state.account, scheduleAutoLock]);

  // Upgrade to passkey (Phase E)
  const upgradeToPasskey = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!state.encryptedWallet) {
      return { success: false, error: 'No wallet to upgrade' };
    }
    
    if (state.encryptedWallet.securityLevel === 'passkey_enabled') {
      return { success: false, error: 'Passkey already enabled' };
    }
    
    try {
      // Import WebAuthn functions
      const { startRegistration } = await import('@simplewebauthn/browser');
      
      // Step 1: Decrypt wallet with password
      const privateKey = await decryptWallet(password, state.encryptedWallet);
      
      // Step 2: Generate passkey registration options
      // In a real implementation, these would come from the server
      const registrationOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: 'Yuki',
          id: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
        },
        user: {
          id: new Uint8Array(16),
          name: 'wallet@yuki.fi',
          displayName: 'Yuki Wallet',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' as const },
          { alg: -257, type: 'public-key' as const },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform' as const,
          userVerification: 'required' as const,
          residentKey: 'required' as const,
        },
        timeout: 60000,
        attestation: 'none' as const,
      };
      
      // Step 3: Create passkey
      const credential = await startRegistration({
        optionsJSON: {
          ...registrationOptions,
          challenge: btoa(String.fromCharCode(...registrationOptions.challenge)),
          user: {
            ...registrationOptions.user,
            id: btoa(String.fromCharCode(...registrationOptions.user.id)),
          },
        },
      });
      
      // Step 4: Derive KEK from passkey
      // For simplicity, we'll derive it from the credential ID
      // In production, you'd want a more sophisticated approach
      const encoder = new TextEncoder();
      const passkeyKeyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(credential.id),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const passkeyKEK = new Uint8Array(
        await crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: encoder.encode('yuki-passkey-kek'),
            iterations: 100000,
            hash: 'SHA-256',
          },
          passkeyKeyMaterial,
          256
        )
      );
      
      // Step 5: Upgrade wallet with passkey
      const { upgradeToPasskey: upgradeCrypto } = await import('@/lib/crypto');
      const upgradedWallet = await upgradeCrypto(
        password,
        privateKey,
        state.encryptedWallet,
        passkeyKEK
      );
      
      // Step 6: Wipe private key
      secureWipe(privateKey);
      secureWipe(passkeyKEK);
      
      // Step 7: Send to server
      const response = await fetch('/api/wallet/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upgradedWallet,
          passkeyCredential: {
            credentialId: credential.id,
            publicKey: credential.response.publicKey || '',
            counter: 0,
            transports: credential.response.transports,
          },
        }),
      });
      
      if (response.ok) {
        // Refresh wallet data
        await fetchWallet();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Passkey upgrade error:', error);
      return { success: false, error: 'Failed to enable passkey' };
    }
  }, [state.encryptedWallet, fetchWallet]);

  return {
    ...state,
    fetchWallet,
    createWallet,
    unlockWallet,
    lockWallet,
    signMessage,
    signTransaction,
    upgradeToPasskey,
  };
}
