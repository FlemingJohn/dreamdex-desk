/**
 * A store that polls a URL and lets React subscribe to it.
 *
 * The network is genuinely an external system, so it is subscribed to rather
 * than fetched from inside a render — which is both what React 19 wants and
 * what stops several panels each running their own timer for the same data.
 *
 * Polling starts on the first subscriber and stops on the last, so a page that
 * shows none of this data does no network work.
 */

export interface PollingStore<T> {
  subscribe: (notify: () => void) => () => void;
  read: () => T;
  readServer: () => T;
  refresh: () => void;
  /** Changes what is being polled — used when the key is an address. */
  setUrl: (url: string | null) => void;
}

interface PollingOptions<T> {
  /** The URL to read, or null to hold the empty state. */
  url: string | null;
  intervalMs: number;
  empty: T;
  /** Shapes the failure case, so callers can say what went wrong. */
  onError?: (current: T, message: string) => T;
}

export function createPollingStore<T>({
  url: initialUrl,
  intervalMs,
  empty,
  onError,
}: PollingOptions<T>): PollingStore<T> {
  let url = initialUrl;
  let snapshot = empty;
  let timer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();

  function publish(next: T): void {
    snapshot = next;
    for (const notify of listeners) {
      notify();
    }
  }

  async function poll(): Promise<void> {
    if (url === null) {
      publish(empty);
      return;
    }
    try {
      const response = await fetch(url);
      publish((await response.json()) as T);
    } catch {
      publish(
        onError ? onError(snapshot, "Could not reach the desk.") : snapshot
      );
    }
  }

  function start(): void {
    if (timer === null) {
      void poll();
      timer = setInterval(() => void poll(), intervalMs);
    }
  }

  function stop(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  return {
    subscribe(notify) {
      listeners.add(notify);
      start();
      return () => {
        listeners.delete(notify);
        if (listeners.size === 0) {
          stop();
        }
      };
    },
    read: () => snapshot,
    readServer: () => empty,
    refresh: () => void poll(),
    setUrl(next) {
      if (next === url) {
        return;
      }
      url = next;
      snapshot = empty;
      // Restart so the new target is read immediately rather than next tick.
      if (listeners.size > 0) {
        stop();
        start();
      }
    },
  };
}
