"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAccount } from "wagmi";
import { createPollingStore } from "@/lib/createPollingStore";
import type { WalletResponse } from "@/app/api/wallet/route";

const EMPTY: WalletResponse = { connected: false, portfolio: null, workingOrders: [] };

const walletStore = createPollingStore<WalletResponse>({
  url: null,
  intervalMs: 30_000,
  empty: EMPTY,
  onError: (current, message) => ({ ...current, error: message }),
});

/**
 * The connected wallet's positions, orders and unclaimed winnings.
 *
 * The store is pointed at whichever address is connected, so switching wallets
 * replaces the data rather than blending two accounts. With nothing connected
 * it reports exactly that, and the panels say so instead of showing an empty
 * book as though it were a real one.
 */
export function useWallet() {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    walletStore.setUrl(address ? `/api/wallet?address=${address}` : null);
  }, [address]);

  const data = useSyncExternalStore(
    walletStore.subscribe,
    walletStore.read,
    walletStore.readServer
  );

  return {
    address,
    isConnected,
    portfolio: data.portfolio,
    workingOrders: data.workingOrders,
    error: data.error,
    isLoading: isConnected && data.portfolio === null && !data.error,
    refresh: walletStore.refresh,
  };
}
