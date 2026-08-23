import type { OrderBook } from "@/types/market";

/**
 * The resting book for one market.
 *
 * Up and Down share a single book quoted in Up terms, so a bid here is someone
 * willing to buy Up at that probability and an ask is someone willing to sell
 * it. Buying Down at 0.39 and selling Up at 0.61 are the same trade.
 */
export function getMockOrderBook(marketId: string): OrderBook {
  return {
    marketId,
    bids: [
      { probability: 0.6, contracts: 420 },
      { probability: 0.59, contracts: 310 },
      { probability: 0.58, contracts: 540 },
      { probability: 0.56, contracts: 890 },
      { probability: 0.54, contracts: 1240 },
    ],
    asks: [
      { probability: 0.62, contracts: 380 },
      { probability: 0.63, contracts: 260 },
      { probability: 0.65, contracts: 610 },
      { probability: 0.67, contracts: 940 },
      { probability: 0.7, contracts: 1520 },
    ],
  };
}
