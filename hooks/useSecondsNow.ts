"use client";

import { useSyncExternalStore } from "react";

/**
 * The current unix second, re-read once a second.
 *
 * Countdowns are the one part of the dashboard that genuinely changes on a
 * timer. Reading the clock through an external store rather than an effect
 * means the server and the browser agree on the first render, and the value
 * updates cleanly after that.
 */

function subscribe(notify: () => void): () => void {
  const timer = setInterval(notify, 1000);
  return () => clearInterval(timer);
}

function readCurrentSecond(): number {
  return Math.floor(Date.now() / 1000);
}

/** The server has no live clock, so it renders from a fixed point. */
function readServerSecond(): number {
  return 0;
}

export function useSecondsNow(): number {
  return useSyncExternalStore(subscribe, readCurrentSecond, readServerSecond);
}
