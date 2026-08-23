import { NextResponse } from "next/server";
import type { TradeProposal } from "@/types/copilot";

/**
 * Signs and sends a trade the trader approved.
 *
 * This is deliberately the only path to the chain, and it is only ever reached
 * by a person pressing approve. The copilot cannot call it — it has no such
 * tool — so no sequence of model output can move funds on its own.
 *
 * While the app runs on mock data this returns a stand-in hash. Wiring it up
 * means placing the order through the markets SDK with the proposal's already
 * tick-snapped price, then returning the real receipt.
 */
export async function POST(request: Request) {
  const { proposal } = (await request.json()) as { proposal: TradeProposal };

  if (!proposal) {
    return NextResponse.json({ error: "No proposal supplied." }, { status: 400 });
  }

  const failedCheck = proposal.checks.find((check) => !check.passed);
  if (failedCheck) {
    return NextResponse.json(
      { error: `Refusing to send: ${failedCheck.label} did not pass.` },
      { status: 400 }
    );
  }

  const simulatedHash = `0x${proposal.proposalId.replace(/[^a-f0-9]/gi, "").slice(0, 8)}...${Date.now()
    .toString(16)
    .slice(-4)}`;

  return NextResponse.json({ transactionHash: simulatedHash });
}
