"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BookResponse } from "@/app/api/book/route";
import type { OrderBook } from "@/types/market";

const EMPTY: OrderBook = { marketId: "", bids: [], asks: [] };

/** The resting book for one market, quoted in Up terms. */
export function useOrderBook(marketId: string | null, poolAddress: string | null) {
  const [book, setBook] = useState<OrderBook>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!marketId || !poolAddress) {
      setBook(EMPTY);
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `/api/book?marketId=${marketId}&pool=${poolAddress}`
      );
      const payload = (await response.json()) as BookResponse;
      setBook(payload.book);
    } catch {
      setBook(EMPTY);
    } finally {
      setIsLoading(false);
    }
  }, [marketId, poolAddress]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 10_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const deepestLevel = useMemo(() => {
    const sizes = [...book.bids, ...book.asks].map((level) => level.contracts);
    return sizes.length > 0 ? Math.max(...sizes) : 1;
  }, [book]);

  return { book, deepestLevel, isLoading };
}
