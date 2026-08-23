"use client";

import { useEffect, useState } from "react";
import { getMockPortfolio, sumUnclaimedWinnings } from "@/lib/mock/mockPortfolio";
import type { PortfolioSummary } from "@/types/portfolio";

/**
 * The trader's positions, realised performance, and anything the protocol owes
 * them. Claiming is left as an explicit action because redeeming is a real
 * transaction, not a read.
 */
export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPortfolio(getMockPortfolio());
    setIsLoading(false);
  }, []);

  return {
    portfolio,
    isLoading,
    unclaimedTotal: portfolio ? sumUnclaimedWinnings(portfolio) : 0,
  };
}
