"use client";

import { PanelShell } from "@/components/dashboard/PanelShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useClaimWinnings } from "@/hooks/useClaimWinnings";
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatCountdown } from "@/lib/format/formatCountdown";
import { formatPercent } from "@/lib/format/formatPercent";
import { formatProbability } from "@/lib/format/formatProbability";
import { formatSignedUsdc, formatUsdc } from "@/lib/format/formatUsdc";

/**
 * What the trader holds, and what they are owed.
 *
 * The unclaimed total is the part that matters. A winning position pays only
 * when someone redeems it, and settled markets drop out of the ordinary market
 * list — so this money is invisible everywhere else and simply sits there.
 */
export function PortfolioPanel() {
  const { portfolio, isLoading, unclaimedTotal } = usePortfolio();
  const { claimAll, isClaiming, result } = useClaimWinnings();

  return (
    <PanelShell
      id="portfolio"
      title="Your book"
      description="Open positions, realised performance, and winnings the protocol still owes you."
      className="panel-grid-wide"
      askQuestion="Walk me through my open positions and anything I have not claimed."
    >
      {isLoading || !portfolio ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {portfolio.openPositions.map((position) => (
              <div className="panel-metric-row" key={position.marketId}>
                <span className="text-sm">
                  <span className="font-medium">
                    {position.asset} {position.windowLength}
                  </span>{" "}
                  <span className={position.side === "up" ? "side-up" : "side-down"}>
                    {position.side.toUpperCase()}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {position.contracts} at {formatProbability(position.entryProbability)} · now{" "}
                    {formatProbability(position.currentProbability)} ·{" "}
                    {formatCountdown(position.secondsRemaining)} left
                  </span>
                </span>
                <span
                  className={`panel-metric-value text-sm ${
                    position.unrealizedUsdc >= 0 ? "value-positive" : "value-negative"
                  }`}
                >
                  {formatSignedUsdc(position.unrealizedUsdc)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="panel-metric-row">
            <span className="panel-note">
              Realised over 7 days · {portfolio.fillCountLastWeek} fills · win rate{" "}
              {formatPercent(portfolio.winRateLastWeek)}
            </span>
            <span className="panel-metric-value text-sm value-positive">
              {formatSignedUsdc(portfolio.realizedUsdcLastWeek)}
            </span>
          </div>

          <Separator />

          <div className="panel-metric-row">
            <span className="flex items-center gap-2 text-sm">
              <Badge variant="destructive">unclaimed</Badge>
              <span className="font-medium">{formatUsdc(unclaimedTotal)}</span>
              <span className="panel-note">
                across {portfolio.unclaimedWinnings.length} settled markets
              </span>
            </span>
            <Button size="sm" onClick={claimAll} disabled={isClaiming || !!result}>
              {isClaiming ? "Claiming..." : result ? "Claimed" : "Claim all"}
            </Button>
          </div>

          {result ? (
            <p className="panel-note">
              Swept {result.marketsSwept} settled markets for{" "}
              {formatUsdc(result.claimedUsdc)} · {result.transactionHash}
            </p>
          ) : null}
        </div>
      )}
    </PanelShell>
  );
}
