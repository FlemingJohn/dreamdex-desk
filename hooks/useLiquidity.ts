"use client";

import { useEffect, useState } from "react";
import { getMockLiquidity } from "@/lib/mock/mockLiquidity";
import type { LiquidityBreakdown } from "@/types/analytics";

/** How trades crossed, per series — mint-a-pair against genuine sellers. */
export function useLiquidity() {
  const [breakdowns, setBreakdowns] = useState<LiquidityBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setBreakdowns(getMockLiquidity());
    setIsLoading(false);
  }, []);

  return { breakdowns, isLoading };
}
