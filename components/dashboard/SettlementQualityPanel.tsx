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
import { useSettlementQuality } from "@/hooks/useSettlementQuality";
import { formatPercent } from "@/lib/format/formatPercent";
import { formatWindow } from "@/lib/format/formatWindow";

/**
 * How reliably does each series settle?
 *
 * When the oracle cannot agree on a price the market voids, and both sides are
 * refunded at 0.5 instead of one side paying 1. That refund cuts both ways: it
 * rescues a cheap position and punishes an expensive one, so the void rate
 * changes what a side is worth before you have bought it.
 */
export function SettlementQualityPanel() {
  const { rows, isLoading } = useSettlementQuality();

  return (
    <PanelShell
      id="settlement-quality"
      title="Settlement quality"
      description="Void rate and oracle agreement per series — a void refunds both sides at 0.5."
      askQuestion="Which series carry void risk, and how should that change what I pay?"
    >
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Series</TableHead>
                <TableHead className="text-right">Settled</TableHead>
                <TableHead className="text-right">Voided</TableHead>
                <TableHead className="text-right">Sources</TableHead>
                <TableHead className="text-right">Latency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.asset}-${formatWindow(row.windowSeconds)}`}>
                  <TableCell className="font-medium">
                    {row.asset} {formatWindow(row.windowSeconds)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {row.settledCount}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${
                      row.voidRate > 0.01 ? "side-down font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {formatPercent(row.voidRate, 1)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {row.averageSourcesAgreeing.toFixed(1)} / {row.totalSources}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {row.medianLatencySeconds.toFixed(1)}s
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="panel-note mt-3">
            ETH 15m voids most often. If you are buying a side below 0.50 there, the
            refund is worth more than the position — which quietly improves the trade.
          </p>
        </>
      )}
    </PanelShell>
  );
}
