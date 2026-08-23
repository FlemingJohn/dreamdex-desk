"use client";

import { useAnalytics } from "@/hooks/useAnalytics";

/** Traded volume and trade counts per series. */
export function useLiquidity() {
  const { liquidity, isLoading, error } = useAnalytics();
  return { breakdowns: liquidity, isLoading, error };
}
