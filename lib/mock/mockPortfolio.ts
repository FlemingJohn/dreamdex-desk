import type { PortfolioSummary } from "@/types/portfolio";

/**
 * The trader's own book.
 *
 * The unclaimed winnings matter most. On DreamDEX a winning position pays only
 * when someone redeems it, and settled markets drop out of the normal market
 * list — so money you are owed becomes invisible unless something goes looking
 * for it. Surfacing it is one of the few things here that is worth real money
 * on its own.
 */
export function getMockPortfolio(): PortfolioSummary {
  return {
    openPositions: [
      {
        marketId: "0x8471",
        asset: "BTC",
        windowSeconds: 900,
        side: "up",
        contracts: 25,
        entryProbability: 0.61,
        currentProbability: 0.67,
        unrealizedUsdc: 1.5,
        secondsRemaining: 552,
      },
      {
        marketId: "0x8469",
        asset: "ETH",
        windowSeconds: 3600,
        side: "down",
        contracts: 40,
        entryProbability: 0.44,
        currentProbability: 0.39,
        unrealizedUsdc: 2,
        secondsRemaining: 2498,
      },
    ],
    unclaimedWinnings: [
      { marketId: "0x8402", asset: "BTC", windowSeconds: 900, amountUsdc: 12, settledAt: "2026-08-22T09:15:00Z" },
      { marketId: "0x8399", asset: "ETH", windowSeconds: 900, amountUsdc: 8, settledAt: "2026-08-22T08:45:00Z" },
      { marketId: "0x8388", asset: "BTC", windowSeconds: 3600, amountUsdc: 15, settledAt: "2026-08-22T07:00:00Z" },
      { marketId: "0x8371", asset: "BTC", windowSeconds: 900, amountUsdc: 6, settledAt: "2026-08-21T22:30:00Z" },
      { marketId: "0x8354", asset: "ETH", windowSeconds: 900, amountUsdc: 6, settledAt: "2026-08-21T19:15:00Z" },
    ],
    realizedUsdcLastWeek: 18.4,
    fillCountLastWeek: 64,
    winRateLastWeek: 0.54,
  };
}

/** Everything the protocol owes, added up. */
export function sumUnclaimedWinnings(portfolio: PortfolioSummary): number {
  return portfolio.unclaimedWinnings.reduce((total, winning) => total + winning.amountUsdc, 0);
}
