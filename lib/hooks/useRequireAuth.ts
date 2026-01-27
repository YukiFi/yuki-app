/**
 * Hook for protecting routes that require authentication
 * Uses Alchemy Smart Wallets for auth state
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignerStatus, useSmartAccountClient, useUser as useAlchemyUser } from '@account-kit/react';

export interface AuthCheckResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    walletAddress: string;
    email: string | null;
  } | null;
}

export function useRequireAuth(): AuthCheckResult {
  const router = useRouter();
  const { isConnected, isInitializing } = useSignerStatus();
  const { client } = useSmartAccountClient({});
  const alchemyUser = useAlchemyUser();
  
  const walletAddress = client?.account?.address;

  useEffect(() => {
    // Redirect to login if not connected after initialization
    if (!isInitializing && !isConnected) {
      router.push('/login');
    }
  }, [isInitializing, isConnected, router]);

  return { 
    isAuthenticated: isConnected,
    isLoading: isInitializing,
    user: walletAddress ? {
      walletAddress,
      email: alchemyUser?.email || null,
    } : null,
  };
}
