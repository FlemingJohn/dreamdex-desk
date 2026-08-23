"use client";

import { useMemo } from "react";
import { useSecondsNow } from "@/hooks/useSecondsNow";
import { getMockMarkets } from "@/lib/mock/mockMarkets";

/**
 * The live market list, recomputed every second so countdowns tick.
 *
 * When the app reads the chain this is the only file that changes: swap the
 * mock call for the SDK's market list and everything above keeps working.
 */
export function useLiveMarkets() {
  const secondsNow = useSecondsNow();
  const markets = useMemo(() => getMockMarkets(secondsNow), [secondsNow]);

  const tradingMarkets = useMemo(
    () => markets.filter((market) => market.status === "trading"),
    [markets]
  );

  return { markets, tradingMarkets, isLoading: false };
}
