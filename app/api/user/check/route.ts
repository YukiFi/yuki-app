import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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
      // Search for user by username
      const users = await client.users.getUserList({
        username: [identifier.toLowerCase()],
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
