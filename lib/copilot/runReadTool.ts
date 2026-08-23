import { getMockCalibration } from "@/lib/mock/mockCalibration";
import { getMockLiquidity } from "@/lib/mock/mockLiquidity";
import { getMockMarkets } from "@/lib/mock/mockMarkets";
import { getMockPortfolio, sumUnclaimedWinnings } from "@/lib/mock/mockPortfolio";
import { getMockOrderBook } from "@/lib/mock/mockOrderBook";
import { getMockProbabilityPath } from "@/lib/mock/mockProbabilityPath";
import { buildOracleExplorerUrl, getMockSettlementReceipts } from "@/lib/mock/mockSettlementReceipt";
import { getMockSettlementQuality } from "@/lib/mock/mockSettlementQuality";
import type { ReadToolName } from "@/lib/copilot/toolDefinitions";

/** These run on the server, where reading the clock directly is safe. */
function currentSecond(): number {
  return Math.floor(Date.now() / 1000);
}


/**
 * Runs one read tool and hands the result back to the model.
 *
 * These are safe to run without asking anyone, because none of them change
 * anything — they only look. Swapping the mock calls here for SDK reads is the
 * single step that takes the copilot from demo to live data.
 */
export function runReadTool(name: ReadToolName, args: Record<string, unknown> = {}): unknown {
  switch (name) {
    case "listMarkets":
      return getMockMarkets(currentSecond()).filter(
        (market) => market.status === "trading"
      );

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

    case "getOrderBook":
      return getMockOrderBook(String(args.marketId ?? "0x8471"));

    case "explainSettlement":
      return getMockSettlementReceipts().map((receipt) => ({
        ...receipt,
        explorerUrl: buildOracleExplorerUrl(receipt.oracleQuestionId),
      }));

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
