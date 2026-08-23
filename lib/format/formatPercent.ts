/** Shares and rates that are already fractions of one. */
export function formatPercent(fraction: number, decimals = 0): string {
  return `${(fraction * 100).toFixed(decimals)}%`;
}

/** Gap between what the market predicted and what happened, in points. */
export function formatPointGap(predicted: number, actual: number): string {
  const gap = Math.round((actual - predicted) * 100);
  const sign = gap > 0 ? "+" : "";
  return `${sign}${gap}`;
}
