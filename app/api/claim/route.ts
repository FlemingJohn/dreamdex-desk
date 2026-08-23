import { NextResponse } from "next/server";
import { getMockPortfolio, sumUnclaimedWinnings } from "@/lib/mock/mockPortfolio";

/**
 * Redeems every settled market that still owes the trader money.
 *
 * Claiming does not need the approval card a trade does. A trade can lose you
 * money; a claim can only ever pay you, so the worst case is wasted gas. A
 * plain confirmation is the proportionate guard.
 *
 * Wiring this up means sweeping markets with the "Finalized" status and
 * redeeming each with an explicit outcome index — the ordinary market list
 * cannot see settled markets at all, which is exactly why this money goes
 * unnoticed.
 */
export async function POST() {
  const portfolio = getMockPortfolio();
  const claimed = sumUnclaimedWinnings(portfolio);

  return NextResponse.json({
    claimedUsdc: claimed,
    marketsSwept: portfolio.unclaimedWinnings.length,
    transactionHash: `0xclaim${Date.now().toString(16).slice(-6)}`,
  });
}
