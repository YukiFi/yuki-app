/**
 * Wallet Context Provider
 * 
 * Provides embedded wallet state and actions throughout the app.
 * Auth is handled by Clerk, this context manages wallet-specific operations.
 */

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth, type UserData } from '@/lib/hooks/useAuth';
import { useEmbeddedWallet, type UseEmbeddedWalletReturn } from '@/lib/hooks/useEmbeddedWallet';

interface WalletContextType extends UseEmbeddedWalletReturn {
  // Auth state (from Clerk)
  user: UserData | null;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  
  // Auth actions
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const wallet = useEmbeddedWallet();

  // Fetch wallet when authenticated
  useEffect(() => {
    if (auth.isAuthenticated && !auth.isLoading) {
      wallet.fetchWallet();
    }
  }, [auth.isAuthenticated, auth.isLoading, wallet.fetchWallet]);

  const value: WalletContextType = {
    // Auth state (from Clerk)
    user: auth.user,
    isAuthLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    authError: auth.error,
    
    // Auth actions
    logout: auth.logout,
    refreshUser: auth.refreshUser,
    
    // Wallet state and actions
    ...wallet,
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
