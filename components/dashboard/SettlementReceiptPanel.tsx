"use client";

import { ExternalLink } from "lucide-react";
import { PanelShell } from "@/components/dashboard/PanelShell";
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
import { useSettlementReceipts } from "@/hooks/useSettlementReceipts";
import { formatProbability } from "@/lib/format/formatProbability";
import { formatStrike, formatWindow } from "@/lib/format/formatWindow";

/**
 * How recent markets resolved, and the proof behind each one.
 *
 * Every settled market carries an oracle question id, and behind it sits the
 * whole pipeline — each price source, what it returned, the median across them,
 * and how many had to agree. The docs say outright that this is "worth surfacing
 * in any interface you build on top of event contracts". Nothing does, so a
 * losing trade is normally something you take on faith. Here it is a link.
 *
 * The final price next to the outcome is the interesting pair: a market that
 * settled UP after last trading at 0.30 was wrong right up to the end.
 */
export function SettlementReceiptPanel() {
  const { receipts, isLoading } = useSettlementReceipts();

  return (
    <PanelShell
      id="settlement-receipts"
      title="Settlement receipts"
      description="How each market resolved, with the oracle's own working one click away."
      askQuestion="Why did the most recent markets resolve the way they did?"
    >
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : receipts.length === 0 ? (
        <p className="panel-note">No settled markets to show on this venue yet.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Market</TableHead>
                <TableHead>Line</TableHead>
                <TableHead className="text-right">Final price</TableHead>
                <TableHead className="text-right">Result</TableHead>
                <TableHead className="text-right">Proof</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.marketId}>
                  <TableCell className="font-medium">
                    {receipt.asset} {formatWindow(receipt.windowSeconds)}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatStrike(receipt.strike)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatProbability(receipt.finalProbability)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={receipt.outcome === "voided" ? "destructive" : "secondary"}
                      className={
                        receipt.outcome === "up"
                          ? "side-up"
                          : receipt.outcome === "down"
                            ? "side-down"
                            : undefined
                      }
                    >
                      {receipt.outcome.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {receipt.explorerUrl ? (
                      <a
                        className="inline-flex items-center gap-1 text-xs underline underline-offset-2"
                        href={receipt.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        sources
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="panel-note mt-3">
            Each link opens the oracle&apos;s record for that market: every price source
            it asked, the value each returned, the median across them, and how many had
            to agree. A void means it could not get a reliable answer, so both sides
            refunded at 0.5.
          </p>
        </>
      )}
    </PanelShell>
  );
}
