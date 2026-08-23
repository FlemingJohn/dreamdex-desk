import type { CalibrationBucket } from "@/types/analytics";

export interface EdgeAssessment {
  /** What the market is charging for this side. */
  pricePaid: number;
  /** What history says the real chance is, from the calibration curve. */
  trueProbability: number;
  /** Profit per contract, on average, at that price. Negative means a bad buy. */
  expectedValuePerContract: number;
  /** The same figure as a return on what you staked. */
  edgePercent: number;
  /** How many settled windows the estimate rests on. */
  sampleSize: number;
  verdict: "buy" | "avoid" | "thin-sample";
}

/** The calibration row covering a given price. */
function findBucketForPrice(
  buckets: CalibrationBucket[],
  probability: number
): CalibrationBucket | undefined {
  return buckets.find(
    (bucket) => probability >= bucket.rangeStart && probability < bucket.rangeEnd
  );
}

/** Below this a bucket is too small to draw conclusions from. */
const RELIABLE_SAMPLE = 40;

/**
 * Turns the calibration curve into a number you can act on.
 *
 * A binary contract pays 1 if it wins and 0 if it loses, so the arithmetic is
 * unusually clean: buying at price p when the real chance is q returns q − p
 * per contract, on average. The calibration curve is what supplies q.
 *
 * This is the whole point of measuring calibration. A chart showing the market
 * is overconfident above 0.60 is interesting; "this costs 0.67 and is worth
 * 0.56, so you are paying 11 cents too much" is actionable.
 */
export function computeExpectedValue(
  buckets: CalibrationBucket[],
  pricePaid: number
): EdgeAssessment | null {
  const bucket = findBucketForPrice(buckets, pricePaid);
  if (!bucket) {
    return null;
  }

  const trueProbability = bucket.actualFrequency;
  const expectedValuePerContract = trueProbability - pricePaid;
  const edgePercent = pricePaid > 0 ? expectedValuePerContract / pricePaid : 0;

  const verdict: EdgeAssessment["verdict"] =
    bucket.windowCount < RELIABLE_SAMPLE
      ? "thin-sample"
      : expectedValuePerContract > 0
        ? "buy"
        : "avoid";

  return {
    pricePaid,
    trueProbability,
    expectedValuePerContract,
    edgePercent,
    sampleSize: bucket.windowCount,
    verdict,
  };
}

/**
 * The same question asked of the other side.
 *
 * Up and Down always sum to 1, so an overpriced favourite is an underpriced
 * underdog. Where the market is overconfident, the edge is in buying against
 * it — and this is how you see that without doing the arithmetic yourself.
 */
export function computeBothSides(
  buckets: CalibrationBucket[],
  upProbability: number
): { up: EdgeAssessment | null; down: EdgeAssessment | null } {
  return {
    up: computeExpectedValue(buckets, upProbability),
    down: computeExpectedValue(buckets, 1 - upProbability),
  };
}
