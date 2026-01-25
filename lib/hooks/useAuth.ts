/**
 * Authentication hook for user session management
 * 
 * This hook wraps Clerk's authentication with additional
 * user data from our internal database (wallet info, username, etc.)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

export interface UserData {
  id: string;
  clerkId: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  username: string | null;
  hasWallet: boolean;
  walletAddress?: string;
  securityLevel?: 'password_only' | 'passkey_enabled';
  hasPasskey?: boolean;
}

export interface AuthState {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useAuth() {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const fetchUserData = useCallback(async () => {
    if (!clerkLoaded) return;
    
    if (!isSignedIn || !clerkUser) {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
      return;
    }
    
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        // Even if API fails, we're still authenticated via Clerk
        // Use Clerk data as fallback
        setState({
          user: {
            id: clerkUser.id,
            clerkId: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || null,
            phone: clerkUser.primaryPhoneNumber?.phoneNumber || null,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
            username: null,
            hasWallet: false,
          },
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      }
    } catch (error) {
      // Fallback to Clerk data on network error
      setState({
        user: {
          id: clerkUser.id,
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || null,
          phone: clerkUser.primaryPhoneNumber?.phoneNumber || null,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
          username: null,
          hasWallet: false,
        },
        isLoading: false,
        isAuthenticated: true,
        error: 'Failed to fetch user data',
      });
    }
  }, [clerkLoaded, isSignedIn, clerkUser]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const logout = async (): Promise<void> => {
    try {
      await signOut();
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
    // Expose Clerk's raw data for advanced use cases
    clerkUser,
    clerkLoaded,
  };
}
