"use client";

import { PanelShell } from "@/components/dashboard/PanelShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProbabilityPath } from "@/hooks/useProbabilityPath";

/**
 * When is a position cheapest?
 *
 * This averages the winning side's probability across hundreds of settled
 * windows. The market commits to a view early, drifts back toward even odds in
 * the middle, then resolves hard at the end. That dip is the cheapest place to
 * take the side that eventually wins — which makes this a timing tool rather
 * than a direction one.
 */
export function ProbabilityPathPanel() {
  const { path, isLoading, cheapestEntryMinute } = useProbabilityPath();

  return (
    <PanelShell
      title="Probability path"
      description="How the winning side's price moves across a window, averaged over 412 of them."
      headerExtra={
        cheapestEntryMinute === null ? null : (
          <Badge variant="secondary">cheapest at {cheapestEntryMinute}m</Badge>
        )
      }
    >
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <div className="path-chart">
            {path.map((point) => (
              <div
                key={point.minutesFromOpen}
                className={`path-bar ${
                  point.minutesFromOpen === cheapestEntryMinute ? "path-bar-cheapest" : ""
                }`}
                style={{ height: `${point.averageProbability * 100}%` }}
                title={`minute ${point.minutesFromOpen} — ${point.averageProbability.toFixed(2)}`}
              />
            ))}
          </div>

          <div className="path-axis">
            <span>open</span>
            <span>mid-window</span>
            <span>expiry</span>
          </div>

          <p className="panel-note mt-3">
            The pull back toward even odds around minute {cheapestEntryMinute} is where
            the eventual winner is cheapest. Entering during the early drift means
            paying up for the same outcome.
          </p>
        </>
      )}
    </PanelShell>
  );
}
