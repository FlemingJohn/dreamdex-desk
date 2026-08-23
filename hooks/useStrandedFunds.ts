"use client";

import { useCallback, useMemo, useState } from "react";
import {
  getMockStuckMarkets,
  getMockVaultFallbacks,
  sumVaultFallbacks,
} from "@/lib/mock/mockStuckMarkets";

/**
 * Money the protocol is holding that nothing else will surface.
 *
 * Two separate problems, both invisible in the app today: markets that finished
 * without paying out because a settlement callback was missed, and payouts that
 * were parked in a pool vault because delivery to a wallet failed.
 *
 * Anyone can unblock the first kind, for anyone. That is worth stating plainly
 * in the interface — it is not a privilege, it is how the protocol avoids ever
 * stranding funds behind someone's permission.
 */
export function useStrandedFunds() {
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sweptVault, setSweptVault] = useState(false);

  const allStuck = useMemo(() => getMockStuckMarkets(), []);
  const stuckMarkets = useMemo(
    () => allStuck.filter((market) => !resolvedIds.includes(market.marketId)),
    [allStuck, resolvedIds]
  );

  const vaultFallbacks = useMemo(
    () => (sweptVault ? [] : getMockVaultFallbacks()),
    [sweptVault]
  );
  const vaultTotal = useMemo(() => sumVaultFallbacks(vaultFallbacks), [vaultFallbacks]);

  /** Pushes a settled market through, whichever remedy it needs. */
  const unblockMarket = useCallback(
    async (marketId: string, remedy: "pokeOracle" | "voidExpired") => {
      setBusyId(marketId);
      try {
        await fetch("/api/settlement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: remedy, marketId }),
        });
        setResolvedIds((current) => [...current, marketId]);
      } finally {
        setBusyId(null);
      }
    },
    []
  );

  const sweepVaults = useCallback(async () => {
    setBusyId("vault");
    try {
      await fetch("/api/vault", { method: "POST" });
      setSweptVault(true);
    } finally {
      setBusyId(null);
    }
  }, []);

  return {
    stuckMarkets,
    vaultFallbacks,
    vaultTotal,
    busyId,
    unblockMarket,
    sweepVaults,
    isLoading: false,
  };
}
