"use client";

import { useEffect, useState } from "react";
import { getMockSettlementQuality } from "@/lib/mock/mockSettlementQuality";
import type { SettlementQualityRow } from "@/types/analytics";

/** Void rates and oracle source agreement, per series. */
export function useSettlementQuality() {
  const [rows, setRows] = useState<SettlementQualityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setRows(getMockSettlementQuality());
    setIsLoading(false);
  }, []);

  return { rows, isLoading };
}
