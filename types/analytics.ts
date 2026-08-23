/**
 * Analytics computed from settled windows. Settlement is oracle-driven and
 * happens on a schedule, so every window produces a labelled outcome — which
 * is what makes these measurements possible at all.
 */

import type { Asset, WindowLength } from "./market";

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
  windowLength: WindowLength;
  windowsMeasured: number;
  mintPairShare: number;
  directFillShare: number;
  burnPairShare: number;
  medianDepthAtTouch: number;
  medianSpread: number;
  /** Minute of the window when resting liquidity typically shows up. */
  liquidityArrivesAtMinute: number;
}

/**
 * How reliably a series settles. A void refunds both sides at 0.5, which helps
 * you if you bought cheap and hurts you if you bought expensive.
 */
export interface SettlementQualityRow {
  asset: Asset;
  windowLength: WindowLength;
  settledCount: number;
  voidRate: number;
  averageSourcesAgreeing: number;
  totalSources: number;
  medianLatencySeconds: number;
}
