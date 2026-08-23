/** Collateral amounts, always shown with the ticker so nothing is ambiguous. */
export function formatUsdc(amount: number): string {
  return `${amount.toFixed(2)} USDC`;
}

/** Compact form for dense tables — 8.2k rather than 8200.00 USDC. */
export function formatUsdcCompact(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k`;
  }
  return amount.toFixed(0);
}

/** Profit and loss reads better with an explicit sign. */
export function formatSignedUsdc(amount: number): string {
  const sign = amount >= 0 ? "+" : "";
  return `${sign}${amount.toFixed(2)}`;
}
