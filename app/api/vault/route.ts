import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { connectExchange } from "@/lib/exchange/connectExchange";
import { readLiveMarkets } from "@/lib/exchange/readMarkets";

/**
 * Finds payouts parked in pool vaults.
 *
 * Fills, cancels and redemptions normally auto-deliver to a wallet. When that
 * delivery fails the pool credits its own vault instead and moves on — so the
 * money is yours, withdrawable, and sitting where nobody looks, because the
 * vault reads zero in normal operation.
 */
export async function POST(request: Request) {
  const { address } = (await request.json()) as { address?: string };

  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: "Connect a wallet before sweeping." },
      { status: 400 }
    );
  }

  try {
    const exchange = connectExchange();
    const markets = await readLiveMarkets(12);
    const parked: { poolAddress: string; amountUsdc: number }[] = [];

    for (const market of markets) {
      try {
        const onchain = await exchange.client.getMarketOnchain(
          market.marketId as `0x${string}`
        );
        const balance = await exchange.client.getVaultBalance({
          vault: onchain.pool,
          owner: address as `0x${string}`,
          token: onchain.collateral,
        });
        const amount = Number(balance ?? 0) / 10 ** Number(onchain.decimals ?? 6);
        if (amount > 0) {
          parked.push({ poolAddress: market.poolAddress, amountUsdc: amount });
        }
      } catch {
        // A pool that will not read is not a reason to stop checking the rest.
        continue;
      }
    }

    return NextResponse.json({
      parked,
      totalUsdc: parked.reduce((total, entry) => total + entry.amountUsdc, 0),
      poolsChecked: markets.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message.slice(0, 160) },
      { status: 500 }
    );
  }
}
