import type { CalibrationBucket } from "@/types/analytics";

/**
 * Mock calibration curve over roughly a thousand settled windows.
 *
 * The shape here is the finding the dashboard exists to surface: the market is
 * honest around even odds, but grows overconfident above 0.60 — windows priced
 * at 0.70 resolve UP far less often than 70% of the time. If that holds on real
 * data, buying the favourite in that band loses money and selling it makes money.
 */
export function getMockCalibration(): CalibrationBucket[] {
  return [
    { rangeStart: 0.5, rangeEnd: 0.55, windowCount: 184, predictedProbability: 0.524, actualFrequency: 0.522 },
    { rangeStart: 0.55, rangeEnd: 0.6, windowCount: 156, predictedProbability: 0.573, actualFrequency: 0.571 },
    { rangeStart: 0.6, rangeEnd: 0.65, windowCount: 131, predictedProbability: 0.624, actualFrequency: 0.542 },
    { rangeStart: 0.65, rangeEnd: 0.7, windowCount: 94, predictedProbability: 0.671, actualFrequency: 0.564 },
    { rangeStart: 0.7, rangeEnd: 0.75, windowCount: 47, predictedProbability: 0.719, actualFrequency: 0.617 },
    { rangeStart: 0.75, rangeEnd: 1, windowCount: 22, predictedProbability: 0.784, actualFrequency: 0.682 },
  ];
}

/** Total windows behind the curve, shown so the reader can judge the sample. */
export function countCalibrationWindows(buckets: CalibrationBucket[]): number {
  return buckets.reduce((total, bucket) => total + bucket.windowCount, 0);
}

/** A bucket is overconfident when reality came in below what was quoted. */
export function isOverconfident(bucket: CalibrationBucket): boolean {
  return bucket.actualFrequency < bucket.predictedProbability - 0.02;
}
