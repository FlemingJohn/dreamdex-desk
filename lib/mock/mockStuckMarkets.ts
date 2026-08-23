import type { StuckMarket, VaultFallback } from "@/types/order";

/**
 * Markets that have finished but not paid out.
 *
 * This should be rare — settlement is delivered to the market automatically in
 * the same flow the oracle answers in. But a missed callback leaves collateral
 * sitting there, and the protocol's answer is that anybody may push it through:
 * pokeOracle pulls a posted answer in, and once the settlement window has
 * lapsed voidExpired refunds both sides at 0.5.
 *
 * Nothing surfaces these today, so the money simply waits.
 */
export function getMockStuckMarkets(): StuckMarket[] {
  return [
    {
      marketId: "0x8455",
      asset: "ETH",
      windowLength: "15m",
      oracleQuestionId: "418804",
      problem: "answered-not-resolved",
      remedy: "pokeOracle",
      expiredAgoSeconds: 640,
      lockedUsdc: 1840,
      youHoldPosition: true,
    },
    {
      marketId: "0x8431",
      asset: "BTC",
      windowLength: "15m",
      oracleQuestionId: "418779",
      problem: "settlement-window-lapsed",
      remedy: "voidExpired",
      expiredAgoSeconds: 5220,
      lockedUsdc: 610,
      youHoldPosition: false,
    },
  ];
}

/**
 * Payouts the pool could not deliver to a wallet, parked in its vault instead.
 *
 * The vault reads zero in normal operation, so this is the last place anyone
 * thinks to check — which is precisely why balances accumulate here unnoticed.
 */
export function getMockVaultFallbacks(): VaultFallback[] {
  return [
    {
      poolAddress: "0x7c4e...91ab",
      asset: "BTC",
      windowLength: "15m",
      amountUsdc: 9.5,
      strandedAt: "2026-08-21T14:05:00Z",
    },
    {
      poolAddress: "0x3f18...02cd",
      asset: "ETH",
      windowLength: "1h",
      amountUsdc: 4.25,
      strandedAt: "2026-08-20T09:40:00Z",
    },
  ];
}

export function sumVaultFallbacks(fallbacks: VaultFallback[]): number {
  return fallbacks.reduce((total, entry) => total + entry.amountUsdc, 0);
}
