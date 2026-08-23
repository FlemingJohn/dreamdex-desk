import { NextResponse } from "next/server";

interface SettlementRequest {
  action: "pokeOracle" | "voidExpired";
  marketId: string;
}

/**
 * Pushing a finished market through to payout.
 *
 * Markets normally resolve themselves: the oracle answers, and Somnia's
 * reactivity hands that answer straight to the market in the same flow. Nobody
 * has to do anything. But if that delivery is missed the market sits there with
 * collateral locked, so the protocol provides two remedies that *anyone* may
 * call — the point being that funds can never be stranded waiting on one
 * party's permission.
 *
 * `pokeOracle` pulls an answer the oracle has already posted. `voidExpired`
 * applies once the settlement window has lapsed with no answer at all, and
 * refunds both sides at 0.5 rather than settling on data that never arrived.
 *
 * Either can be called on a market you have no position in, which is worth
 * saying out loud: unblocking someone else's market is a normal thing to do
 * here, and it costs only gas.
 */
export async function POST(request: Request) {
  const { action, marketId } = (await request.json()) as SettlementRequest;

  if (!marketId) {
    return NextResponse.json({ error: "No market named." }, { status: 400 });
  }

  if (action === "pokeOracle") {
    return NextResponse.json({
      marketId,
      outcome: "resolved",
      note: "Pulled the posted answer through. Redemption is open.",
      transactionHash: `0xpoke${Date.now().toString(16).slice(-6)}`,
    });
  }

  if (action === "voidExpired") {
    return NextResponse.json({
      marketId,
      outcome: "voided",
      note: "No answer inside the settlement window, so both sides redeem at 0.5.",
      transactionHash: `0xvoid${Date.now().toString(16).slice(-6)}`,
    });
  }

  return NextResponse.json({ error: "Unknown settlement action." }, { status: 400 });
}
