import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserByEmail, updateUsername, getUserByEmail } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { username, email } = await req.json();

    if (!email || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get or create user by email
    const user = await getOrCreateUserByEmail(email);
    
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
    await updateUsername(user.id, username);

    return NextResponse.json({ 
      success: true, 
      username,
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Get user by email (don't create if doesn't exist for GET)
  const user = await getUserByEmail(email);
  
  return NextResponse.json({
    username: user?.username || null,
    lastChanged: user?.username_last_changed || null
  });
}
