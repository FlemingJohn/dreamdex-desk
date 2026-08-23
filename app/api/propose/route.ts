import { NextResponse } from "next/server";
import { buildTradeProposal } from "@/lib/copilot/buildTradeProposal";
import { readCollateralBalance } from "@/lib/exchange/readBalance";
import type { Side } from "@/types/market";


/**
 * Draws up a trade the trader asked for by pointing rather than typing.
 *
 * A buy button on a market row and a sentence in the copilot end up in exactly
 * the same place: this builds the proposal through the same function the model
 * uses, so the tick snapping, status gate, expiry headroom and balance check
 * are identical no matter how the intent arrived.
 */
export async function POST(request: Request) {
  const { marketId, side, contracts, address } = (await request.json()) as {
    marketId: string;
    side: Side;
    contracts: number;
    /** The connected wallet, so the balance check reads a real figure. */
    address?: string;
  };

  const proposal = await buildTradeProposal({
    marketId,
    side,
    contracts,
    availableUsdc: await readCollateralBalance(address),
  });

  if (!proposal) {
    return NextResponse.json({ error: "That market is no longer open." }, { status: 404 });
  }

  return NextResponse.json({ proposal });
}
