import { NextRequest, NextResponse } from "next/server";
import { getOpenTransfersPg } from "@/lib/db-postgres";

// GET /api/transfers/open
// Returns: { deposits: Deposit[], withdrawals: Withdrawal[] }
//
// Single endpoint feeding the StatusContext provider. Both ArrivalListener
// and StatusBanner read from this — no per-stepper-on-mount fetch. The
// architecture decision is documented at the StatusContext call site.
//
// "Open" = any non-terminal status. Deposits in intent/pending/depositing/
// retry; withdrawals in pending/redeeming/transferring/settling. Terminal
// rows (confirmed/completed/failed) drop out of this view.
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 },
      );
    }

    const { deposits, withdrawals } = await getOpenTransfersPg(walletAddress);
    return NextResponse.json({ deposits, withdrawals });
  } catch (error) {
    console.error("[transfers/open] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
