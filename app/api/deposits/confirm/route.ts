import { NextRequest, NextResponse } from "next/server";
import {
  recordDepositArrivalPg,
  setDepositOpHashPg,
  markDepositTerminalPg,
  getDepositByTxHashPg,
} from "@/lib/db-postgres";
import { USDC_ADDRESS } from "@/lib/transactions/sendYUSD";
import { symbolForToken } from "@/lib/yusd";

// POST /api/deposits/confirm
// Body: { txHash: string, amountWei: string, depositOpHash?: string, terminal?: 'confirmed' | 'retry' | 'failed' }
//
// Called by the client when:
//   1. The arrival listener detects an inbound USDC transfer to the smart
//      wallet (initial confirm — claims an open intent or creates a fresh
//      "pending" row, idempotent on tx_hash).
//   2. The auto-deposit UserOp resolves (sets `deposit_op_hash` and flips
//      status to 'depositing').
//   3. The UserOp receipt is mined (terminal transition to 'confirmed').
//   4. The UserOp errors or vault is paused (terminal 'retry' or 'failed').
//
// Idempotent at every step: tx_hash UNIQUE, deposit_op_hash UNIQUE-when-set,
// terminal status writes are absorbed by the deposit row's status field.
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
    const {
      txHash,
      amountWei,
      depositOpHash,
      terminal,
    } = body as {
      txHash?: string;
      amountWei?: string;
      depositOpHash?: string;
      terminal?: "confirmed" | "retry" | "failed";
    };

    if (!txHash || typeof txHash !== "string") {
      return NextResponse.json(
        { error: "txHash required" },
        { status: 400 },
      );
    }

    // Step 1 — first time we see this tx_hash, claim an intent or create a
    // fresh row. amountWei must match the intent for the claim to succeed.
    let row = await getDepositByTxHashPg(txHash);
    if (!row) {
      if (!amountWei) {
        return NextResponse.json(
          { error: "amountWei required on first arrival" },
          { status: 400 },
        );
      }
      row = await recordDepositArrivalPg({
        walletAddress,
        txHash,
        amountWei,
        tokenAddress: USDC_ADDRESS,
        tokenSymbol: symbolForToken(USDC_ADDRESS, "USDC"),
      });
    }

    if (!row) {
      // Should be unreachable: either we found an existing row above, or
      // recordDepositArrivalPg created one. Defensive 500.
      return NextResponse.json(
        { error: "Failed to record arrival" },
        { status: 500 },
      );
    }

    // Wallet-address scope check. The DB writes are claim-an-existing-row
    // by amount, so a malicious caller theoretically can't reach into
    // another user's row — but verify anyway in case of future schema drift.
    if (row.wallet_address.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Wallet address mismatch" },
        { status: 403 },
      );
    }

    // Step 2 — caller is reporting the auto-deposit UserOp hash. Idempotent:
    // setDepositOpHashPg only writes if deposit_op_hash is currently NULL.
    if (depositOpHash && !row.deposit_op_hash) {
      await setDepositOpHashPg(row.id, depositOpHash);
    }

    // Step 3/4 — terminal transition.
    if (terminal) {
      await markDepositTerminalPg(row.id, terminal);
    }

    // Refresh and return the latest row for the caller's stepper.
    const updated = await getDepositByTxHashPg(txHash);
    return NextResponse.json({ deposit: updated });
  } catch (error) {
    console.error("[deposits/confirm] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
