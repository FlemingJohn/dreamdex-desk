"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import type { WalletResponse } from "@/app/api/wallet/route";

const EMPTY: WalletResponse = { connected: false, portfolio: null, workingOrders: [] };

/**
 * The connected wallet's positions, orders and unclaimed winnings.
 *
 * Keyed on the address, so connecting a different wallet replaces the data
 * rather than blending the two. When nothing is connected this reports exactly
 * that, and the panels say so instead of showing an empty book as if it were
 * a real one.
 */
export function useWallet() {
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<WalletResponse>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) {
      setData(EMPTY);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/wallet?address=${address}`);
      setData((await response.json()) as WalletResponse);
    } catch {
      setData({ ...EMPTY, error: "Could not read the wallet." });
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  return {
    address,
    isConnected,
    portfolio: data.portfolio,
    workingOrders: data.workingOrders,
    error: data.error,
    isLoading,
    refresh,
  };
}
