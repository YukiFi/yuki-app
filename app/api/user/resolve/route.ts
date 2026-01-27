/**
 * User Resolve API
 * 
 * Resolve a username to a wallet address.
 * Used for sending funds to @username.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Missing username" },
        { status: 400 }
      );
    }

    // Normalize username (ensure @ prefix)
    const cleanUsername = username.startsWith("@") ? username : `@${username}`;
    
    // Look up user in database
    const user = await getUserByUsername(cleanUsername);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found", exists: false },
        { status: 404 }
      );
    }
    
    if (!user.wallet_address) {
      return NextResponse.json(
        { error: "User has no wallet", exists: true, hasWallet: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      exists: true,
      hasWallet: true,
      walletAddress: user.wallet_address,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    });
  } catch (error) {
    console.error("Error resolving user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

