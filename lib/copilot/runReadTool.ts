import {
  readCalibration,
  readLiquidity,
  readProbabilityPath,
  readSettlementQuality,
} from "@/lib/exchange/readAnalytics";
import { readLiveMarkets, readSettledMarkets } from "@/lib/exchange/readMarkets";
import { readOrderBook } from "@/lib/exchange/readOrderBook";
import { computeBothSides } from "@/lib/analytics/computeExpectedValue";
import { computePositionSize } from "@/lib/analytics/computePositionSize";
import type { ReadToolName } from "@/lib/copilot/toolDefinitions";

/**
 * Runs one read tool against the chain and hands the result to the model.
 *
 * These are safe to run without asking anyone, because none of them change
 * anything — they only look.
 */

/** Stand-in until the desk reads a real balance for the connected wallet. */
const ASSUMED_BANKROLL_USDC = 500;

export async function runReadTool(
  name: ReadToolName,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  switch (name) {
    case "listMarkets":
      return readLiveMarkets(12);

    case "getCalibration":
      return readCalibration();

    case "getProbabilityPath":
      return readProbabilityPath();

    case "getLiquidity":
      return readLiquidity();

    case "getSettlementQuality":
      return readSettlementQuality();

    case "getOrderBook": {
      const markets = await readLiveMarkets(12);
      const wanted = args.marketId
        ? markets.find((market) => market.marketId === args.marketId)
        : markets[0];
      if (!wanted) {
        return { error: "That market is not open." };
      }
      const summary = await readOrderBook(wanted.marketId, wanted.poolAddress);
      return {
        marketId: wanted.marketId,
        asset: wanted.asset,
        windowSeconds: wanted.windowSeconds,
        bestBid: summary.bestBid,
        bestAsk: summary.bestAsk,
        spread: summary.spread,
        depthAtTouch: summary.depthAtTouch,
        bids: summary.book.bids,
        asks: summary.book.asks,
      };
    }

    case "explainSettlement": {
      /**
       * The oracle's own working — every price source, its value, the median —
       * lives on its explorer rather than the indexer, so what is returned here
       * is the result plus the link that proves it.
       */
      const settled = await readSettledMarkets(6);
      return settled.map((market) => ({
        marketId: market.marketId,
        asset: market.asset,
        windowSeconds: market.windowSeconds,
        strike: market.strike,
        finalProbability: market.upProbability,
        oracleQuestionId: market.oracleQuestionId,
        explorerUrl: market.oracleQuestionId
          ? `https://prd.oracle.somnia.host/questions/${market.oracleQuestionId}?view=graph`
          : null,
      }));
    }

    case "findEdge": {
      /**
       * The same arithmetic the edge panel runs: price every open market against
       * the calibration curve, keep the better side, and size it.
       */
      const [markets, buckets] = await Promise.all([
        readLiveMarkets(12),
        readCalibration(),
      ]);

      return markets.map((market) => {
        const sides = computeBothSides(buckets, market.upProbability);
        const better =
          (sides.up?.expectedValuePerContract ?? -1) >
          (sides.down?.expectedValuePerContract ?? -1)
            ? { side: "up" as const, assessment: sides.up }
            : { side: "down" as const, assessment: sides.down };

        if (!better.assessment) {
          return {
            marketId: market.marketId,
            asset: market.asset,
            note: "priced outside every measured band",
          };
        }

        return {
          marketId: market.marketId,
          asset: market.asset,
          windowSeconds: market.windowSeconds,
          bestSide: better.side,
          ...better.assessment,
          recommendedStake: computePositionSize(
            better.assessment.pricePaid,
            better.assessment.trueProbability,
            ASSUMED_BANKROLL_USDC
          ),
        };
      });
    }

    case "listWorkingOrders":
    case "getPortfolio":
    case "findStrandedFunds":
      /**
       * All three are specific to a wallet, and the desk signs from the browser
       * so the server does not know which one is connected. Rather than guess,
       * these say so — the panels read them client-side.
       */
      return {
        note: "This needs the connected wallet, which only the browser knows. The matching panel in the dashboard shows it.",
      };

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

/** A short line describing what a tool returned, shown in the transcript. */
export function summarizeReadResult(name: ReadToolName, result: unknown): string {
  if (Array.isArray(result)) {
    return `${result.length} rows`;
  }
  if (result && typeof result === "object" && "note" in result) {
    return "needs a wallet";
  }
  return "ok";
}
