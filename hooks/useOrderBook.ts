"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { createPollingStore } from "@/lib/createPollingStore";
import type { BookResponse } from "@/app/api/book/route";

const EMPTY: BookResponse = {
  book: { marketId: "", bids: [], asks: [] },
  bestBid: null,
  bestAsk: null,
  spread: 0,
};

const bookStore = createPollingStore<BookResponse>({
  url: null,
  intervalMs: 10_000,
  empty: EMPTY,
});

/**
 * The resting book for one market, quoted in Up terms.
 *
 * Polled faster than the market list because depth at the touch is the figure
 * that moves most — a spread read a minute ago is not worth acting on.
 */
export function useOrderBook(marketId: string | null, poolAddress: string | null) {
  useEffect(() => {
    bookStore.setUrl(
      marketId && poolAddress
        ? `/api/book?marketId=${marketId}&pool=${poolAddress}`
        : null
    );
  }, [marketId, poolAddress]);

  const data = useSyncExternalStore(
    bookStore.subscribe,
    bookStore.read,
    bookStore.readServer
  );

  const deepestLevel = useMemo(() => {
    const sizes = [...data.book.bids, ...data.book.asks].map((level) => level.contracts);
    return sizes.length > 0 ? Math.max(...sizes) : 1;
  }, [data.book]);

  return {
    book: data.book,
    bestBid: data.bestBid,
    bestAsk: data.bestAsk,
    spread: data.spread,
    deepestLevel,
    isLoading: data.book.bids.length === 0 && data.book.asks.length === 0,
  };
}
