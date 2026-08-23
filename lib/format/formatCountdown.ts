/**
 * Time left in a window, as mm:ss. Windows expire on a schedule and a market
 * close to expiry can lock between reading it and sending an order, so the
 * remaining time is worth showing prominently.
 */
export function formatCountdown(secondsRemaining: number): string {
  if (secondsRemaining <= 0) {
    return "--:--";
  }
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** True when a window is too close to expiry to safely place an order. */
export function isClosingSoon(secondsRemaining: number): boolean {
  return secondsRemaining > 0 && secondsRemaining < 120;
}
