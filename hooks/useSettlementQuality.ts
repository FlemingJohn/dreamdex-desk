"use client";

import { useMemo } from "react";
import { getMockSettlementQuality } from "@/lib/mock/mockSettlementQuality";

/** Void rates and oracle source agreement, per series. */
export function useSettlementQuality() {
  const rows = useMemo(() => getMockSettlementQuality(), []);
  return { rows, isLoading: false };
}
