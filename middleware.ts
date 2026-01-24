import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/documents(.*)",
  "/legal(.*)",
  "/help(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  
  // If user is logged in and tries to access login page, redirect to dashboard
  if (userId && request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // Protect all non-public routes - redirect to custom login page
  if (!isPublicRoute(request) && !userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect_url", request.nextUrl.pathname);
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
