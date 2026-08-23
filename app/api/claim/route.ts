import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { readUnclaimedWinnings } from "@/lib/exchange/readWallet";

/**
 * Reports what the protocol owes the wallet, ready to redeem.
 *
 * A winning position pays only when someone redeems it, and settled markets
 * drop out of the ordinary market list — so this money is invisible unless
 * something goes looking for it, which is what this does.
 *
 * Signing happens in the browser, because that is where the wallet is. This
 * route finds the claims and hands them back; it never holds a key.
 */
export async function POST(request: Request) {
  const { address } = (await request.json()) as { address?: string };

  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: "Connect a wallet before claiming." },
      { status: 400 }
    );
  }

  try {
    const claims = await readUnclaimedWinnings(address);
    return NextResponse.json({
      claims,
      claimableUsdc: claims.reduce((total, claim) => total + claim.amountUsdc, 0),
      marketsFound: claims.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message.slice(0, 160) },
      { status: 500 }
    );
  }
}
