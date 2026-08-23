import { NextResponse } from "next/server";
import { buildTradeProposal } from "@/lib/copilot/buildTradeProposal";
import type { Side } from "@/types/market";

/**
 * Sizing assumes this until the desk reads the connected wallet's balance.
 * The approval card shows the cost, so the trader sees what it would spend.
 */
const ASSUMED_BANKROLL_USDC = 500;

/**
 * Draws up a trade the trader asked for by pointing rather than typing.
 *
 * A buy button on a market row and a sentence in the copilot end up in exactly
 * the same place: this builds the proposal through the same function the model
 * uses, so the tick snapping, status gate, expiry headroom and balance check
 * are identical no matter how the intent arrived.
 */
export async function POST(request: Request) {
  const { marketId, side, contracts } = (await request.json()) as {
    marketId: string;
    side: Side;
    contracts: number;
  };

  const proposal = await buildTradeProposal({
    marketId,
    side,
    contracts,
    availableUsdc: ASSUMED_BANKROLL_USDC,
  });

  if (!proposal) {
    return NextResponse.json({ error: "That market is no longer open." }, { status: 404 });
  }

  return NextResponse.json({ proposal });
}
