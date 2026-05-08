import { NextRequest, NextResponse } from "next/server";
import { getUserByWalletAddress } from "@/lib/db";
import { createDepositIntentPg } from "@/lib/db-postgres";
import { USDC_ADDRESS, USDC_DECIMALS } from "@/lib/transactions/sendYUSD";
import { symbolForToken } from "@/lib/yusd";

// POST /api/deposits/intent
// Body: { fiatAmountUsd: number }   (the dollar amount the user is buying)
// Returns: { id, intentId }
//
// Called from the funds page right before the Coinbase popup opens. The
// returned `intentId` is appended to the Coinbase URL as `partnerUserRef`,
// so we can correlate the popup completion to this DB row even before the
// on-chain USDC transfer arrives.
//
// `amountWei` is the *expected* USDC amount (best-effort from the quote),
// stored so the arrival handler can match this intent to the inbound
// transfer by exact amount. If the quote shifts during the popup flow, the
// match falls through to "fresh non-intent arrival" — still recorded, just
// not linked to this intent. That's fine for v1.
export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { fiatAmountUsd } = body as { fiatAmountUsd?: number };
    if (typeof fiatAmountUsd !== "number" || fiatAmountUsd <= 0) {
      return NextResponse.json(
        { error: "fiatAmountUsd must be a positive number" },
        { status: 400 },
      );
    }

    const user = await getUserByWalletAddress(walletAddress);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // USDC arrives 1:1 with USD (assuming the quote returns near-1:1; the
    // arrival matcher uses tolerance). Convert dollars to USDC wei for the
    // expected-amount field on the row.
    const amountWei = (
      BigInt(Math.round(fiatAmountUsd * 100)) *
      BigInt(10) ** BigInt(USDC_DECIMALS - 2)
    ).toString();

    const intentId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const id = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const row = await createDepositIntentPg({
      id,
      userId: user.id,
      walletAddress,
      intentId,
      amountWei,
      tokenAddress: USDC_ADDRESS,
      tokenSymbol: symbolForToken(USDC_ADDRESS, "USDC"),
      fiatStatus: "pending",
    });

    if (!row) {
      // ON CONFLICT (intent_id) DO NOTHING returned no row — should never
      // happen since we just generated the UUID, but bail clearly if so.
      return NextResponse.json(
        { error: "Failed to create deposit intent" },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: row.id, intentId: row.intent_id });
  } catch (error) {
    console.error("[deposits/intent] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
