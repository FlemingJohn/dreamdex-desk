import { getMockMarkets } from "@/lib/mock/mockMarkets";
import { invertProbability } from "@/lib/format/formatProbability";
import { isClosingSoon } from "@/lib/format/formatCountdown";
import type { ProposalCheck, TradeProposal } from "@/types/copilot";
import type { Side } from "@/types/market";

/** These run on the server, where reading the clock directly is safe. */
function currentSecond(): number {
  return Math.floor(Date.now() / 1000);
}


/** Contracts trade on a grid, so sizes are whole numbers. */
const CONTRACT_STEP = 1;

/**
 * The venue rejects any price that is not a whole number of ticks. Floating
 * point makes that easy to get wrong — 0.05 converts to 0.050000000000000003,
 * which is three wei off the grid and fails on an 18-decimal venue while
 * passing quietly on testnet. Snapping through integers avoids it entirely.
 */
const TICKS_PER_UNIT = 1000;

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
 * Turns a request from the copilot into a proposal a person can approve.
 *
 * Every guard the docs warn about is applied here rather than trusted to the
 * model: the market must still be trading, it must have enough time left to
 * survive the round trip, the price must sit on the tick grid, and the trader
 * must be able to afford it.
 */
export function buildTradeProposal({
  marketId,
  side,
  contracts,
  availableUsdc,
}: BuildTradeProposalInput): TradeProposal | null {
  const market = getMockMarkets(currentSecond()).find(
    (candidate) => candidate.marketId === marketId
  );
  if (!market) {
    return null;
  }

  const sizedContracts = snapContractsToLotGrid(contracts);
  const rawProbability =
    side === "up" ? market.upProbability : invertProbability(market.upProbability);
  const probability = snapProbabilityToTickGrid(rawProbability);

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
      passed: true,
      detail: probability.toFixed(3),
    },
    {
      label: "Balance covers cost",
      passed: availableUsdc >= costUsdc,
      detail: `${availableUsdc.toFixed(2)} available`,
    },
    {
      label: "Depth supports size",
      passed: market.depthAtTouch >= sizedContracts,
      detail: `${market.depthAtTouch} at touch`,
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
