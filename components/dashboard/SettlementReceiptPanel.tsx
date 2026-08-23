"use client";

import { ExternalLink } from "lucide-react";
import { PanelShell } from "@/components/dashboard/PanelShell";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSettlementReceipts } from "@/hooks/useSettlementReceipts";
import { buildOracleExplorerUrl } from "@/lib/mock/mockSettlementReceipt";

/**
 * Why did that market resolve the way it did?
 *
 * Each settled market carries an oracle question id, and behind it sits every
 * price source consulted, what each returned, the median across them, and how
 * many had to agree. Nothing else shows this — so a losing trade is normally
 * something you take on faith. Here it is a receipt you can open.
 */
export function SettlementReceiptPanel() {
  const { receipts } = useSettlementReceipts();

  return (
    <PanelShell
      title="Settlement receipts"
      description="Why each market resolved the way it did — every source the oracle asked."
      className="panel-grid-wide"
    >
      <div className="flex flex-col gap-4">
        {receipts.map((receipt, index) => {
          const respondedSources = receipt.sources.filter(
            (source) => source.includedInMedian
          );

          return (
            <div key={receipt.marketId}>
              {index > 0 ? <Separator className="mb-4" /> : null}

              <div className="panel-metric-row mb-2">
                <span className="text-sm">
                  <span className="font-medium">
                    {receipt.asset} {receipt.windowLength}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    opened {receipt.openingPrice.toLocaleString()} · closed{" "}
                    {receipt.settlementPrice.toLocaleString()}
                  </span>
                </span>

                <span className="flex items-center gap-2">
                  <Badge
                    variant={receipt.outcome === "voided" ? "destructive" : "secondary"}
                    className={receipt.outcome === "up" ? "side-up" : "side-down"}
                  >
                    {receipt.outcome.toUpperCase()}
                  </Badge>
                  <a
                    className="text-xs inline-flex items-center gap-1 underline underline-offset-2"
                    href={buildOracleExplorerUrl(receipt.oracleQuestionId)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    question {receipt.oracleQuestionId}
                    <ExternalLink className="size-3" />
                  </a>
                </span>
              </div>

              <div className="receipt-sources">
                {receipt.sources.map((source) => (
                  <div className="receipt-source" key={source.name}>
                    <span
                      className={
                        source.includedInMedian ? "" : "text-muted-foreground line-through"
                      }
                    >
                      {source.name}
                    </span>
                    <span className="tabular-nums">
                      {source.includedInMedian
                        ? source.reportedPrice.toLocaleString()
                        : "no answer"}
                    </span>
                  </div>
                ))}
              </div>

              <p className="panel-note mt-2">
                median {receipt.medianPrice.toLocaleString()} from{" "}
                {respondedSources.length} of {receipt.sources.length} sources ·{" "}
                {receipt.sourcesRequired} needed to agree
              </p>
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}
