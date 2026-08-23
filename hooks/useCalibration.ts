"use client";

import { useMemo } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { CalibrationBucket } from "@/types/analytics";

/** Total windows behind the curve, so the reader can judge the sample. */
function countWindows(buckets: CalibrationBucket[]): number {
  return buckets.reduce((total, bucket) => total + bucket.windowCount, 0);
}

/**
 * The calibration curve — what the market predicted against what happened,
 * measured across every settled window on the venue.
 */
export function useCalibration() {
  const { calibration, isLoading, error } = useAnalytics();
  const windowsMeasured = useMemo(() => countWindows(calibration), [calibration]);

  return { buckets: calibration, isLoading, error, windowsMeasured };
}

/** A band is overconfident when reality came in below what was quoted. */
export function isOverconfident(bucket: CalibrationBucket): boolean {
  return bucket.actualFrequency < bucket.predictedProbability - 0.02;
}
