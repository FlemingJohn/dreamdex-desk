import { getMockCalibration } from "@/lib/mock/mockCalibration";
import { getMockLiquidity } from "@/lib/mock/mockLiquidity";
import { getMockMarkets } from "@/lib/mock/mockMarkets";
import { getMockPortfolio, sumUnclaimedWinnings } from "@/lib/mock/mockPortfolio";
import { getMockProbabilityPath } from "@/lib/mock/mockProbabilityPath";
import { getMockSettlementQuality } from "@/lib/mock/mockSettlementQuality";
import type { ReadToolName } from "@/lib/copilot/toolDefinitions";

/**
 * Runs one read tool and hands the result back to the model.
 *
 * These are safe to run without asking anyone, because none of them change
 * anything — they only look. Swapping the mock calls here for SDK reads is the
 * single step that takes the copilot from demo to live data.
 */
export function runReadTool(name: ReadToolName): unknown {
  switch (name) {
    case "listMarkets":
      return getMockMarkets().filter((market) => market.status === "trading");

    case "getCalibration":
      return getMockCalibration();

    case "getProbabilityPath":
      return getMockProbabilityPath();

    case "getLiquidity":
      return getMockLiquidity();

    case "getSettlementQuality":
      return getMockSettlementQuality();

    case "getPortfolio": {
      const portfolio = getMockPortfolio();
      return { ...portfolio, unclaimedTotalUsdc: sumUnclaimedWinnings(portfolio) };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

/** A short line describing what a tool returned, shown in the transcript. */
export function summarizeReadResult(name: ReadToolName, result: unknown): string {
  if (Array.isArray(result)) {
    return `${result.length} rows`;
  }
  if (name === "getPortfolio") {
    const portfolio = result as { unclaimedTotalUsdc: number };
    return `${portfolio.unclaimedTotalUsdc.toFixed(2)} USDC unclaimed`;
  }
  return "ok";
}
