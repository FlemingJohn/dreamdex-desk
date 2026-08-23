"use client";

import { useMemo } from "react";
import { getMockSettlementReceipts } from "@/lib/mock/mockSettlementReceipt";

/** The most recently settled markets, with the oracle's working attached. */
export function useSettlementReceipts() {
  const receipts = useMemo(() => getMockSettlementReceipts(), []);
  return { receipts, isLoading: false };
}
