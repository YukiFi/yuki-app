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
    !['/activity', '/settings', '/configure', '/deposit', '/withdraw', '/funds', '/security', '/'].includes(pathname);
  
  const checkOnboardingStatus = useCallback(async (address: string) => {
    // Prevent duplicate checks for same wallet
    if (hasCheckedRef.current && lastWalletRef.current === address) {
      return;
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
        hasCheckedRef.current = true;
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
  }, []);
  
  useEffect(() => {
    // Still initializing Alchemy - wait
    if (isInitializing) return;
    
    // Public routes - no auth needed
    if (isPublicRoute || isProfileRoute) {
      return;
    }
    
    // Not connected and not on public route - redirect to login
    if (!isConnected || !walletAddress) {
      router.replace('/login');
      return;
    }
    
    // If wallet changed, reset and re-check
    if (lastWalletRef.current && lastWalletRef.current !== walletAddress) {
      hasCheckedRef.current = false;
      setOnboardingComplete(null);
    }
    
    // Already checked for this wallet - use cached result
    if (hasCheckedRef.current && lastWalletRef.current === walletAddress) {
      // Handle redirects based on cached state
      if (onboardingComplete === false && !isOnboardingRoute) {
        router.replace('/setup');
      } else if (onboardingComplete === true && isOnboardingRoute) {
        router.replace('/');
      }
      return;
    }
    
    // Need to check onboarding status
    checkOnboardingStatus(walletAddress).then((completed) => {
      if (completed === false && !isOnboardingRoute) {
        router.replace('/setup');
      } else if (completed === true && isOnboardingRoute) {
        router.replace('/');
      }
    });
  }, [isInitializing, isConnected, walletAddress, pathname, isPublicRoute, isProfileRoute, isOnboardingRoute, onboardingComplete, router, checkOnboardingStatus]);
  
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
  
  // Not connected - will redirect to login
  if (!isConnected || !walletAddress) {
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
