"use client";

import { PanelShell } from "@/components/dashboard/PanelShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiquidity } from "@/hooks/useLiquidity";
import { formatPercent } from "@/lib/format/formatPercent";
import { formatProbability } from "@/lib/format/formatProbability";

/**
 * Is the volume real trading, or just disagreement?
 *
 * Mint-a-pair counts fills where two buyers on opposite sides crossed with no
 * seller at all — the pool created both positions out of their combined
 * collateral. It exists on no other venue. A high share means there are very
 * few genuine sellers, so resting an offer will mostly sit unfilled and taking
 * the other side of a buyer is the reliable way in.
 */
export function LiquidityPanel() {
  const { breakdowns, isLoading } = useLiquidity();

  return (
    <PanelShell
      id="liquidity"
      title="Liquidity"
      description="How trades actually crossed — two buyers meeting, or a real seller."
      askQuestion="Can I actually get filled on these markets, and should I rest or take?"
    >
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="flex flex-col gap-4">
          {breakdowns.map((breakdown) => (
            <div key={`${breakdown.asset}-${breakdown.windowLength}`}>
              <div className="panel-metric-row mb-1.5">
                <span className="text-sm font-medium">
                  {breakdown.asset} {breakdown.windowLength}
                </span>
                <span className="panel-metric-value text-sm">
                  {formatPercent(breakdown.mintPairShare)} mint-a-pair
                </span>
              </div>

              <div className="liquidity-bar">
                <div
                  className="liquidity-segment-mint"
                  style={{ width: `${breakdown.mintPairShare * 100}%` }}
                />
                <div
                  className="liquidity-segment-direct"
                  style={{ width: `${breakdown.directFillShare * 100}%` }}
                />
                <div
                  className="liquidity-segment-burn"
                  style={{ width: `${breakdown.burnPairShare * 100}%` }}
                />
              </div>

              <p className="panel-note mt-1.5">
                median spread {formatProbability(breakdown.medianSpread)} · depth{" "}
                {breakdown.medianDepthAtTouch.toLocaleString()} · liquidity arrives
                around minute {breakdown.liquidityArrivesAtMinute}
              </p>
            </div>
          ))}

          <div className="liquidity-legend">
            <span>
              <span
                className="liquidity-legend-dot"
                style={{ background: "var(--side-up)" }}
              />
              mint-a-pair
            </span>
            <span>
              <span
                className="liquidity-legend-dot"
                style={{ background: "var(--side-down)" }}
              />
              direct fill
            </span>
            <span>
              <span
                className="liquidity-legend-dot"
                style={{ background: "var(--muted-foreground)" }}
              />
              burn-a-pair
            </span>
          </div>
        </div>
      )}
    </PanelShell>
  );
}
