import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy for route handling
 * 
 * With Alchemy Smart Wallets, authentication is handled client-side.
 * This proxy handles:
 * 1. Distinguishing profile routes from app routes
 * 2. Basic route-level redirects
 * 
 * Auth protection is handled by client-side components (OnboardingGuard, etc.)
 */

// Reserved routes that should not be treated as profile handles
const RESERVED_ROUTES = new Set([
    // App routes
    'activity', 'settings', 'setup', 'configure', 'deposit', 'withdraw',
    'documents', 'help', 'legal', 'security', 'funds', 'onboarding',
    // Auth routes  
    'login', 'logout', 'sign-in', 'sign-up', 'signin', 'signup',
    // System routes
    'api', '_next', 'static', 'public',
    // Reserved words
    'admin', 'root', 'support', 'yuki', 'system', 'wallet', 'profile',
    'user', 'users', 'account', 'home', 'dashboard', 'explore', 'search',
]);

/**
 * Check if a pathname is potentially a profile route (/<handle>)
 * Profile routes are single-segment paths that aren't reserved
 */
function isPotentialProfileRoute(pathname: string): boolean {
    // Remove leading slash and get first segment
    const segments = pathname.split('/').filter(Boolean);

    // Must be exactly one segment (e.g., /haruxe but not /haruxe/posts)
    if (segments.length !== 1) {
        return false;
    }

    const handle = segments[0].toLowerCase();

    // Not a profile if it's a reserved route
    if (RESERVED_ROUTES.has(handle)) {
        return false;
    }

    // Not a profile if it looks like a file (has extension)
    if (handle.includes('.')) {
        return false;
    }

    return true;
}

export function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Profile routes are public - anyone can view profiles
    // Just let them through - the page will handle 404 if user doesn't exist
    if (isPotentialProfileRoute(pathname)) {
        return NextResponse.next();
    }

    // All other routes proceed normally
    // Client-side components handle auth state and redirects
    return NextResponse.next();
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
