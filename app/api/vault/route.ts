import { NextResponse } from "next/server";
import { getMockVaultFallbacks, sumVaultFallbacks } from "@/lib/mock/mockStuckMarkets";

/**
 * Withdraws payouts that were parked in pool vaults.
 *
 * Fills, cancels and redemptions normally auto-deliver to your wallet. When
 * that delivery fails the pool falls back to crediting its own vault and moves
 * on — so the money is yours, withdrawable, and sitting somewhere nobody looks,
 * because the vault reads zero in normal operation.
 */
export async function POST() {
  const fallbacks = getMockVaultFallbacks();

  return NextResponse.json({
    sweptUsdc: sumVaultFallbacks(fallbacks),
    poolsSwept: fallbacks.length,
    transactionHash: `0xsweep${Date.now().toString(16).slice(-6)}`,
  });
}
