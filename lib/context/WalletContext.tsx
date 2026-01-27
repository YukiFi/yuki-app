/**
 * Wallet Context Provider
 * 
 * Provides wallet state throughout the app.
 * With Alchemy Smart Wallets, wallet management is simplified.
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { 
  useSignerStatus,
  useSmartAccountClient,
  useUser as useAlchemyUser,
  useLogout,
} from '@account-kit/react';

interface WalletContextType {
  // Connection state
  isConnected: boolean;
  isInitializing: boolean;
  
  // Wallet info
  walletAddress: `0x${string}` | undefined;
  email: string | null;
  
  // Actions
  logout: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { isConnected, isInitializing } = useSignerStatus();
  const { client } = useSmartAccountClient({});
  const alchemyUser = useAlchemyUser();
  const { logout: alchemyLogout } = useLogout();
  
  // Get wallet address from smart account client
  const walletAddress = client?.account?.address as `0x${string}` | undefined;
  
  const logout = async () => {
    await alchemyLogout();
  };

  const value: WalletContextType = {
    isConnected,
    isInitializing,
    walletAddress,
    email: alchemyUser?.email || null,
    logout,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}
