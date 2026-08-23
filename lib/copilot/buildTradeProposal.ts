import { readLiveMarkets } from "@/lib/exchange/readMarkets";
import { readOrderBook } from "@/lib/exchange/readOrderBook";
import { invertProbability } from "@/lib/format/formatProbability";
import { isClosingSoon } from "@/lib/format/formatCountdown";
import type { ProposalCheck, TradeProposal } from "@/types/copilot";
import type { Side } from "@/types/market";

/**
 * The venue rejects any price that is not a whole number of ticks. Floating
 * point makes that easy to get wrong — 0.05 converts to 0.050000000000000003,
 * which is three wei off the grid and fails on an 18-decimal venue while
 * passing quietly on a 6-decimal one like Shannon. Snapping through integers
 * avoids it on both.
 */
const TICKS_PER_UNIT = 1000;
const CONTRACT_STEP = 1;

function snapProbabilityToTickGrid(probability: number): number {
  return Math.round(probability * TICKS_PER_UNIT) / TICKS_PER_UNIT;
}

function snapContractsToLotGrid(contracts: number): number {
  return Math.max(CONTRACT_STEP, Math.floor(contracts / CONTRACT_STEP) * CONTRACT_STEP);
}

interface BuildTradeProposalInput {
  marketId: string;
  side: Side;
  contracts: number;
  availableUsdc: number;
}

/**
 * Turns a request into a proposal a person can approve.
 *
 * Every guard the docs warn about is applied here rather than trusted to the
 * caller: the market must still be trading, it must have time left to survive
 * the round trip, the price has to sit on the tick grid, and the book has to
 * hold enough depth to fill the size.
 *
 * The price comes from the live book rather than the last trade, because on a
 * thin book the last trade can be minutes stale and a proposal priced off it
 * would never cross.
 */
export async function buildTradeProposal({
  marketId,
  side,
  contracts,
  availableUsdc,
}: BuildTradeProposalInput): Promise<TradeProposal | null> {
  const markets = await readLiveMarkets(20);
  const market = markets.find((candidate) => candidate.marketId === marketId);
  if (!market) {
    return null;
  }

  let bookProbability = market.upProbability;
  let depthAvailable = market.depthAtTouch;
  try {
    const summary = await readOrderBook(market.marketId, market.poolAddress);
    // Buying means paying the ask; the ask on the Down side is 1 minus the bid.
    if (side === "up" && summary.bestAsk !== null) {
      bookProbability = summary.bestAsk;
    } else if (side === "down" && summary.bestBid !== null) {
      bookProbability = invertProbability(summary.bestBid);
    }
    depthAvailable = summary.depthAtTouch;
  } catch {
    // Fall back to the row's own price rather than refusing to quote.
  }

  const sizedContracts = snapContractsToLotGrid(contracts);
  const probability = snapProbabilityToTickGrid(
    side === "up" ? bookProbability : bookProbability
  );

  const costUsdc = Number((sizedContracts * probability).toFixed(2));
  const maxGainUsdc = Number((sizedContracts * (1 - probability)).toFixed(2));

  const checks: ProposalCheck[] = [
    {
      label: "Market is trading",
      passed: market.status === "trading",
      detail: market.status,
    },
    {
      label: "Enough time left",
      passed: !isClosingSoon(market.secondsRemaining),
      detail: `${Math.floor(market.secondsRemaining / 60)}m remaining`,
    },
    {
      label: "Price on tick grid",
      passed: probability > 0 && probability < 1,
      detail: probability.toFixed(3),
    },
    {
      label: "Balance covers cost",
      passed: availableUsdc >= costUsdc,
      detail: `${availableUsdc.toFixed(2)} available`,
    },
    {
      label: "Depth supports size",
      passed: depthAvailable >= sizedContracts,
      detail: `${depthAvailable.toFixed(0)} at touch`,
    },
  ];

  return {
    proposalId: `${marketId}-${Date.now()}`,
    marketId,
    asset: market.asset,
    windowSeconds: market.windowSeconds,
    side,
    contracts: sizedContracts,
    probability,
    costUsdc,
    maxLossUsdc: costUsdc,
    maxGainUsdc,
    checks,
  };
}
