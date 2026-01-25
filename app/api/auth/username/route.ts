import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUserByClerkId, updateUsername, getUserByUsername } from "@/lib/db";

const RESERVED_USERNAMES = [
  "admin", "root", "support", "help", "yuki", "system", "wallet", "haruxe",
  "api", "www", "mail", "ftp", "localhost", "webmaster", "postmaster",
  "hostmaster", "info", "contact", "abuse", "security", "privacy"
];

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { username } = await req.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Get user from Clerk ID
    const user = await getOrCreateUserByClerkId(clerkUserId);

    // Validate username format
    const cleanUsername = username.startsWith("@") ? username : `@${username}`;
    const usernameWithoutAt = cleanUsername.slice(1);
    
    if (cleanUsername.length < 2 || cleanUsername.length > 20) {
      return NextResponse.json(
        { error: "Username must be 1-19 characters" },
        { status: 400 }
      );
    }
    
    if (!/^@[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores" },
        { status: 400 }
      );
    }
    
    // Check reserved usernames
    if (RESERVED_USERNAMES.includes(usernameWithoutAt.toLowerCase())) {
      return NextResponse.json(
        { error: "This username is reserved" },
        { status: 400 }
      );
    }
    
    // Check if username is already taken
    const existingUser = await getUserByUsername(cleanUsername);
    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }
    
    // Rate limit check - 30 day cooldown
    if (user.username_last_changed) {
      const lastChanged = new Date(user.username_last_changed);
      const now = new Date();
      const daysSinceChange = (now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceChange < 30) {
        return NextResponse.json(
          { error: `Username can only be changed once every 30 days. Try again in ${Math.ceil(30 - daysSinceChange)} days.` },
          { status: 429 }
        );
      }
    }

    // Update username
    try {
      await updateUsername(user.id, cleanUsername);
    } catch (error) {
      if (error instanceof Error && error.message === "Username is already taken") {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      username: cleanUsername,
      lastChanged: new Date().toISOString()
    });
  } catch (error) {
    console.error("Username update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user by Clerk ID
    const user = await getOrCreateUserByClerkId(clerkUserId);
    
    // Calculate if they can change username
    let canChange = true;
    let daysUntilChange = 0;
    
    if (user.username_last_changed) {
      const lastChanged = new Date(user.username_last_changed);
      const now = new Date();
      const daysSinceChange = (now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceChange < 30) {
        canChange = false;
        daysUntilChange = Math.ceil(30 - daysSinceChange);
      }
    }
    
    return NextResponse.json({
      username: user.username || null,
      lastChanged: user.username_last_changed || null,
      canChange,
      daysUntilChange
    });
  } catch (error) {
    console.error("Get username error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
