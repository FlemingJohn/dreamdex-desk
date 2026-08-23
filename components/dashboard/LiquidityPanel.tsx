"use client";

import { PanelShell } from "@/components/dashboard/PanelShell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLiquidity } from "@/hooks/useLiquidity";
import { formatUsdcCompact } from "@/lib/format/formatUsdc";
import { formatWindow } from "@/lib/format/formatWindow";

/**
 * Which series actually trade.
 *
 * A venue lists far more windows than anyone trades, so knowing where the flow
 * is tells you which series is worth quoting in. Volume per window matters more
 * than the total: a series with a long history and no recent activity looks busy
 * in aggregate and is dead in practice.
 */
export function LiquidityPanel() {
  const { breakdowns, isLoading } = useLiquidity();

  return (
    <PanelShell
      id="liquidity"
      title="Where the flow is"
      description="Traded volume per series, so you can tell an active market from a listed one."
      askQuestion="Which series has enough real trading to be worth quoting in?"
    >
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : breakdowns.length === 0 ? (
        <p className="panel-note">No series on this venue has traded yet.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Series</TableHead>
                <TableHead className="text-right">Windows</TableHead>
                <TableHead className="text-right">Trades</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Per window</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdowns.map((breakdown) => (
                <TableRow key={`${breakdown.asset}-${breakdown.windowSeconds}`}>
                  <TableCell className="font-medium">
                    {breakdown.asset} {formatWindow(breakdown.windowSeconds)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {breakdown.windowsMeasured}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {breakdown.totalTrades.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatUsdcCompact(breakdown.totalVolumeUsdc)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatUsdcCompact(breakdown.averageVolumePerWindow)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="panel-note mt-3">
            How each fill crossed — two buyers meeting versus a genuine seller — is
            not on the market rows, only in the fill events themselves, so it is
            not claimed here.
          </p>
        </>
      )}
    </PanelShell>
  );
}
