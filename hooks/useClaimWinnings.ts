"use client";

import { useCallback, useState } from "react";

interface ClaimResult {
  claimedUsdc: number;
  marketsSwept: number;
  transactionHash: string;
}

/**
 * Redeems everything the protocol still owes.
 *
 * Unlike a trade this needs no approval card. A trade can lose you money; a
 * claim can only pay you, so the worst outcome is gas spent on nothing.
 */
export function useClaimWinnings() {
  const [isClaiming, setIsClaiming] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);

  const claimAll = useCallback(async () => {
    setIsClaiming(true);
    try {
      const response = await fetch("/api/claim", { method: "POST" });
      setResult((await response.json()) as ClaimResult);
    } catch {
      setResult(null);
    } finally {
      setIsClaiming(false);
    }
  }, []);

  return { claimAll, isClaiming, result };
}
