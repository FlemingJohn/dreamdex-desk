"use client";

import { useCallback, useState } from "react";
import { useSettlementInfo } from "@/hooks/useSettlementInfo";
import { useWriteActions } from "@/hooks/useWriteActions";

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
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const write = useWriteActions();

  /**
   * Pushes a settled market through to payout.
   *
   * pokeOracle pulls an answer the oracle has already posted; voidExpired
   * applies once the settlement window has lapsed with no answer, and refunds
   * both sides at 0.5. Either works on any market, including ones the trader
   * has no stake in — that is deliberate, so funds are never stranded behind
   * one party's permission.
   */
  const unblockMarket = useCallback(
    async (
      marketId: string,
      remedy: "pokeOracle" | "voidExpired",
      oracleQuestionId: string
    ) => {
      setBusyId(marketId);
      try {
        const outcome =
          remedy === "pokeOracle"
            ? await write.pokeOracle(marketId, oracleQuestionId)
            : await write.voidExpired(marketId);
        setLastMessage(outcome.message);
        if (outcome.ok) {
          await refresh();
        }
      } finally {
        setBusyId(null);
      }
    },
    [refresh, write]
  );

  return { stuckMarkets, busyId, lastMessage, unblockMarket, isLoading, error };
}
