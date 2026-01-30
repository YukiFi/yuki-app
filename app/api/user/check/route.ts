/**
 * User Check API
 * 
 * Check if a username exists in the system.
 * With Alchemy Smart Wallets, we only check our internal database.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { identifier, type } = await request.json();

    if (!identifier || !type) {
      return NextResponse.json(
        { error: "Missing identifier or type" },
        { status: 400 }
      );
    }

    if (type === "username") {
      // Check our internal database
      const cleanUsername = identifier.startsWith("@") ? identifier : `@${identifier}`;
      
      const internalUser = await getUserByUsername(cleanUsername);
      
      if (internalUser) {
        return NextResponse.json({ 
          exists: true,
          user: {
            username: internalUser.username,
            displayName: internalUser.display_name,
            avatarUrl: internalUser.avatar_url,
          }
        });
      }
      
      return NextResponse.json({ exists: false });
    }

    // Phone lookup is no longer supported with Alchemy (no Clerk)
    if (type === "phone") {
      return NextResponse.json({ 
        error: "Phone lookup not supported", 
        exists: false 
      });
    }

    return NextResponse.json(
      { error: "Invalid type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
