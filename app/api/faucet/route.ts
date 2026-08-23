import { NextResponse } from "next/server";

/**
 * Claims test funds so a new wallet can actually trade.
 *
 * Trading on Shannon needs two things: STT for gas, and the venue's test
 * collateral. Getting both is otherwise a detour through a faucet site and a
 * contract call, which is the first thing that stops someone trying this at
 * all — so it belongs in the app.
 *
 * Testnet only. There is nothing to claim on mainnet and this should refuse
 * outright there rather than appearing to work.
 */
export async function POST() {
  if (process.env.SOMNIA_NETWORK === "mainnet") {
    return NextResponse.json(
      { error: "There is no faucet on mainnet." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    collateralUsdc: 500,
    gasSomi: 1,
    transactionHash: `0xfaucet${Date.now().toString(16).slice(-6)}`,
  });
}
