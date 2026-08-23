"use client";

import { useCallback, useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useWriteActions } from "@/hooks/useWriteActions";

/**
 * Redeems everything the protocol owes.
 *
 * Each market is redeemed separately, because a redemption is per market — so a
 * wallet owed money across five settled windows signs five times. That is the
 * protocol's shape rather than a choice here.
 *
 * Unlike a trade this needs no approval card: claiming can only pay you, so the
 * worst outcome is gas spent on nothing.
 */
export function useClaimWinnings() {
  const { portfolio, refresh } = usePortfolio();
  const { redeem, canSign } = useWriteActions();
  const [isClaiming, setIsClaiming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const claimAll = useCallback(async () => {
    const claims = portfolio?.unclaimedWinnings ?? [];
    if (claims.length === 0) {
      return;
    }

    setIsClaiming(true);
    let claimed = 0;
    try {
      for (const claim of claims) {
        const outcome = await redeem(claim.marketId, claim.amountUsdc);
        if (outcome.ok) {
          claimed += 1;
        } else {
          // A rejected prompt should stop the run, not plough on prompting again.
          setMessage(outcome.message);
          break;
        }
      }
      if (claimed > 0) {
        setMessage(`Redeemed ${claimed} of ${claims.length} settled markets.`);
        await refresh();
      }
    } finally {
      setIsClaiming(false);
    }
  }, [portfolio, redeem, refresh]);

  return { claimAll, isClaiming, message, canSign };
}
