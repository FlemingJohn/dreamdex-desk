"use client";

import { useMemo } from "react";
import { countCalibrationWindows, getMockCalibration } from "@/lib/mock/mockCalibration";

/**
 * The calibration curve — what the market predicted against what happened.
 * Built from settled history rather than the live book, so it does not change
 * while you watch it.
 */
export function useCalibration() {
  const buckets = useMemo(() => getMockCalibration(), []);

  return {
    buckets,
    isLoading: false,
    windowsMeasured: countCalibrationWindows(buckets),
  };
}
