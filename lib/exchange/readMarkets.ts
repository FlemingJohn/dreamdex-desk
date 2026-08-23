import { connectExchange, getConfiguredVenueId } from "@/lib/exchange/connectExchange";
import type { LiveMarket, MarketStatus } from "@/types/market";

/**
 * Reading live markets off the chain.
 *
 * Every figure here is scaled by the collateral's own decimals rather than a
 * constant — Shannon runs 6 and mainnet runs 18, and assuming either one would
 * misprice everything by a factor of a trillion.
 */

/** A row as the indexer returns it. Fields are decimal strings, not numbers. */
interface BinaryMarketRow {
  marketId: string;
  poolAddress: string;
  venueId: string;
  asset: string;
  intervalSec: string;
  strike: string | null;
  status: string;
  expiry: string;
  lastPrice: string | null;
  tradeCount: string;
  cumulativeQuoteVolume: string;
  quoteDecimals: number;
  oracleQuestionId: string | null;
}

function scaleByDecimals(raw: string | null, decimals: number): number {
  if (raw === null) {
    return 0;
  }
  return Number(raw) / 10 ** decimals;
}

function toMarketStatus(indexed: string): MarketStatus {
  switch (indexed) {
    case "Trading":
      return "trading";
    case "Locked":
      return "locked";
    case "Voided":
      return "voided";
    case "Finalized":
    case "Resolved":
      return "resolved";
    default:
      return "listed";
  }
}

/**
 * A window this close to expiry can lock between being read and being traded,
 * so it is not worth showing as actionable.
 */
const MINIMUM_HEADROOM_SECONDS = 60;

/**
 * Picks the venue to read when none is configured.
 *
 * It has to be a venue that is trading *now*. Ranking by historical volume
 * finds the venue with the longest record, which on Shannon is one whose
 * markets have all finalised — so the desk would sit empty while a live venue
 * ran alongside it. Live windows with real headroom are the signal, and trade
 * count only breaks the tie between venues that qualify.
 */
async function discoverActiveVenue(): Promise<string | null> {
  const exchange = connectExchange();
  const now = Math.floor(Date.now() / 1000);

  /**
   * Newest first, not closing-soonest.
   *
   * Venues run minute-long windows in bulk, so ordering by what closes next
   * fills the whole page with markets about to expire — and every one of them
   * fails the headroom check, making a busy venue look dead. The newest markets
   * are the ones with time left on them.
   */
  const rows = (await exchange.client.listBinaryMarkets({
    status: "Trading",
    orderBy: "newest",
    limit: 200,
  })) as unknown as BinaryMarketRow[];

  const scoreByVenue = new Map<string, { liveMarkets: number; trades: number }>();
  for (const row of rows) {
    if (Number(row.expiry) - now <= MINIMUM_HEADROOM_SECONDS) {
      continue;
    }
    const entry = scoreByVenue.get(row.venueId) ?? { liveMarkets: 0, trades: 0 };
    entry.liveMarkets += 1;
    entry.trades += Number(row.tradeCount ?? 0);
    scoreByVenue.set(row.venueId, entry);
  }

  let best: string | null = null;
  let bestEntry = { liveMarkets: 0, trades: -1 };
  for (const [venueId, entry] of scoreByVenue) {
    const better =
      entry.liveMarkets > bestEntry.liveMarkets ||
      (entry.liveMarkets === bestEntry.liveMarkets && entry.trades > bestEntry.trades);
    if (better) {
      best = venueId;
      bestEntry = entry;
    }
  }

  return best;
}

export async function resolveVenueId(): Promise<string | null> {
  return getConfiguredVenueId() ?? (await discoverActiveVenue());
}

export async function readLiveMarkets(limit = 12): Promise<LiveMarket[]> {
  const exchange = connectExchange();
  const venueId = await resolveVenueId();
  const now = Math.floor(Date.now() / 1000);

  const rows = (await exchange.client.listBinaryMarkets({
    ...(venueId ? { venueId } : {}),
    status: "Trading",
    orderBy: "newest",
    limit: 200,
  })) as unknown as BinaryMarketRow[];

  return rows
    .map((row) => {
      const decimals = row.quoteDecimals ?? 6;
      const secondsRemaining = Number(row.expiry) - now;

      /**
       * With no trade yet there is no implied probability, so the window sits
       * at even odds until the book says otherwise. Reporting 0 would read as
       * "certain to lose" rather than "unknown".
       */
      const upProbability =
        row.lastPrice === null ? 0.5 : scaleByDecimals(row.lastPrice, decimals);

      return {
        marketId: row.marketId,
        poolAddress: row.poolAddress,
        venueId: row.venueId,
        asset: row.asset,
        windowSeconds: Number(row.intervalSec),
        strike: row.strike ? scaleByDecimals(row.strike, 2) : null,
        upProbability,
        spread: 0,
        depthAtTouch: 0,
        volumeUsdc: scaleByDecimals(row.cumulativeQuoteVolume, decimals),
        tradeCount: Number(row.tradeCount ?? 0),
        secondsRemaining,
        status: toMarketStatus(row.status),
        oracleQuestionId: row.oracleQuestionId,
      } satisfies LiveMarket;
    })
    .filter((market) => market.secondsRemaining > MINIMUM_HEADROOM_SECONDS)
    .sort((a, b) => b.tradeCount - a.tradeCount || a.secondsRemaining - b.secondsRemaining)
    .slice(0, limit);
}

/**
 * Recently settled markets, newest expiry first.
 *
 * The ordinary market list cannot see these — the registry sweep behind it
 * skips finalised binaries, which is why unclaimed winnings are so easy to
 * miss. The binary tier carries them under the terminal status.
 */
export async function readSettledMarkets(limit = 12): Promise<LiveMarket[]> {
  const exchange = connectExchange();
  const venueId = await resolveVenueId();
  const now = Math.floor(Date.now() / 1000);

  const rows = (await exchange.client.listBinaryMarkets({
    ...(venueId ? { venueId } : {}),
    status: "Finalized",
    limit: 120,
  })) as unknown as BinaryMarketRow[];

  return rows
    .map((row) => {
      const decimals = row.quoteDecimals ?? 6;
      return {
        marketId: row.marketId,
        poolAddress: row.poolAddress,
        venueId: row.venueId,
        asset: row.asset,
        windowSeconds: Number(row.intervalSec),
        strike: row.strike ? scaleByDecimals(row.strike, 2) : null,
        upProbability:
          row.lastPrice === null ? 0.5 : scaleByDecimals(row.lastPrice, decimals),
        spread: 0,
        depthAtTouch: 0,
        volumeUsdc: scaleByDecimals(row.cumulativeQuoteVolume, decimals),
        tradeCount: Number(row.tradeCount ?? 0),
        secondsRemaining: Number(row.expiry) - now,
        status: toMarketStatus(row.status),
        oracleQuestionId: row.oracleQuestionId,
      } satisfies LiveMarket;
    })
    // The server sorts by creation; newest *expired* is what matters here.
    .sort((a, b) => b.secondsRemaining - a.secondsRemaining)
    .slice(0, limit);
}
