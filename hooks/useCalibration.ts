"use client";

import { useEffect, useState } from "react";
import { countCalibrationWindows, getMockCalibration } from "@/lib/mock/mockCalibration";
import type { CalibrationBucket } from "@/types/analytics";

/**
 * The calibration curve — what the market predicted against what happened.
 * Static once loaded, since it is built from settled history rather than the
 * live book.
 */
export function useCalibration() {
  const [buckets, setBuckets] = useState<CalibrationBucket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setBuckets(getMockCalibration());
    setIsLoading(false);
  }, []);

  return {
    buckets,
    isLoading,
    windowsMeasured: countCalibrationWindows(buckets),
  };
}
