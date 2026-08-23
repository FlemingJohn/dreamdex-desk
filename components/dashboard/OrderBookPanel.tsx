"use client";

import { PanelShell } from "@/components/dashboard/PanelShell";
import { Badge } from "@/components/ui/badge";
import { useLiveMarkets } from "@/hooks/useLiveMarkets";
import { useOrderBook } from "@/hooks/useOrderBook";
import { formatProbability } from "@/lib/format/formatProbability";

/**
 * Where the resting orders actually sit.
 *
 * Up and Down share one book quoted in Up terms, so every ask is also somebody
 * offering Down. The bar behind each row is size, which shows at a glance
 * whether the touch is real depth or a single small order.
 */
export function OrderBookPanel() {
  const { tradingMarkets } = useLiveMarkets();
  const market = tradingMarkets[0];
  const { book, deepestLevel } = useOrderBook(market?.marketId ?? "0x8471");

  if (!market) {
    return null;
  }

  return (
    <PanelShell
      title="Order book"
      description="Resting size on the shared Up/Down book. An ask is also somebody offering Down."
      headerExtra={
        <Badge variant="secondary">
          {market.asset} {market.windowLength}
        </Badge>
      }
    >
      <div className="book-ladder">
        {[...book.asks].reverse().map((level) => (
          <div className="book-row" key={`ask-${level.probability}`}>
            <span
              className="book-depth book-depth-ask"
              style={{ width: `${(level.contracts / deepestLevel) * 100}%` }}
            />
            <span className="book-price side-down">
              {formatProbability(level.probability)}
            </span>
            <span className="book-size">{level.contracts.toLocaleString()}</span>
          </div>
        ))}

        <div className="book-spread">
          spread {formatProbability(market.spread)} · mid{" "}
          {formatProbability(market.upProbability)}
        </div>

        {book.bids.map((level) => (
          <div className="book-row" key={`bid-${level.probability}`}>
            <span
              className="book-depth book-depth-bid"
              style={{ width: `${(level.contracts / deepestLevel) * 100}%` }}
            />
            <span className="book-price side-up">
              {formatProbability(level.probability)}
            </span>
            <span className="book-size">{level.contracts.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
