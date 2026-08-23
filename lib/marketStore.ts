import type { MarketsResponse } from "@/app/api/markets/route";
import type { DataSource, LiveMarket } from "@/types/market";

/**
 * One poll of the market list, shared by every panel that needs it.
 *
 * Several panels read markets at once. Each holding its own timer would mean
 * several requests a cycle for identical data, and their answers drifting apart
 * as the responses arrived at different moments. A single module-level store
 * fixes both: one request, one answer, everyone in step.
 *
 * The network is genuinely an external system, so this is subscribed to rather
 * than fetched inside a render.
 */

export interface MarketSnapshot {
  markets: LiveMarket[];
  source: DataSource;
  venueId: string | null;
  note?: string;
  /** When this arrived, so countdowns can advance between polls. */
  fetchedAtSecond: number;
  isLoading: boolean;
}

const REFRESH_INTERVAL_MS = 15_000;

const EMPTY: MarketSnapshot = {
  markets: [],
  source: "mock",
  venueId: null,
  fetchedAtSecond: 0,
  isLoading: true,
};

let snapshot: MarketSnapshot = EMPTY;
let pollTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function publish(next: MarketSnapshot): void {
  snapshot = next;
  for (const notify of listeners) {
    notify();
  }
}

async function poll(): Promise<void> {
  try {
    const response = await fetch("/api/markets");
    const payload = (await response.json()) as MarketsResponse;
    publish({
      markets: payload.markets,
      source: payload.source,
      venueId: payload.venueId,
      note: payload.note,
      fetchedAtSecond: Math.floor(Date.now() / 1000),
      isLoading: false,
    });
  } catch {
    publish({
      ...snapshot,
      isLoading: false,
      note: "Could not reach the desk's market route.",
    });
  }
}

/**
 * Starts polling on the first subscriber and stops on the last, so a page with
 * no market panels does no network work.
 */
export function subscribeToMarkets(notify: () => void): () => void {
  listeners.add(notify);

  if (pollTimer === null) {
    void poll();
    pollTimer = setInterval(() => void poll(), REFRESH_INTERVAL_MS);
  }

  return () => {
    listeners.delete(notify);
    if (listeners.size === 0 && pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}

export function readMarketSnapshot(): MarketSnapshot {
  return snapshot;
}

/** The server has nothing polled yet, so it renders the empty state. */
export function readServerMarketSnapshot(): MarketSnapshot {
  return EMPTY;
}

/** Forces a read now, for a refresh control. */
export function refreshMarkets(): void {
  void poll();
}
