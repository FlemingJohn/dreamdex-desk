"use client";

import { useMemo } from "react";
import { getMockPortfolio, sumUnclaimedWinnings } from "@/lib/mock/mockPortfolio";

/**
 * The trader's positions, realised performance, and anything the protocol owes
 * them. Claiming stays an explicit action because redeeming is a real
 * transaction, not a read.
 */
export function usePortfolio() {
  const portfolio = useMemo(() => getMockPortfolio(), []);
  const unclaimedTotal = useMemo(() => sumUnclaimedWinnings(portfolio), [portfolio]);

  return { portfolio, isLoading: false, unclaimedTotal };
}
