"use client";

import { useMemo } from "react";
import { getMockLiquidity } from "@/lib/mock/mockLiquidity";

/** How trades crossed, per series — mint-a-pair against genuine sellers. */
export function useLiquidity() {
  const breakdowns = useMemo(() => getMockLiquidity(), []);
  return { breakdowns, isLoading: false };
}
