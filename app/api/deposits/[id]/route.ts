import { NextRequest, NextResponse } from "next/server";
import { getDepositByIdPg } from "@/lib/db-postgres";

// GET /api/deposits/[id]
// Auth-scoped to the wallet in `x-wallet-address` — useTransferStatus
// selectors should rarely call this directly (StatusContext owns the read
// path), but it's here for direct lookups and the status-banner retry flow.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const deposit = await getDepositByIdPg(id, walletAddress);
    if (!deposit) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ deposit });
  } catch (error) {
    console.error("[deposits/[id]] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
