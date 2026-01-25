import { clerkClient } from "@clerk/nextjs/server";
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

    const client = await clerkClient();

    if (type === "phone") {
      // Search for user by phone number (should be in E.164 format like +17143164753)
      const users = await client.users.getUserList({
        phoneNumber: [identifier],
      });

      return NextResponse.json({ exists: users.totalCount > 0 });
    } else if (type === "username") {
      // Check both Clerk and our internal database
      const cleanUsername = identifier.startsWith("@") ? identifier : `@${identifier}`;
      
      // Check our internal database first
      const internalUser = await getUserByUsername(cleanUsername);
      if (internalUser) {
        return NextResponse.json({ exists: true });
      }
      
      // Also check Clerk (in case username is stored there too)
      const users = await client.users.getUserList({
        username: [identifier.toLowerCase().replace('@', '')],
      });

      return NextResponse.json({ exists: users.totalCount > 0 });
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
