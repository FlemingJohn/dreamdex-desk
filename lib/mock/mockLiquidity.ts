import type { LiquidityBreakdown } from "@/types/analytics";

/**
 * How trades actually crossed, per series.
 *
 * The mint-a-pair share is the number worth reading. It counts trades where two
 * buyers on opposite sides crossed with no seller at all — the pool created both
 * positions from their combined collateral. A high share means most activity is
 * disagreement rather than real market making, so resting a sell order will
 * mostly sit unfilled.
 */
export function getMockLiquidity(): LiquidityBreakdown[] {
  return [
    {
      asset: "BTC",
      windowSeconds: 900,
      windowsMeasured: 412,
      mintPairShare: 0.68,
      directFillShare: 0.27,
      burnPairShare: 0.05,
      medianDepthAtTouch: 1420,
      medianSpread: 0.021,
      liquidityArrivesAtMinute: 4,
    },
    {
      asset: "BTC",
      windowSeconds: 3600,
      windowsMeasured: 104,
      mintPairShare: 0.51,
      directFillShare: 0.44,
      burnPairShare: 0.05,
      medianDepthAtTouch: 3110,
      medianSpread: 0.038,
      liquidityArrivesAtMinute: 9,
    },
    {
      asset: "ETH",
      windowSeconds: 900,
      windowsMeasured: 412,
      mintPairShare: 0.74,
      directFillShare: 0.21,
      burnPairShare: 0.05,
      medianDepthAtTouch: 940,
      medianSpread: 0.032,
      liquidityArrivesAtMinute: 5,
    },
    {
      asset: "ETH",
      windowSeconds: 3600,
      windowsMeasured: 104,
      mintPairShare: 0.58,
      directFillShare: 0.37,
      burnPairShare: 0.05,
      medianDepthAtTouch: 2240,
      medianSpread: 0.047,
      liquidityArrivesAtMinute: 11,
    },
  ];
}
