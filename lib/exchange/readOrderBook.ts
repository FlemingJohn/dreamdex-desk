import { connectExchange } from "@/lib/exchange/connectExchange";
import type { OrderBook, OrderBookLevel } from "@/types/market";

/**
 * The resting book for one market.
 *
 * Up and Down share a single book quoted in Up terms, so what comes back is
 * bids and asks on the Up side — an ask is equally somebody offering Down at
 * one minus the price.
 */

interface RawLevel {
  price: string;
  quantity: string;
}

interface RawBinaryBook {
  yesBids?: RawLevel[];
  yesAsks?: RawLevel[];
}

function toLevels(raw: RawLevel[] | undefined, decimals: number): OrderBookLevel[] {
  return (raw ?? []).map((level) => ({
    probability: Number(level.price) / 10 ** decimals,
    contracts: Number(level.quantity) / 10 ** decimals,
  }));
}

export interface BookSummary {
  book: OrderBook;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number;
  depthAtTouch: number;
}

export async function readOrderBook(
  marketId: string,
  poolAddress: string,
  decimals = 6
): Promise<BookSummary> {
  const exchange = connectExchange();
  const raw = (await exchange.client.getBinaryOrderBook(
    poolAddress as `0x${string}`
  )) as unknown as RawBinaryBook;

  const bids = toLevels(raw.yesBids, decimals);
  const asks = toLevels(raw.yesAsks, decimals);

  const bestBid = bids.length > 0 ? bids[0].probability : null;
  const bestAsk = asks.length > 0 ? asks[0].probability : null;

  return {
    book: { marketId, bids, asks },
    bestBid,
    bestAsk,
    spread: bestBid !== null && bestAsk !== null ? bestAsk - bestBid : 0,
    depthAtTouch:
      (bids.length > 0 ? bids[0].contracts : 0) + (asks.length > 0 ? asks[0].contracts : 0),
  };
}

/**
 * The market's own view of the odds.
 *
 * The midpoint between the touch is a better read than the last trade, which
 * can be stale on a thin book. Falls back to the last price when only one side
 * is quoted, and to even odds when the book is empty.
 */
export function impliedProbability(
  summary: BookSummary,
  lastPrice: number
): number {
  if (summary.bestBid !== null && summary.bestAsk !== null) {
    return (summary.bestBid + summary.bestAsk) / 2;
  }
  return lastPrice;
}
