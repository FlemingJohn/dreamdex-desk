/**
 * Window lengths as people say them.
 *
 * Live venues run anything from a minute to a day, so this takes the raw
 * seconds off the market row rather than assuming one of a fixed set.
 */
export function formatWindow(windowSeconds: number): string {
  if (windowSeconds < 60) {
    return `${windowSeconds}s`;
  }
  if (windowSeconds < 3600) {
    return `${Math.round(windowSeconds / 60)}m`;
  }
  if (windowSeconds < 86400) {
    return `${Math.round(windowSeconds / 3600)}h`;
  }
  return `${Math.round(windowSeconds / 86400)}d`;
}

/** The line a close is measured against, when the venue sets one. */
export function formatStrike(strike: number | null): string {
  if (strike === null) {
    return "opening price";
  }
  return strike.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
