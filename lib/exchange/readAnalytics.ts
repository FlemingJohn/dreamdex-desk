import { connectExchange } from "@/lib/exchange/connectExchange";
import { resolveVenueId } from "@/lib/exchange/readMarkets";
import type {
  CalibrationBucket,
  LiquidityBreakdown,
  ProbabilityPathPoint,
  SettlementQualityRow,
} from "@/types/analytics";

/**
 * Analytics computed from markets that have actually settled.
 *
 * This is the whole reason event contracts are worth measuring: every window
 * resolves on a schedule against a published oracle answer, so each one leaves
 * behind a matched pair — what the market predicted, and what happened.
 */

interface SettledRow {
  poolAddress: string;
  asset: string;
  intervalSec: string;
  lastPrice: string | null;
  quoteDecimals: number;
  /** 0 means the UP side paid out, 1 means DOWN. Null until resolved. */
  winningOutcome: number | null;
  voided: boolean | null;
  tradeCount: string;
  cumulativeQuoteVolume: string;
  resolvedAtTimestamp: string | null;
  expiry: string;
}

const BANDS = [
  { rangeStart: 0.0, rangeEnd: 0.2 },
  { rangeStart: 0.2, rangeEnd: 0.35 },
  { rangeStart: 0.35, rangeEnd: 0.5 },
  { rangeStart: 0.5, rangeEnd: 0.65 },
  { rangeStart: 0.65, rangeEnd: 0.8 },
  { rangeStart: 0.8, rangeEnd: 1.01 },
];

async function fetchSettledRows(limit = 500): Promise<SettledRow[]> {
  const exchange = connectExchange();
  const venueId = await resolveVenueId();

  const rows = (await exchange.client.listBinaryMarkets({
    ...(venueId ? { venueId } : {}),
    status: "Finalized",
    limit,
  })) as unknown as SettledRow[];

  // A market that never traded had no price, so it cannot be scored.
  return rows.filter(
    (row) => row.lastPrice !== null && row.winningOutcome !== null && !row.voided
  );
}

function priceOf(row: SettledRow): number {
  return Number(row.lastPrice) / 10 ** (row.quoteDecimals ?? 6);
}

/**
 * The calibration curve, from real settled windows.
 *
 * The last traded price is the market's final published estimate; the winning
 * outcome is the answer. Grouping the first and averaging the second gives the
 * reliability curve — whether a price of 0.7 actually wins 70% of the time.
 */
export async function readCalibration(): Promise<CalibrationBucket[]> {
  const rows = await fetchSettledRows();

  return BANDS.map((band) => {
    const inBand = rows.filter((row) => {
      const predicted = priceOf(row);
      return predicted >= band.rangeStart && predicted < band.rangeEnd;
    });

    if (inBand.length === 0) {
      return {
        ...band,
        windowCount: 0,
        predictedProbability: (band.rangeStart + band.rangeEnd) / 2,
        actualFrequency: 0,
      };
    }

    const totalPredicted = inBand.reduce((sum, row) => sum + priceOf(row), 0);
    // winningOutcome 0 is the UP side, which is what the price refers to.
    const upWins = inBand.filter((row) => row.winningOutcome === 0).length;

    return {
      ...band,
      windowCount: inBand.length,
      predictedProbability: totalPredicted / inBand.length,
      actualFrequency: upWins / inBand.length,
    };
  }).filter((bucket) => bucket.windowCount > 0);
}

/**
 * Void rate and settlement latency per series.
 *
 * A void refunds both sides at 0.5 rather than paying a winner, so its rate
 * changes what a cheap side is worth before you have bought it.
 */
export async function readSettlementQuality(): Promise<SettlementQualityRow[]> {
  const exchange = connectExchange();
  const venueId = await resolveVenueId();

  const rows = (await exchange.client.listBinaryMarkets({
    ...(venueId ? { venueId } : {}),
    status: "Finalized",
    limit: 500,
  })) as unknown as SettledRow[];

  const bySeries = new Map<string, SettledRow[]>();
  for (const row of rows) {
    const key = `${row.asset}-${row.intervalSec}`;
    bySeries.set(key, [...(bySeries.get(key) ?? []), row]);
  }

  return [...bySeries.values()]
    .map((seriesRows) => {
      const voided = seriesRows.filter((row) => row.voided === true).length;
      const latencies = seriesRows
        .filter((row) => row.resolvedAtTimestamp !== null)
        .map((row) => Number(row.resolvedAtTimestamp) - Number(row.expiry))
        .filter((seconds) => seconds >= 0 && seconds < 3600)
        .sort((a, b) => a - b);

      return {
        asset: seriesRows[0].asset,
        windowSeconds: Number(seriesRows[0].intervalSec),
        settledCount: seriesRows.length,
        voidRate: voided / seriesRows.length,
        medianLatencySeconds:
          latencies.length > 0 ? latencies[Math.floor(latencies.length / 2)] : 0,
      } satisfies SettlementQualityRow;
    })
    .sort((a, b) => b.settledCount - a.settledCount)
    .slice(0, 8);
}

interface Candle {
  bucketStart: string;
  closePrice: string;
}

/**
 * How probability travels across a window, averaged over recent ones.
 *
 * Each settled window is walked minute by minute from its candles, tracking the
 * eventual winner's price rather than the UP price — otherwise windows that
 * resolved in opposite directions would cancel each other out and the shape
 * would flatten to a straight line at even odds.
 */
export async function readProbabilityPath(): Promise<ProbabilityPathPoint[]> {
  const exchange = connectExchange();
  const venueId = await resolveVenueId();

  const rows = (await exchange.client.listBinaryMarkets({
    ...(venueId ? { venueId } : {}),
    status: "Finalized",
    limit: 120,
  })) as unknown as SettledRow[];

  const usable = rows
    .filter(
      (row) =>
        Number(row.intervalSec) >= 900 &&
        Number(row.tradeCount) > 0 &&
        row.winningOutcome !== null
    )
    .slice(0, 14);

  const bucketSums = new Map<number, { total: number; count: number }>();

  for (const row of usable) {
    let candles: Candle[];
    try {
      candles = (await exchange.client.getCandles(row.poolAddress as `0x${string}`, 60, {
        limit: 90,
      })) as unknown as Candle[];
    } catch {
      continue;
    }
    if (!Array.isArray(candles) || candles.length === 0) {
      continue;
    }

    const decimals = row.quoteDecimals ?? 6;
    const windowStart = Number(row.expiry) - Number(row.intervalSec);
    const upWon = row.winningOutcome === 0;
    const windowMinutes = Number(row.intervalSec) / 60;

    for (const candle of candles) {
      const minute = Math.floor((Number(candle.bucketStart) - windowStart) / 60);
      if (minute < 0 || minute > windowMinutes) {
        continue;
      }
      const upPrice = Number(candle.closePrice) / 10 ** decimals;
      const winnerPrice = upWon ? upPrice : 1 - upPrice;

      const entry = bucketSums.get(minute) ?? { total: 0, count: 0 };
      entry.total += winnerPrice;
      entry.count += 1;
      bucketSums.set(minute, entry);
    }
  }

  return [...bucketSums.entries()]
    .filter(([, entry]) => entry.count >= 2)
    .sort((a, b) => a[0] - b[0])
    .map(([minute, entry]) => ({
      minutesFromOpen: minute,
      averageProbability: entry.total / entry.count,
    }));
}

/**
 * Traded volume per series.
 *
 * The indexer reports volume and trade count per market but does not label how
 * each fill crossed, so the mint-a-pair share is not derivable from these rows —
 * that needs the fill events themselves. What is reported is what the data
 * actually supports.
 */
export async function readLiquidity(): Promise<LiquidityBreakdown[]> {
  const exchange = connectExchange();
  const venueId = await resolveVenueId();

  const rows = (await exchange.client.listBinaryMarkets({
    ...(venueId ? { venueId } : {}),
    orderBy: "volume",
    limit: 80,
  })) as unknown as SettledRow[];

  const bySeries = new Map<string, SettledRow[]>();
  for (const row of rows) {
    if (Number(row.tradeCount) === 0) {
      continue;
    }
    const key = `${row.asset}-${row.intervalSec}`;
    bySeries.set(key, [...(bySeries.get(key) ?? []), row]);
  }

  return [...bySeries.values()]
    .map((seriesRows) => {
      const decimals = seriesRows[0].quoteDecimals ?? 6;
      const trades = seriesRows.reduce((sum, row) => sum + Number(row.tradeCount), 0);
      const volume = seriesRows.reduce(
        (sum, row) => sum + Number(row.cumulativeQuoteVolume) / 10 ** decimals,
        0
      );

      return {
        asset: seriesRows[0].asset,
        windowSeconds: Number(seriesRows[0].intervalSec),
        windowsMeasured: seriesRows.length,
        totalTrades: trades,
        totalVolumeUsdc: volume,
        averageVolumePerWindow: volume / seriesRows.length,
        averageTradesPerWindow: trades / seriesRows.length,
      } satisfies LiquidityBreakdown;
    })
    .sort((a, b) => b.totalVolumeUsdc - a.totalVolumeUsdc)
    .slice(0, 8);
}
