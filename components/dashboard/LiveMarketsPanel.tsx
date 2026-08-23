"use client";

import { PanelShell } from "@/components/dashboard/PanelShell";
import { TradeButtons } from "@/components/dashboard/TradeButtons";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLiveMarkets } from "@/hooks/useLiveMarkets";
import { formatCountdown, isClosingSoon } from "@/lib/format/formatCountdown";
import { formatProbability } from "@/lib/format/formatProbability";
import { formatUsdcCompact } from "@/lib/format/formatUsdc";

/**
 * Every open window in one place.
 *
 * The dreamDEX app shows one market at a time, so there is no way to compare
 * what is tradeable right now. Time remaining is called out because a window
 * close to expiry can lock between reading it and sending an order.
 */
export function LiveMarketsPanel() {
  const { tradingMarkets, isLoading } = useLiveMarkets();

  return (
    <PanelShell
      id="live-markets"
      title="Live markets"
      description="Every open window. The line is each window's own opening price — there are no strikes."
      headerExtra={<Badge variant="secondary">{tradingMarkets.length} open</Badge>}
      askQuestion="Which of the open markets looks most mispriced right now?"
      className="panel-grid-wide"
    >
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Market</TableHead>
              <TableHead>Line</TableHead>
              <TableHead>Now</TableHead>
              <TableHead className="text-right">Up</TableHead>
              <TableHead className="text-right">Spread</TableHead>
              <TableHead className="text-right">Depth</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="text-right">Left</TableHead>
              <TableHead className="text-right">Trade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tradingMarkets.map((market) => {
              const movedUp = market.currentPrice >= market.openingPrice;
              const closingSoon = isClosingSoon(market.secondsRemaining);

              return (
                <TableRow key={market.marketId}>
                  <TableCell className="font-medium">
                    {market.asset} {market.windowLength}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {market.openingPrice.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={`tabular-nums ${movedUp ? "side-up" : "side-down"}`}
                  >
                    {market.currentPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatProbability(market.upProbability)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatProbability(market.spread)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatUsdcCompact(market.depthAtTouch)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatUsdcCompact(market.volumeUsdc)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {closingSoon ? (
                      <Badge variant="destructive">
                        {formatCountdown(market.secondsRemaining)}
                      </Badge>
                    ) : (
                      formatCountdown(market.secondsRemaining)
                    )}
                  </TableCell>
                  <TableCell>
                    <TradeButtons market={market} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </PanelShell>
  );
}
