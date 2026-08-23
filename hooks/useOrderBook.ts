"use client";

import { useMemo } from "react";
import { getMockOrderBook } from "@/lib/mock/mockOrderBook";

/** The resting book for one market, quoted in Up terms. */
export function useOrderBook(marketId: string) {
  const book = useMemo(() => getMockOrderBook(marketId), [marketId]);

  const deepestLevel = useMemo(
    () =>
      Math.max(
        ...book.bids.map((level) => level.contracts),
        ...book.asks.map((level) => level.contracts)
      ),
    [book]
  );

  return { book, deepestLevel, isLoading: false };
}
