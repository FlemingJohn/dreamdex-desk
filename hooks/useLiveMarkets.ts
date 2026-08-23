"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useSecondsNow } from "@/hooks/useSecondsNow";
import {
  readMarketSnapshot,
  readServerMarketSnapshot,
  refreshMarkets,
  subscribeToMarkets,
} from "@/lib/marketStore";

/**
 * Live markets, read from the chain through the desk's own route.
 *
 * Every panel that calls this shares one poll — the store underneath keeps a
 * single timer no matter how many components are listening. Countdowns then
 * advance locally each second, because the expiry is known and asking the chain
 * every second would be pointless traffic.
 */
export function useLiveMarkets() {
  const snapshot = useSyncExternalStore(
    subscribeToMarkets,
    readMarketSnapshot,
    readServerMarketSnapshot
  );
  const secondsNow = useSecondsNow();

  const markets = useMemo(() => {
    if (snapshot.fetchedAtSecond === 0) {
      return snapshot.markets;
    }
    const elapsed = secondsNow - snapshot.fetchedAtSecond;
    return snapshot.markets.map((market) => ({
      ...market,
      secondsRemaining: Math.max(0, market.secondsRemaining - elapsed),
    }));
  }, [secondsNow, snapshot]);

  const tradingMarkets = useMemo(
    () => markets.filter((market) => market.status === "trading"),
    [markets]
  );

  return {
    markets,
    tradingMarkets,
    source: snapshot.source,
    venueId: snapshot.venueId,
    note: snapshot.note,
    isLoading: snapshot.isLoading,
    refresh: refreshMarkets,
  };
}
