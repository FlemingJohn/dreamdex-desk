/**
 * Analytics computed from settled windows. Settlement is oracle-driven and
 * happens on a schedule, so every window produces a labelled outcome — which
 * is what makes these measurements possible at all.
 */

import type { Asset, WindowSeconds } from "./market";

/**
 * One row of the calibration curve. Groups settled windows by what the market
 * predicted, then reports what actually happened.
 *
 * If the market said 0.70 but UP only won 58% of the time, buying UP in that
 * band loses money over the long run.
 */
export interface CalibrationBucket {
  /** Lower edge of the predicted-probability band, inclusive. */
  rangeStart: number;
  /** Upper edge of the band, exclusive. */
  rangeEnd: number;
  /** How many settled windows landed in this band. */
  windowCount: number;
  /** Average probability the market quoted for windows in this band. */
  predictedProbability: number;
  /** Share of those windows that actually resolved UP. */
  actualFrequency: number;
}

/** Average probability at a given point in the window's life. */
export interface ProbabilityPathPoint {
  /** Minutes elapsed since the window opened. */
  minutesFromOpen: number;
  /** Average probability of the side that eventually won. */
  averageProbability: number;
}

/**
 * How trades actually crossed. Mint-a-pair is unique to this venue: two buyers
 * on opposite sides cross with no seller, and the pool creates both positions
 * from their combined collateral.
 */
export interface LiquidityBreakdown {
  asset: Asset;
  windowSeconds: WindowSeconds;
  /** How many windows of this series are in the sample. */
  windowsMeasured: number;
  totalTrades: number;
  totalVolumeUsdc: number;
  averageVolumePerWindow: number;
  averageTradesPerWindow: number;
}

/**
 * How reliably a series settles. A void refunds both sides at 0.5, which helps
 * you if you bought cheap and hurts you if you bought expensive.
 */
export interface SettlementQualityRow {
  asset: Asset;
  windowSeconds: WindowSeconds;
  settledCount: number;
  voidRate: number;
  /** Seconds between expiry and resolution landing on-chain. */
  medianLatencySeconds: number;
}

/**
 * A settled market and the link to what decided it.
 *
 * The oracle's per-source working — which feeds answered, their values, the
 * median — is published on its own explorer rather than the indexer, so this
 * carries the result and the link that proves it. The docs say plainly that the
 * link is "worth surfacing in any interface you build on top of event
 * contracts"; nothing does.
 */
export interface SettlementReceipt {
  marketId: string;
  asset: Asset;
  windowSeconds: WindowSeconds;
  oracleQuestionId: string;
  /** The line the close was measured against, when the venue sets one. */
  strike: number | null;
  /** The market's last published estimate before it settled. */
  finalProbability: number;
  outcome: "up" | "down" | "voided";
  explorerUrl: string | null;
}
