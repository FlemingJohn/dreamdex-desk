import type { WriteToolName } from "@/lib/copilot/toolDefinitions";

/**
 * Write tools that do not need a person's approval.
 *
 * There are two kinds of write on this venue, and conflating them would be a
 * mistake in both directions. Buying something can lose you money, so it goes
 * through the approval card. Cancelling an order, shrinking one, pushing a
 * settled market through, or withdrawing a stranded payout can only ever return
 * funds to you — the worst outcome is gas spent on nothing. Making the copilot
 * stop and ask before each of those would train the trader to click approve
 * without reading, which is exactly the habit the approval card depends on
 * them not having.
 *
 * So: anything that can spend money is proposed. Anything that can only
 * recover it runs.
 */

export interface WriteToolOutcome {
  summary: string;
  detail: Record<string, unknown>;
}

function fakeHash(prefix: string): string {
  return `0x${prefix}${Date.now().toString(16).slice(-6)}`;
}

export function isSafeWriteTool(name: string): boolean {
  return ["cancelOrders", "reduceOrder", "unblockMarket", "sweepVaults"].includes(name);
}

export function runWriteTool(
  name: Exclude<WriteToolName, "proposeTrade">,
  args: Record<string, unknown>
): WriteToolOutcome {
  switch (name) {
    case "cancelOrders": {
      const orderIds = Array.isArray(args.orderIds) ? (args.orderIds as string[]) : [];
      return {
        summary: `cancelled ${orderIds.length} order${orderIds.length === 1 ? "" : "s"}`,
        detail: { cancelled: orderIds, transactionHash: fakeHash("cancel") },
      };
    }

    case "reduceOrder":
      return {
        summary: `shrunk to ${args.newContracts} contracts`,
        detail: {
          orderId: args.orderId,
          newContracts: args.newContracts,
          keptQueuePriority: true,
          transactionHash: fakeHash("reduce"),
        },
      };

    case "unblockMarket": {
      const isVoid = args.remedy === "voidExpired";
      return {
        summary: isVoid ? "voided — both sides refund at 0.5" : "resolved, redemption open",
        detail: {
          marketId: args.marketId,
          outcome: isVoid ? "voided" : "resolved",
          transactionHash: fakeHash(isVoid ? "void" : "poke"),
        },
      };
    }

    case "sweepVaults":
      return {
        summary: "withdrew the parked payouts",
        detail: { sweptUsdc: 13.75, poolsSwept: 2, transactionHash: fakeHash("sweep") },
      };

    default:
      return { summary: "unknown tool", detail: { error: name } };
  }
}
