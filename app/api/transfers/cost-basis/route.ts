import { NextRequest, NextResponse } from "next/server";
import { getCostBasisPg } from "@/lib/db-postgres";

// GET /api/transfers/cost-basis
// Returns: { deposited: string, withdrawn: string, basis: string }
// All values in token wei (USDC's 6 decimals in stub mode), as strings to
// preserve BigInt precision over the wire.
//
// Used by useBalance to compute the "earned" line on the dashboard:
//   earned = max(0, currentBalance - basis)
//
// In stub mode, basis stays in lockstep with balance (no yield accrual on
// raw USDC), so earned clamps to 0.00 — the truthful answer. The data
// accumulates correctly so vault cutover has continuity from row 1.
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 },
      );
    }
    const result = await getCostBasisPg(walletAddress);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[transfers/cost-basis] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
