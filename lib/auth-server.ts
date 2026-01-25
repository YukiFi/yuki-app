/**
 * Server-side authentication utilities using Clerk
 * 
 * This module provides helper functions for authenticating users
 * in API routes and server components using Clerk's server-side SDK.
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Require authentication for an API route
 * Throws if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

/**
 * Get the authenticated user's Clerk ID, or null if not authenticated
 */
export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Get the authenticated user's full details from Clerk
 */
export async function getAuthenticatedUser() {
  const user = await currentUser();
  if (!user) return null;
  
  return {
    id: user.id,
    phone: user.primaryPhoneNumber?.phoneNumber || null,
    email: user.primaryEmailAddress?.emailAddress || null,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt,
  };
}

/**
 * Helper to return a 401 Unauthorized response
 */
export function unauthorizedResponse(message: string = "Not authenticated") {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Helper to return a 404 Not Found response
 */
export function notFoundResponse(message: string = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Helper to return a 400 Bad Request response
 */
export function badRequestResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Helper to return a 500 Internal Server Error response
 */
export function serverErrorResponse(message: string = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

