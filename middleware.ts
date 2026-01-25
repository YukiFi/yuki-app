import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/setup(.*)",
  "/documents(.*)",
  "/legal(.*)",
  "/help(.*)",
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

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const pathname = request.nextUrl.pathname;
  
  // If user is logged in and tries to access login page, redirect to dashboard
  // (The OnboardingGuard will handle redirecting to /setup if needed)
  if (userId && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // Profile routes are public - anyone can view profiles
  if (isPotentialProfileRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Protect all non-public routes - redirect to custom login page
  if (!isPublicRoute(request) && !userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
