/**
 * What the trader holds. Positions are ids on one shared ERC-6909 contract
 * rather than separate tokens per market, so they are decoded into readable
 * terms here.
 */

import type { Asset, Side, WindowSeconds } from "./market";

export interface OpenPosition {
  marketId: string;
  asset: Asset;
  windowSeconds: WindowSeconds;
  side: Side;
  contracts: number;
  /** Probability paid when the position was opened. */
  entryProbability: number;
  /** Probability the market quotes for this side right now. */
  currentProbability: number;
  unrealizedUsdc: number;
  secondsRemaining: number;
}

/**
 * Money the protocol owes but has not paid. Winnings are claimed, not received
 * — and settled markets drop out of the normal market list, so this is easy to
 * miss entirely.
 */
export interface UnclaimedWinning {
  marketId: string;
  asset: Asset;
  windowSeconds: WindowSeconds;
  amountUsdc: number;
  settledAt: string;
}

export interface PortfolioSummary {
  openPositions: OpenPosition[];
  unclaimedWinnings: UnclaimedWinning[];
  realizedUsdcLastWeek: number;
  fillCountLastWeek: number;
  winRateLastWeek: number;
}
