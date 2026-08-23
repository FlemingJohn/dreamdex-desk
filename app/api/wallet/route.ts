import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { readPortfolio, readWorkingOrders } from "@/lib/exchange/readWallet";
import type { PortfolioSummary } from "@/types/portfolio";
import type { WorkingOrder } from "@/types/order";

export interface WalletResponse {
  connected: boolean;
  portfolio: PortfolioSummary | null;
  workingOrders: WorkingOrder[];
  error?: string;
}

const NOT_CONNECTED: WalletResponse = {
  connected: false,
  portfolio: null,
  workingOrders: [],
};

/**
 * One wallet's positions, orders and unclaimed winnings.
 *
 * The address arrives as a query parameter because the desk signs in the
 * browser, so the server has no other way to know which wallet is connected.
 * Addresses are public, and reading positions from one is what any block
 * explorer does — but it is validated first, since an unchecked string would
 * fail deep inside the SDK with an unhelpful error.
 */
export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address");

  if (!address) {
    return NextResponse.json(NOT_CONNECTED);
  }

  if (!isAddress(address)) {
    return NextResponse.json({
      ...NOT_CONNECTED,
      error: "That is not a valid address.",
    } satisfies WalletResponse);
  }

  try {
    const [portfolio, workingOrders] = await Promise.all([
      readPortfolio(address),
      readWorkingOrders(address),
    ]);

    return NextResponse.json({
      connected: true,
      portfolio,
      workingOrders,
    } satisfies WalletResponse);
  } catch (error) {
    return NextResponse.json({
      ...NOT_CONNECTED,
      error: (error as Error).message.slice(0, 160),
    } satisfies WalletResponse);
  }
}
