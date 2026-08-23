"use client";

import { useMemo } from "react";
import { useCopilot } from "@/components/copilot/CopilotProvider";
import { PanelShell } from "@/components/dashboard/PanelShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCalibration } from "@/hooks/useCalibration";
import { useLiveMarkets } from "@/hooks/useLiveMarkets";
import { computeBothSides } from "@/lib/analytics/computeExpectedValue";
import { computePositionSize } from "@/lib/analytics/computePositionSize";
import { formatPercent } from "@/lib/format/formatPercent";
import { formatWindow } from "@/lib/format/formatWindow";
import { formatProbability } from "@/lib/format/formatProbability";
import { formatSignedUsdc, formatUsdc } from "@/lib/format/formatUsdc";

/** Stand-in until the app reads a real balance. */
const BANKROLL_USDC = 500;

/**
 * What every open market is actually worth, and what to stake.
 *
 * This is where the calibration curve stops being a chart and becomes a
 * decision. A binary contract pays 1 or 0, so the arithmetic is clean: buying
 * at a price when history says the real chance is higher earns the difference,
 * on average. Every open market is checked against the curve, and anything with
 * an edge is sized with a quarter-Kelly stake capped at 5% of the bankroll.
 */
export function EdgePanel() {
  const { buckets } = useCalibration();
  const { tradingMarkets } = useLiveMarkets();
  const { proposeTrade } = useCopilot();

  /**
   * Only the better side of each market is worth showing. Up and Down sum to
   * one, so if one side is overpriced the other is the trade.
   */
  const opportunities = useMemo(() => {
    return tradingMarkets
      .map((market) => {
        const sides = computeBothSides(buckets, market.upProbability);
        const best =
          (sides.up?.expectedValuePerContract ?? -1) >
          (sides.down?.expectedValuePerContract ?? -1)
            ? { side: "up" as const, assessment: sides.up }
            : { side: "down" as const, assessment: sides.down };

        if (!best.assessment) {
          return null;
        }

        const size = computePositionSize(
          best.assessment.pricePaid,
          best.assessment.trueProbability,
          BANKROLL_USDC
        );

        return { market, side: best.side, assessment: best.assessment, size };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort(
        (a, b) =>
          b.assessment.expectedValuePerContract - a.assessment.expectedValuePerContract
      );
  }, [buckets, tradingMarkets]);

  const worthTaking = opportunities.filter(
    (entry) => entry.assessment.verdict === "buy" && entry.size.contracts > 0
  );

  return (
    <PanelShell
      id="edge"
      title="Where the edge is"
      description="Every open market priced against the calibration curve, with a stake to match."
      headerExtra={
        <Badge variant={worthTaking.length > 0 ? "default" : "secondary"}>
          {worthTaking.length} worth taking
        </Badge>
      }
      askQuestion="Which open market has the best expected value right now, and how much should I stake?"
    >
      <div className="flex flex-col gap-3">
        {opportunities.map((entry, index) => {
          const { market, side, assessment, size } = entry;
          const isGood = assessment.verdict === "buy" && size.contracts > 0;
          const isThin = assessment.verdict === "thin-sample";

          return (
            <div key={market.marketId}>
              {index > 0 ? <Separator className="mb-3" /> : null}

              <div className="panel-metric-row">
                <span className="text-sm">
                  <span className="font-medium">
                    {market.asset} {formatWindow(market.windowSeconds)}
                  </span>{" "}
                  <span className={side === "up" ? "side-up" : "side-down"}>
                    {side.toUpperCase()}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    costs {formatProbability(assessment.pricePaid)} · worth{" "}
                    {formatProbability(assessment.trueProbability)}
                  </span>
                </span>

                <span
                  className={`panel-metric-value text-sm ${
                    assessment.expectedValuePerContract >= 0
                      ? "value-positive"
                      : "value-negative"
                  }`}
                >
                  {formatSignedUsdc(assessment.expectedValuePerContract)} / contract
                </span>
              </div>

              <div className="panel-metric-row mt-1">
                <span className="panel-note">
                  {isThin
                    ? `Only ${assessment.sampleSize} settled windows in this band — too few to trust.`
                    : isGood
                      ? `${size.reasoning} ${formatPercent(size.bankrollShare, 1)} of the bankroll.`
                      : "Priced at or above what the side is worth."}
                </span>

                {isGood ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      proposeTrade(
                        market.marketId,
                        side,
                        size.contracts,
                        `${size.contracts} ${side.toUpperCase()} on ${market.asset} ${formatWindow(market.windowSeconds)}. Costs ${formatProbability(assessment.pricePaid)}, worth ${formatProbability(assessment.trueProbability)} over ${assessment.sampleSize} settled windows — an edge of ${formatSignedUsdc(assessment.expectedValuePerContract)} per contract.`
                      )
                    }
                  >
                    Take {size.contracts} · {formatUsdc(size.costUsdc)}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}

        {opportunities.length === 0 ? (
          <p className="panel-note">
            No open market falls inside a measured calibration band.
          </p>
        ) : null}
      </div>
    </PanelShell>
  );
}
