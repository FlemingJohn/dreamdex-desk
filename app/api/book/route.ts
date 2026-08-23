import { NextResponse } from "next/server";
import { readOrderBook } from "@/lib/exchange/readOrderBook";
import type { OrderBook } from "@/types/market";

export interface BookResponse {
  book: OrderBook;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number;
  error?: string;
}

/** The resting book for one market. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const marketId = params.get("marketId");
  const pool = params.get("pool");

  const empty: BookResponse = {
    book: { marketId: marketId ?? "", bids: [], asks: [] },
    bestBid: null,
    bestAsk: null,
    spread: 0,
  };

  if (!marketId || !pool) {
    return NextResponse.json(empty);
  }

  try {
    const summary = await readOrderBook(marketId, pool);
    return NextResponse.json({
      book: summary.book,
      bestBid: summary.bestBid,
      bestAsk: summary.bestAsk,
      spread: summary.spread,
    } satisfies BookResponse);
  } catch (error) {
    return NextResponse.json({
      ...empty,
      error: (error as Error).message.slice(0, 140),
    } satisfies BookResponse);
  }
}
