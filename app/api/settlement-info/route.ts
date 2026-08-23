import { NextResponse } from "next/server";
import { readSettlementReceipts, readStuckMarkets } from "@/lib/exchange/readSettlement";
import type { SettlementReceipt } from "@/types/analytics";
import type { StuckMarket } from "@/types/order";

export interface SettlementInfoResponse {
  receipts: SettlementReceipt[];
  stuckMarkets: StuckMarket[];
  error?: string;
}

/** Settled markets, and any that expired without finishing settling. */
export async function GET() {
  try {
    const [receipts, stuckMarkets] = await Promise.all([
      readSettlementReceipts(8),
      readStuckMarkets(),
    ]);
    return NextResponse.json({ receipts, stuckMarkets } satisfies SettlementInfoResponse);
  } catch (error) {
    return NextResponse.json({
      receipts: [],
      stuckMarkets: [],
      error: (error as Error).message.slice(0, 160),
    } satisfies SettlementInfoResponse);
  }
}
