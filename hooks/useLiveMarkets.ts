"use client";

import { useEffect, useState } from "react";
import { getMockMarkets } from "@/lib/mock/mockMarkets";
import type { LiveMarket } from "@/types/market";

/**
 * The live market list, refreshed every second so the countdowns tick.
 *
 * When the app reads the chain this is the only file that changes: swap the
 * mock call for the SDK's market list and everything above keeps working.
 */
export function useLiveMarkets() {
  const [markets, setMarkets] = useState<LiveMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function refresh() {
      setMarkets(getMockMarkets());
      setIsLoading(false);
    }

    refresh();
    const timer = setInterval(refresh, 1000);
    return () => clearInterval(timer);
  }, []);

  const tradingMarkets = markets.filter((market) => market.status === "trading");

  return { markets, tradingMarkets, isLoading };
}
