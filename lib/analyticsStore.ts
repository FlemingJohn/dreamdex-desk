import type { AnalyticsResponse } from "@/app/api/analytics/route";

/**
 * One read of the settled-history analytics, shared by every panel.
 *
 * Calibration, the probability path, liquidity and settlement quality all walk
 * the same list of finalised markets, so they are fetched together and cached
 * here. They describe history rather than the live book, so this refreshes far
 * less often than the market list — a settled window does not change.
 */

export interface AnalyticsSnapshot extends AnalyticsResponse {
  isLoading: boolean;
}

const REFRESH_INTERVAL_MS = 120_000;

const EMPTY: AnalyticsSnapshot = {
  calibration: [],
  probabilityPath: [],
  liquidity: [],
  settlementQuality: [],
  venueId: null,
  isLoading: true,
};

let snapshot: AnalyticsSnapshot = EMPTY;
let pollTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function publish(next: AnalyticsSnapshot): void {
  snapshot = next;
  for (const notify of listeners) {
    notify();
  }
}

async function poll(): Promise<void> {
  try {
    const response = await fetch("/api/analytics");
    const payload = (await response.json()) as AnalyticsResponse;
    publish({ ...payload, isLoading: false });
  } catch {
    publish({
      ...snapshot,
      isLoading: false,
      error: "Could not reach the desk's analytics route.",
    });
  }
}

export function subscribeToAnalytics(notify: () => void): () => void {
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

export function readAnalyticsSnapshot(): AnalyticsSnapshot {
  return snapshot;
}

/** The server has nothing polled yet, so it renders the empty state. */
export function readServerAnalyticsSnapshot(): AnalyticsSnapshot {
  return EMPTY;
}
