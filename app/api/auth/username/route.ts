import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUsername } from "@/lib/db";
import { getSession } from "@/lib/db";

// Mock user data for testing - in production this would be in the DB
// This is needed because the in-memory DB is empty on server restart
const MOCK_USER_ID = "mock-user-123";

export async function POST(req: NextRequest) {
  try {
    const { username, userId } = await req.json();

    if (!userId || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Rate limit check
    const user = await getUserById(userId);
    if (user && user.username_last_changed) {
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
    await updateUsername(userId, username);

    return NextResponse.json({ success: true, username });
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
   const userId = searchParams.get("userId");

   if (!userId) {
     return NextResponse.json({ error: "User ID required" }, { status: 400 });
   }

   const user = await getUserById(userId);
   
   return NextResponse.json({
     username: user?.username || null,
     lastChanged: user?.username_last_changed || null
   });
}

