import { NextResponse } from "next/server";
import {
  readCalibration,
  readLiquidity,
  readProbabilityPath,
  readSettlementQuality,
} from "@/lib/exchange/readAnalytics";
import { resolveVenueId } from "@/lib/exchange/readMarkets";
import type {
  CalibrationBucket,
  LiquidityBreakdown,
  ProbabilityPathPoint,
  SettlementQualityRow,
} from "@/types/analytics";

export interface AnalyticsResponse {
  calibration: CalibrationBucket[];
  probabilityPath: ProbabilityPathPoint[];
  liquidity: LiquidityBreakdown[];
  settlementQuality: SettlementQualityRow[];
  venueId: string | null;
  error?: string;
}

/**
 * Everything computed from settled history, in one read.
 *
 * These four measurements all walk the same list of finalised markets, so
 * fetching them together means one pass over that history rather than four.
 *
 * On failure the arrays come back empty with the reason attached. An analytics
 * tool that invents numbers when the chain is unreachable is worse than one that
 * admits it cannot see.
 */
export async function GET() {
  try {
    const [calibration, probabilityPath, liquidity, settlementQuality, venueId] =
      await Promise.all([
        readCalibration(),
        readProbabilityPath(),
        readLiquidity(),
        readSettlementQuality(),
        resolveVenueId(),
      ]);

    return NextResponse.json({
      calibration,
      probabilityPath,
      liquidity,
      settlementQuality,
      venueId,
    } satisfies AnalyticsResponse);
  } catch (error) {
    return NextResponse.json({
      calibration: [],
      probabilityPath: [],
      liquidity: [],
      settlementQuality: [],
      venueId: null,
      error: (error as Error).message.slice(0, 160),
    } satisfies AnalyticsResponse);
  }
}
