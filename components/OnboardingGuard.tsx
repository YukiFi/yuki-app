/**
 * Onboarding Guard
 * 
 * Wrapper component that checks if the user has completed onboarding.
 * Redirects to /setup if they haven't set a username yet.
 * 
 * Key features:
 * - Only checks once per session (cached result)
 * - Doesn't re-check on every navigation
 * - Handles race conditions gracefully
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

// Routes that don't need onboarding check at all
const PUBLIC_ROUTES = ['/login', '/documents', '/legal', '/help'];
// Routes accessible during onboarding
const ONBOARDING_ROUTES = ['/setup'];

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  
  // Track onboarding state - null = not checked yet
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // Use ref to prevent duplicate checks
  const hasCheckedRef = useRef(false);
  const lastClerkIdRef = useRef<string | null>(null);
  
  // Check if current route is public (no auth needed)
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));
  const isOnboardingRoute = ONBOARDING_ROUTES.some(route => pathname?.startsWith(route));
  
  const checkOnboardingStatus = useCallback(async (clerkUserId: string) => {
    // Prevent duplicate checks for same user
    if (hasCheckedRef.current && lastClerkIdRef.current === clerkUserId) {
      return;
    }
    
    setIsChecking(true);
    
    try {
      const response = await fetch('/api/auth/onboarding-status', {
        credentials: 'include',
        // Add cache control to prevent stale responses
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const completed = !!data.completed;
        
        setOnboardingComplete(completed);
        hasCheckedRef.current = true;
        lastClerkIdRef.current = clerkUserId;
        
        return completed;
      } else if (response.status === 401) {
        // Not authenticated - this is fine, Clerk middleware will handle it
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
    // Not loaded yet - wait
    if (!isLoaded) return;
    
    // Not signed in - nothing to check
    if (!isSignedIn || !user?.id) {
      setOnboardingComplete(null);
      hasCheckedRef.current = false;
      return;
    }
    
    // Public routes don't need onboarding check
    if (isPublicRoute) {
      return;
    }
    
    // If user changed (different Clerk ID), reset and re-check
    if (lastClerkIdRef.current && lastClerkIdRef.current !== user.id) {
      hasCheckedRef.current = false;
      setOnboardingComplete(null);
    }
    
    // Already checked for this user - use cached result
    if (hasCheckedRef.current && lastClerkIdRef.current === user.id) {
      // Handle redirects based on cached state
      if (onboardingComplete === false && !isOnboardingRoute) {
        router.replace('/setup');
      } else if (onboardingComplete === true && isOnboardingRoute) {
        router.replace('/');
      }
      return;
    }
    
    // Need to check onboarding status
    checkOnboardingStatus(user.id).then((completed) => {
      if (completed === false && !isOnboardingRoute) {
        router.replace('/setup');
      } else if (completed === true && isOnboardingRoute) {
        router.replace('/');
      }
    });
  }, [isLoaded, isSignedIn, user?.id, pathname, isPublicRoute, isOnboardingRoute, onboardingComplete, router, checkOnboardingStatus]);
  
  // Public routes - render immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  // Still loading Clerk
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
      </div>
    );
  }
  
  // Not signed in - Clerk middleware will redirect to login
  if (!isSignedIn) {
    return <>{children}</>;
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
