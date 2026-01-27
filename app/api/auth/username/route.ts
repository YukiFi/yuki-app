import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserByWalletAddress, updateUsername, getUserByUsername } from "@/lib/db";

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
 * Extract wallet address from request
 */
async function getWalletAddressFromRequest(req: NextRequest): Promise<{ walletAddress: string | null; body: Record<string, unknown> }> {
  try {
    const body = await req.json();
    const walletAddress = body.walletAddress as string | undefined;
    
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      return { walletAddress: null, body };
    }
    
    return { walletAddress: walletAddress.toLowerCase(), body };
  } catch {
    return { walletAddress: null, body: {} };
  }
}

/**
 * POST /api/auth/username
 * 
 * Set or update the user's username.
 * Uses wallet address as the user identifier.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate with wallet address
    const { walletAddress, body } = await getWalletAddressFromRequest(req);
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const rawUsername = body.username as string | undefined;
    
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
    
    // 4. Get or create user from wallet address
    const user = await getOrCreateUserByWalletAddress(walletAddress);

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

    // 8. Update username
    try {
      await updateUsername(user.id, username);
    } catch (error) {
      if (error instanceof Error && error.message === "Username is already taken") {
        return NextResponse.json(
          { error: "Username is already taken", code: "USERNAME_TAKEN" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      username,
      lastChanged: new Date().toISOString()
    });
  } catch (error) {
    console.error("[API] Username update error:", error);
    
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
export async function GET(req: NextRequest) {
  try {
    const walletAddress = req.headers.get('x-wallet-address');
    
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/i)) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Get or create user from wallet address
    const user = await getOrCreateUserByWalletAddress(walletAddress.toLowerCase());
    
    // Calculate cooldown status
    const cooldown = checkCooldown(user.username_last_changed);
    
    return NextResponse.json({
      username: user.username || null,
      lastChanged: user.username_last_changed?.toISOString() || null,
      canChange: user.username ? cooldown.allowed : true,
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
