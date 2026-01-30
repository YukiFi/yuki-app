/**
 * Onboarding Guard
 * 
 * Wrapper component that checks if the user has completed onboarding.
 * Redirects to /setup if they haven't set a username yet.
 * Redirects to /login if not authenticated.
 * 
 * Key features:
 * - Only checks once per session (cached result)
 * - Doesn't re-check on every navigation
 * - Handles race conditions gracefully
 * - Waits for auth state to stabilize before redirecting
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSignerStatus, useSmartAccountClient } from '@account-kit/react';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

// Routes that don't need authentication at all
const PUBLIC_ROUTES = ['/login', '/documents', '/legal', '/help'];
// Routes accessible during onboarding
const ONBOARDING_ROUTES = ['/setup'];

// Time to wait after initialization before redirecting to login (ms)
// This prevents redirect loops during Alchemy rehydration
const AUTH_STABILIZATION_DELAY = 500;

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isConnected, isInitializing } = useSignerStatus();
  const { client } = useSmartAccountClient({});
  const router = useRouter();
  const pathname = usePathname();

  // Get wallet address from smart account client
  const walletAddress = client?.account?.address;

  // Track onboarding state - null = not checked yet
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Track if auth state has stabilized (prevents redirect loops)
  const [authStabilized, setAuthStabilized] = useState(false);

  // Use ref to prevent duplicate checks
  const hasCheckedRef = useRef(false);
  const lastWalletRef = useRef<string | null>(null);

  // Check if current route is public (no auth needed)
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));
  const isOnboardingRoute = ONBOARDING_ROUTES.some(route => pathname?.startsWith(route));

  // Check if this is a profile route (/@handle or /handle pattern)
  const isProfileRoute = pathname && !pathname.startsWith('/api') &&
    pathname.split('/').filter(Boolean).length === 1 &&
    !PUBLIC_ROUTES.some(route => pathname.startsWith(route)) &&
    !ONBOARDING_ROUTES.some(route => pathname.startsWith(route)) &&
    !['/activity', '/settings', '/configure', '/deposit', '/withdraw', '/funds', '/security', '/contacts', '/'].includes(pathname);

  const checkOnboardingStatus = useCallback(async (address: string, forceCheck = false) => {
    // Check sessionStorage cache first (persists across page refreshes)
    const cacheKey = `onboarding_complete_${address}`;
    if (!forceCheck) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached === 'true') {
          setOnboardingComplete(true);
          hasCheckedRef.current = true;
          lastWalletRef.current = address;
          return true;
        }
      } catch (e) {
        // sessionStorage not available, continue with API check
      }
    }

    // Prevent duplicate checks for same wallet - but only if onboarding is complete
    // We always re-check if onboarding was incomplete (user might have just finished setup)
    if (!forceCheck && hasCheckedRef.current && lastWalletRef.current === address && onboardingComplete === true) {
      return onboardingComplete;
    }

    setIsChecking(true);

    try {
      const response = await fetch('/api/auth/onboarding-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (response.ok) {
        const data = await response.json();
        const completed = !!data.completed;

        setOnboardingComplete(completed);
        // Cache completed status in sessionStorage and memory
        if (completed) {
          hasCheckedRef.current = true;
          try {
            sessionStorage.setItem(cacheKey, 'true');
          } catch (e) {
            // sessionStorage not available, continue without caching
          }
        } else {
          // Clear cache if onboarding is not complete
          try {
            sessionStorage.removeItem(cacheKey);
          } catch (e) {
            // Ignore
          }
        }
        lastWalletRef.current = address;

        return completed;
      } else if (response.status === 401) {
        // Not authenticated
        setOnboardingComplete(null);
        return null;
      } else {
        // Server error - don't block the user
        console.error('Onboarding check failed:', response.status);
        setOnboardingComplete(true); // Assume complete on error
        return true;
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      // On network error, don't block the user
      setOnboardingComplete(true);
      return true;
    } finally {
      setIsChecking(false);
    }
  }, [onboardingComplete]);

  // Wait for auth state to stabilize after initialization
  // This prevents redirect loops when Alchemy is rehydrating session
  useEffect(() => {
    if (isInitializing) {
      setAuthStabilized(false);
      return;
    }

    // Once initialization is complete, wait a bit for session rehydration
    const timer = setTimeout(() => {
      setAuthStabilized(true);
    }, AUTH_STABILIZATION_DELAY);

    return () => clearTimeout(timer);
  }, [isInitializing]);

  // Clear cache when wallet changes
  useEffect(() => {
    if (walletAddress && lastWalletRef.current && lastWalletRef.current !== walletAddress) {
      try {
        const oldCacheKey = `onboarding_complete_${lastWalletRef.current}`;
        sessionStorage.removeItem(oldCacheKey);
      } catch (e) {
        // Ignore
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    // Still initializing Alchemy - wait
    if (isInitializing) return;

    // Public routes - no auth needed
    if (isPublicRoute || isProfileRoute) {
      return;
    }

    // If connected, we can proceed immediately (no need to wait for stabilization)
    if (isConnected && walletAddress) {
      // If wallet changed, reset and re-check
      if (lastWalletRef.current && lastWalletRef.current !== walletAddress) {
        hasCheckedRef.current = false;
        setOnboardingComplete(null);
      }

      // If onboarding is already confirmed complete, use cached result
      if (hasCheckedRef.current && lastWalletRef.current === walletAddress && onboardingComplete === true) {
        // User has completed onboarding - if they're on setup, redirect to home
        if (isOnboardingRoute) {
          router.replace('/');
        }
        return;
      }

      // Need to check onboarding status (always check if not confirmed complete)
      checkOnboardingStatus(walletAddress).then((completed) => {
        if (completed === false && !isOnboardingRoute) {
          router.replace('/setup');
        } else if (completed === true && isOnboardingRoute) {
          router.replace('/');
        }
      });
      return;
    }

    // Not connected - but wait for auth to stabilize before redirecting
    // This prevents redirect loops during Alchemy session rehydration
    if (!authStabilized) {
      return;
    }

    // Auth has stabilized and user is not connected - redirect to login
    router.replace('/login');
  }, [isInitializing, isConnected, walletAddress, pathname, isPublicRoute, isProfileRoute, isOnboardingRoute, onboardingComplete, router, checkOnboardingStatus, authStabilized]);

  // Public routes and profile routes - render immediately
  if (isPublicRoute || isProfileRoute) {
    return <>{children}</>;
  }

  // Still initializing Alchemy
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
      </div>
    );
  }

  // Not connected - wait for auth to stabilize before showing redirect spinner
  // This prevents flash of redirect when Alchemy is rehydrating
  if (!isConnected || !walletAddress) {
    // If auth hasn't stabilized yet, show loading (session might be rehydrating)
    // Once stabilized, the useEffect will handle the redirect
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
      </div>
    );
  }

  // Checking onboarding status (first time only)
  if (isChecking || onboardingComplete === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
      </div>
    );
  }

  // Onboarding not complete but on setup page - render setup
  if (!onboardingComplete && isOnboardingRoute) {
    return <>{children}</>;
  }

  // Onboarding complete - render children
  if (onboardingComplete) {
    return <>{children}</>;
  }

  // Onboarding not complete and not on setup - show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
    </div>
  );
}
