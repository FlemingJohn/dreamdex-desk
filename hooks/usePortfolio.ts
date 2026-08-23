"use client";

import { useMemo } from "react";
import { useWallet } from "@/hooks/useWallet";
import type { PortfolioSummary } from "@/types/portfolio";

function sumUnclaimed(portfolio: PortfolioSummary | null): number {
  if (!portfolio) {
    return 0;
  }
  return portfolio.unclaimedWinnings.reduce((total, entry) => total + entry.amountUsdc, 0);
}

/**
 * The connected wallet's book. Claiming stays an explicit action because
 * redeeming is a transaction, not a read.
 */
export function usePortfolio() {
  const { portfolio, isConnected, isLoading, error, refresh } = useWallet();
  const unclaimedTotal = useMemo(() => sumUnclaimed(portfolio), [portfolio]);

  return { portfolio, isConnected, unclaimedTotal, isLoading, error, refresh };
}
