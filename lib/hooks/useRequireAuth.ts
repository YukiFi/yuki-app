/**
 * Hook for protecting routes that require authentication
 * Handles consistent auth checks and redirects
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthCheckResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    email: string;
    hasWallet: boolean;
    walletAddress?: string;
    passkey_credential_id?: string | null;
  } | null;
}

export function useRequireAuth(): AuthCheckResult {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthCheckResult['user']>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          router.push('/login');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setUser(null);
        router.push('/login');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth updates
    const handleAuthUpdate = () => {
      checkAuth();
    };

    window.addEventListener('yuki_login_update', handleAuthUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('yuki_login_update', handleAuthUpdate);
    };
  }, [router]);

  return { isAuthenticated, isLoading, user };
}

