/**
 * Authentication hook for user session management
 * 
 * This hook uses Alchemy Smart Wallets for authentication.
 * The wallet address becomes the user's primary identifier.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  useUser as useAlchemyUser,
  useLogout as useAlchemyLogout,
  useSignerStatus,
  useSmartAccountClient,
} from '@account-kit/react';

export interface UserData {
  id: string;
  walletAddress: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  hasWallet: boolean;
}

export interface AuthState {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useAuth() {
  // Alchemy hooks for authentication state
  const alchemyUser = useAlchemyUser();
  const { isConnected, isInitializing } = useSignerStatus();
  const { logout: alchemyLogout } = useAlchemyLogout();
  const { client } = useSmartAccountClient({});
  
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Get wallet address from smart account client
  const walletAddress = client?.account?.address;

  const fetchUserData = useCallback(async () => {
    // Still initializing Alchemy
    if (isInitializing) return;
    
    // Not connected
    if (!isConnected || !walletAddress) {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
      return;
    }
    
    try {
      // Fetch user data from our API using wallet address
      const response = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setState({
          user: {
            id: data.user?.id || walletAddress,
            walletAddress: walletAddress,
            email: alchemyUser?.email || null,
            username: data.user?.username || null,
            displayName: data.user?.displayName || null,
            avatarUrl: data.user?.avatarUrl || null,
            hasWallet: true,
          },
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else if (response.status === 404) {
        // User doesn't exist in our DB yet - they need to complete onboarding
        setState({
          user: {
            id: walletAddress,
            walletAddress: walletAddress,
            email: alchemyUser?.email || null,
            username: null,
            displayName: null,
            avatarUrl: null,
            hasWallet: true,
          },
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        // Other error - still authenticated but couldn't fetch profile
        setState({
          user: {
            id: walletAddress,
            walletAddress: walletAddress,
            email: alchemyUser?.email || null,
            username: null,
            displayName: null,
            avatarUrl: null,
            hasWallet: true,
          },
          isLoading: false,
          isAuthenticated: true,
          error: 'Failed to fetch user profile',
        });
      }
    } catch (error) {
      // Network error - still authenticated
      setState({
        user: {
          id: walletAddress,
          walletAddress: walletAddress,
          email: alchemyUser?.email || null,
          username: null,
          displayName: null,
          avatarUrl: null,
          hasWallet: true,
        },
        isLoading: false,
        isAuthenticated: true,
        error: 'Network error fetching user data',
      });
    }
  }, [isInitializing, isConnected, walletAddress, alchemyUser?.email]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const logout = async (): Promise<void> => {
    try {
      await alchemyLogout();
    } finally {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    }
  };

  const refreshUser = fetchUserData;

  return {
    ...state,
    logout,
    refreshUser,
    // Expose wallet address directly for convenience
    walletAddress,
    // Expose Alchemy's raw data for advanced use cases
    alchemyUser,
    isConnected,
    isInitializing,
  };
}
