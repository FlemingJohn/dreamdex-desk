"use client";

import { useCallback, useState } from "react";
import { useSettlementInfo } from "@/hooks/useSettlementInfo";

/**
 * Markets that expired without paying out.
 *
 * Anyone can unblock these, for anyone — that is deliberate protocol design so
 * funds are never stranded behind one party's permission. The buttons therefore
 * work on markets the trader holds no position in.
 */
export function useStrandedFunds() {
  const { stuckMarkets, isLoading, error, refresh } = useSettlementInfo();
  const [busyId, setBusyId] = useState<string | null>(null);

  const unblockMarket = useCallback(
    async (marketId: string, remedy: "pokeOracle" | "voidExpired") => {
      setBusyId(marketId);
      try {
        await fetch("/api/settlement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: remedy, marketId }),
        });
        await refresh();
      } finally {
        setBusyId(null);
      }
    },
    [refresh]
  );

  return { stuckMarkets, busyId, unblockMarket, isLoading, error };
}
