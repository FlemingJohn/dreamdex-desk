"use client";

import { useAnalytics } from "@/hooks/useAnalytics";

/** Void rate and resolution latency per series. */
export function useSettlementQuality() {
  const { settlementQuality, isLoading, error } = useAnalytics();
  return { rows: settlementQuality, isLoading, error };
}
