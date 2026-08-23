"use client";

import { useSyncExternalStore } from "react";
import { createPollingStore } from "@/lib/createPollingStore";
import type { SettlementInfoResponse } from "@/app/api/settlement-info/route";

const EMPTY: SettlementInfoResponse = { receipts: [], stuckMarkets: [] };

const settlementStore = createPollingStore<SettlementInfoResponse>({
  url: "/api/settlement-info",
  intervalMs: 60_000,
  empty: EMPTY,
  onError: (current, message) => ({ ...current, error: message }),
});

/** Settled markets, and any that expired without finishing settling. */
export function useSettlementInfo() {
  const data = useSyncExternalStore(
    settlementStore.subscribe,
    settlementStore.read,
    settlementStore.readServer
  );

  return {
    ...data,
    isLoading: data.receipts.length === 0 && !data.error,
    refresh: settlementStore.refresh,
  };
}
