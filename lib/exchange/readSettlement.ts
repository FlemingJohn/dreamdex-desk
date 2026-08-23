import { connectExchange } from "@/lib/exchange/connectExchange";
import { readSettledMarkets, resolveVenueId } from "@/lib/exchange/readMarkets";
import type { SettlementReceipt } from "@/types/analytics";
import type { StuckMarket } from "@/types/order";

/**
 * Settlement records and the markets that have not finished settling.
 */

/** Where the oracle publishes its working for one question. */
export function buildOracleExplorerUrl(oracleQuestionId: string): string {
  return `https://prd.oracle.somnia.host/questions/${oracleQuestionId}?view=graph`;
}

/**
 * Recently settled markets, with what decided them.
 *
 * The per-source detail — which feeds answered, what each returned, the median
 * across them — lives on the oracle's own explorer rather than the indexer. So
 * this reports the result and links to the proof rather than restating it, and
 * the link is the point: nothing else in any interface surfaces it.
 */
export async function readSettlementReceipts(limit = 8): Promise<SettlementReceipt[]> {
  const exchange = connectExchange();
  const settled = await readSettledMarkets(limit * 3);
  const receipts: SettlementReceipt[] = [];

  for (const market of settled) {
    if (receipts.length >= limit) {
      break;
    }
    try {
      const onchain = await exchange.client.getMarketOnchain(
        market.marketId as `0x${string}`
      );
      if (!onchain.isResolved && !onchain.isVoided) {
        continue;
      }

      receipts.push({
        marketId: market.marketId,
        asset: market.asset,
        windowSeconds: market.windowSeconds,
        oracleQuestionId: market.oracleQuestionId ?? "",
        strike: market.strike,
        finalProbability: market.upProbability,
        outcome: onchain.isVoided ? "voided" : onchain.winningOutcome === 0 ? "up" : "down",
        explorerUrl: market.oracleQuestionId
          ? buildOracleExplorerUrl(market.oracleQuestionId)
          : null,
      });
    } catch {
      continue;
    }
  }

  return receipts;
}

/**
 * Markets that expired but have not paid out.
 *
 * This should be rare — the oracle answers and Somnia's reactivity delivers
 * that answer to the market in the same flow, with no keeper involved. But a
 * missed callback leaves collateral sitting there, and the protocol's answer is
 * that anyone may push it through. Nothing surfaces these, so the money waits.
 *
 * A market past expiry that is neither resolved nor voided needs poking. One
 * whose whole settlement window has lapsed can be voided by anybody, which
 * refunds both sides at 0.5.
 */
export async function readStuckMarkets(): Promise<StuckMarket[]> {
  const exchange = connectExchange();
  const venueId = await resolveVenueId();
  const now = Math.floor(Date.now() / 1000);

  /**
   * Locked is the state between a window ending and its result arriving, so
   * that is where a stalled settlement shows up.
   */
  const rows = (await exchange.client.listBinaryMarkets({
    ...(venueId ? { venueId } : {}),
    status: "Locked",
    limit: 60,
  })) as unknown as {
    marketId: string;
    asset: string;
    intervalSec: string;
    expiry: string;
    oracleQuestionId: string | null;
    quoteDecimals: number;
    cumulativeQuoteVolume: string;
  }[];

  const stuck: StuckMarket[] = [];

  for (const row of rows) {
    const expiredAgoSeconds = now - Number(row.expiry);
    if (expiredAgoSeconds <= 0) {
      continue;
    }

    try {
      const onchain = await exchange.client.getMarketOnchain(
        row.marketId as `0x${string}`
      );
      if (onchain.isResolved || onchain.isVoided) {
        continue;
      }

      /**
       * An hour past expiry is well beyond any settlement window, so at that
       * point voiding is the remedy rather than waiting for an answer.
       */
      const windowHasLapsed = expiredAgoSeconds > 3600;

      stuck.push({
        marketId: row.marketId,
        asset: row.asset,
        windowSeconds: Number(row.intervalSec),
        oracleQuestionId: row.oracleQuestionId ?? "",
        problem: windowHasLapsed ? "settlement-window-lapsed" : "answered-not-resolved",
        remedy: windowHasLapsed ? "voidExpired" : "pokeOracle",
        expiredAgoSeconds,
        lockedUsdc:
          Number(row.cumulativeQuoteVolume) / 10 ** (row.quoteDecimals ?? 6),
        youHoldPosition: false,
      });
    } catch {
      continue;
    }
  }

  return stuck.sort((a, b) => b.expiredAgoSeconds - a.expiredAgoSeconds).slice(0, 10);
}
