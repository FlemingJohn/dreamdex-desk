import { NextResponse } from "next/server";
import { readLiveMarkets, resolveVenueId } from "@/lib/exchange/readMarkets";
import { readOrderBook, impliedProbability } from "@/lib/exchange/readOrderBook";
import { getMockMarkets } from "@/lib/mock/mockMarkets";
import type { DataSource, LiveMarket } from "@/types/market";

export interface MarketsResponse {
  markets: LiveMarket[];
  source: DataSource;
  venueId: string | null;
  /** Why the desk fell back, when it did. Shown rather than swallowed. */
  note?: string;
}

/** How many books to read per request. Each one is a separate chain call. */
const BOOKS_TO_ENRICH = 6;

/**
 * Live markets, with the book read for the most active few.
 *
 * The market row carries volume and the last trade, but not the spread or the
 * resting depth — those only exist on the book, which is a call per market. So
 * the busiest handful are enriched and the rest are listed from their row.
 *
 * If the chain cannot be reached the desk falls back to stand-in data and says
 * so. An analytics tool that silently shows invented numbers would be worse
 * than one that admits it is offline.
 */
export async function GET() {
  try {
    const [markets, venueId] = await Promise.all([
      readLiveMarkets(12),
      resolveVenueId(),
    ]);

    if (markets.length === 0) {
      return NextResponse.json({
        markets: getMockMarkets(Math.floor(Date.now() / 1000)),
        source: "mock",
        venueId,
        note: "No live windows with enough headroom on this venue right now.",
      } satisfies MarketsResponse);
    }

    const enriched = await Promise.all(
      markets.map(async (market, index) => {
        if (index >= BOOKS_TO_ENRICH) {
          return market;
        }
        try {
          const summary = await readOrderBook(market.marketId, market.poolAddress);
          return {
            ...market,
            upProbability: impliedProbability(summary, market.upProbability),
            spread: summary.spread,
            depthAtTouch: summary.depthAtTouch,
          };
        } catch {
          // A book that will not read is not a reason to drop the market.
          return market;
        }
      })
    );

    return NextResponse.json({
      markets: enriched,
      source: "live",
      venueId,
    } satisfies MarketsResponse);
  } catch (error) {
    return NextResponse.json({
      markets: getMockMarkets(Math.floor(Date.now() / 1000)),
      source: "mock",
      venueId: null,
      note: `Could not reach the indexer: ${(error as Error).message.slice(0, 120)}`,
    } satisfies MarketsResponse);
  }
}
