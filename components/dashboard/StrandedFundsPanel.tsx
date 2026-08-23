"use client";

import { ExternalLink } from "lucide-react";
import { PanelShell } from "@/components/dashboard/PanelShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStrandedFunds } from "@/hooks/useStrandedFunds";
import { buildOracleExplorerUrl } from "@/lib/exchange/readSettlement";
import { formatUsdc } from "@/lib/format/formatUsdc";
import { formatWindow } from "@/lib/format/formatWindow";

function describeAge(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  return `${(minutes / 60).toFixed(1)}h ago`;
}

/**
 * Markets that finished without paying out, and payouts parked where nobody
 * looks.
 *
 * Settlement is normally automatic — the oracle answers and the market resolves
 * in the same flow, with no keeper involved. When that delivery is missed the
 * market just sits there holding collateral, and the protocol's answer is that
 * *anyone* may push it through. That is deliberate: it means funds can never be
 * stranded behind one party's permission.
 *
 * So the buttons here work on markets you have no stake in. Unblocking someone
 * else's market costs you gas and nothing else, and it is how the venue is
 * meant to be kept honest.
 */
export function StrandedFundsPanel() {
  const { stuckMarkets, busyId, unblockMarket } = useStrandedFunds();

  const lockedTotal = stuckMarkets.reduce((total, market) => total + market.lockedUsdc, 0);
  const hasNothingToDo = stuckMarkets.length === 0;

  return (
    <PanelShell
      id="stranded-funds"
      title="Stranded funds"
      description="Markets that finished without paying out, and payouts parked in a pool vault."
      headerExtra={
        hasNothingToDo ? (
          <Badge variant="secondary">all clear</Badge>
        ) : (
          <Badge variant="destructive">{formatUsdc(lockedTotal)} locked</Badge>
        )
      }
      askQuestion="Is any money stuck right now, and what unblocks it?"
    >
      {hasNothingToDo ? (
        <p className="panel-note">
          Nothing waiting. Every expired market on this venue has settled — which is
          what should happen, since resolution is delivered automatically.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {stuckMarkets.map((market) => (
            <div key={market.marketId}>
              <div className="panel-metric-row">
                <span className="text-sm">
                  <span className="font-medium">
                    {market.asset} {formatWindow(market.windowSeconds)}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    expired {describeAge(market.expiredAgoSeconds)} ·{" "}
                    {formatUsdc(market.lockedUsdc)} locked
                  </span>
                  {market.youHoldPosition ? (
                    <Badge variant="outline" className="ml-2">
                      you hold this
                    </Badge>
                  ) : null}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === market.marketId}
                  onClick={() => unblockMarket(market.marketId, market.remedy)}
                >
                  {market.remedy === "pokeOracle" ? "Pull the answer through" : "Void it"}
                </Button>
              </div>

              <p className="panel-note mt-1">
                {market.problem === "answered-not-resolved"
                  ? "The oracle answered but the market never caught up — anyone can pull it through."
                  : "The settlement window lapsed with no answer, so both sides refund at 0.5."}{" "}
                <a
                  className="inline-flex items-center gap-1 underline underline-offset-2"
                  href={buildOracleExplorerUrl(market.oracleQuestionId)}
                  target="_blank"
                  rel="noreferrer"
                >
                  question {market.oracleQuestionId}
                  <ExternalLink className="size-3" />
                </a>
              </p>
            </div>
          ))}

        </div>
      )}
    </PanelShell>
  );
}
