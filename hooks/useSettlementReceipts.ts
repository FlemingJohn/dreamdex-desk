"use client";

import { useSettlementInfo } from "@/hooks/useSettlementInfo";

/** Recently settled markets, with the link to what decided each one. */
export function useSettlementReceipts() {
  const { receipts, isLoading, error } = useSettlementInfo();
  return { receipts, isLoading, error };
}
