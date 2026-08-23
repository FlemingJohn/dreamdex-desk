"use client";

import { useCopilot } from "@/components/copilot/CopilotProvider";
import { Button } from "@/components/ui/button";
import type { LiveMarket } from "@/types/market";
import { formatWindow } from "@/lib/format/formatWindow";

/** A sensible starting size — the trader adjusts before approving. */
const DEFAULT_CONTRACTS = 10;

interface TradeButtonsProps {
  market: LiveMarket;
}

/**
 * Buy either side straight from a market row.
 *
 * This does not place anything. It draws up the same proposal the copilot would
 * and opens it for approval, so pointing at a row and asking in words end up at
 * the identical gate with the identical checks.
 */
export function TradeButtons({ market }: TradeButtonsProps) {
  const { proposeTrade } = useCopilot();

  const describe = (side: "up" | "down") =>
    `${side === "up" ? "Up" : "Down"} on ${market.asset} ${formatWindow(market.windowSeconds)}, from the market list.`;

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => proposeTrade(market.marketId, "up", DEFAULT_CONTRACTS, describe("up"))}
      >
        Up
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          proposeTrade(market.marketId, "down", DEFAULT_CONTRACTS, describe("down"))
        }
      >
        Down
      </Button>
    </div>
  );
}
