import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUserByClerkId, updateUsername, getUserByUsername } from "@/lib/db";

const RESERVED_USERNAMES = [
  "admin", "root", "support", "help", "yuki", "system", "wallet",
  "api", "www", "mail", "ftp", "localhost", "webmaster", "postmaster",
  "hostmaster", "info", "contact", "abuse", "security", "privacy"
];

// Username validation constants
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;
const USERNAME_PATTERN = /^@?[a-zA-Z0-9_]+$/;
const COOLDOWN_DAYS = 30;

/**
 * Normalize username to consistent format with @ prefix
 */
function normalizeUsername(input: string): string {
  const trimmed = input.trim();
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

/**
 * Validate username format and rules
 */
function validateUsername(username: string): { valid: boolean; error?: string } {
  const usernameWithoutAt = username.startsWith("@") ? username.slice(1) : username;
  
  if (usernameWithoutAt.length < MIN_USERNAME_LENGTH) {
    return { valid: false, error: `Username must be at least ${MIN_USERNAME_LENGTH} characters` };
  }
  
  if (usernameWithoutAt.length > MAX_USERNAME_LENGTH) {
    return { valid: false, error: `Username must be at most ${MAX_USERNAME_LENGTH} characters` };
  }
  
  if (!USERNAME_PATTERN.test(username)) {
    return { valid: false, error: "Username can only contain letters, numbers, and underscores" };
  }
  
  if (RESERVED_USERNAMES.includes(usernameWithoutAt.toLowerCase())) {
    return { valid: false, error: "This username is reserved" };
  }
  
  return { valid: true };
}

/**
 * Check if user is within the username change cooldown period
 */
function checkCooldown(lastChanged: Date | null): { allowed: boolean; daysRemaining?: number } {
  if (!lastChanged) {
    return { allowed: true };
  }
  
  const now = new Date();
  const daysSinceChange = (now.getTime() - new Date(lastChanged).getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceChange < COOLDOWN_DAYS) {
    return { allowed: false, daysRemaining: Math.ceil(COOLDOWN_DAYS - daysSinceChange) };
  }
  
  return { allowed: true };
}

/**
 * POST /api/auth/username
 * 
 * Set or update the user's username.
 * 
 * Idempotency: Setting the same username twice returns success.
 * Rate limited: 30 day cooldown between changes (except first-time setup).
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate with Clerk
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    let body: { username?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const { username: rawUsername } = body;
    
    if (!rawUsername || typeof rawUsername !== "string") {
      return NextResponse.json(
        { error: "Username is required", code: "MISSING_USERNAME" },
        { status: 400 }
      );
    }
    
    // 3. Normalize and validate username
    const username = normalizeUsername(rawUsername);
    const validation = validateUsername(username);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, code: "INVALID_USERNAME" },
        { status: 400 }
      );
    }
    
    // 4. Get or create user from Clerk ID
    const user = await getOrCreateUserByClerkId(clerkUserId);

    // 5. Idempotency check: if setting same username, return success
    if (user.username?.toLowerCase() === username.toLowerCase()) {
      return NextResponse.json({ 
        success: true, 
        username: user.username,
        lastChanged: user.username_last_changed?.toISOString() || null,
        message: "Username unchanged"
      });
    }
    
    // 6. Check cooldown (only if user already has a username)
    if (user.username) {
      const cooldown = checkCooldown(user.username_last_changed);
      if (!cooldown.allowed) {
        return NextResponse.json(
          { 
            error: `Username can only be changed once every ${COOLDOWN_DAYS} days. Try again in ${cooldown.daysRemaining} days.`,
            code: "RATE_LIMITED",
            daysRemaining: cooldown.daysRemaining
          },
          { status: 429 }
        );
      }
    }

    // 7. Check if username is taken by another user
    const existingUser = await getUserByUsername(username);
    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json(
        { error: "Username is already taken", code: "USERNAME_TAKEN" },
        { status: 409 }
      );
    }

    // 8. Update username (handles DB constraint errors)
    try {
      await updateUsername(user.id, username);
    } catch (error) {
      // Handle race condition where username was taken between check and update
      if (error instanceof Error && error.message === "Username is already taken") {
        return NextResponse.json(
          { error: "Username is already taken", code: "USERNAME_TAKEN" },
          { status: 409 }
        );
      }
      // Re-throw other errors to be caught by outer handler
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      username,
      lastChanged: new Date().toISOString()
    });
  } catch (error) {
    console.error("[API] Username update error:", error);
    
    // Provide more context for debugging in development
    const isDev = process.env.NODE_ENV !== "production";
    const errorMessage = isDev && error instanceof Error 
      ? `Internal server error: ${error.message}`
      : "Internal server error";
    
    return NextResponse.json(
      { error: errorMessage, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/username
 * 
 * Get current user's username and change eligibility.
 */
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Get or create user from Clerk ID
    const user = await getOrCreateUserByClerkId(clerkUserId);
    
    // Calculate cooldown status
    const cooldown = checkCooldown(user.username_last_changed);
    
    return NextResponse.json({
      username: user.username || null,
      lastChanged: user.username_last_changed?.toISOString() || null,
      canChange: user.username ? cooldown.allowed : true, // First-time setup always allowed
      daysUntilChange: cooldown.daysRemaining || 0
    });
  } catch (error) {
    console.error("[API] Get username error:", error);
    
    const isDev = process.env.NODE_ENV !== "production";
    const errorMessage = isDev && error instanceof Error 
      ? `Internal server error: ${error.message}`
      : "Internal server error";
    
    return NextResponse.json(
      { error: errorMessage, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
