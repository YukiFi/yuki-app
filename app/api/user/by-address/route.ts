import { NextRequest, NextResponse } from "next/server";
import { getUserByWalletAddress } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    const user = await getUserByWalletAddress(address);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    });
  } catch (error) {
    console.error("Error looking up user by address:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

