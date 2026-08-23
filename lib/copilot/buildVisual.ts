import type { CopilotVisual } from "@/types/copilot";
import type { ReadToolName } from "@/lib/copilot/toolDefinitions";

/**
 * Turns a tool result into something drawable, where it has a natural shape.
 *
 * Not every answer does — a portfolio note or an error is prose, and forcing a
 * chart onto it would be decoration. So this returns null unless the data
 * genuinely reads better as a picture, and the transcript falls back to text.
 *
 * The payload is passed straight through rather than reshaped, so what is drawn
 * is exactly what the copilot reasoned over.
 */
export function buildVisual(name: ReadToolName, result: unknown): CopilotVisual | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  switch (name) {
    case "getCalibration":
      return Array.isArray(result) && result.length > 0
        ? { kind: "calibration", buckets: result }
        : null;

    case "listMarkets":
      return Array.isArray(result) && result.length > 0
        ? { kind: "markets", markets: result }
        : null;

    case "findEdge":
      return Array.isArray(result) && result.length > 0
        ? { kind: "edge", opportunities: result }
        : null;

    case "getProbabilityPath":
      return Array.isArray(result) && result.length > 0
        ? { kind: "path", points: result }
        : null;

    case "explainSettlement":
      return Array.isArray(result) && result.length > 0
        ? { kind: "receipts", receipts: result }
        : null;

    case "getOrderBook": {
      const book = result as {
        asset?: string;
        windowSeconds?: number;
        bids?: { probability: number; contracts: number }[];
        asks?: { probability: number; contracts: number }[];
      };
      if (!book.bids && !book.asks) {
        return null;
      }
      return {
        kind: "book",
        asset: book.asset ?? "—",
        windowSeconds: book.windowSeconds ?? 0,
        bids: book.bids ?? [],
        asks: book.asks ?? [],
      };
    }

    default:
      return null;
  }
}
