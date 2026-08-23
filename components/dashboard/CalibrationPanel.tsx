"use client";

import { PanelShell } from "@/components/dashboard/PanelShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalibration } from "@/hooks/useCalibration";
import { isOverconfident } from "@/lib/mock/mockCalibration";
import { formatPercent, formatPointGap } from "@/lib/format/formatPercent";

/**
 * Does the market mean what it says?
 *
 * Each row groups settled windows by the probability the market quoted, then
 * reports how often that side actually won. The filled bar is what happened;
 * the vertical marker is what was predicted. When the bar falls short of the
 * marker, the market was overconfident — and buying the favourite in that band
 * loses money over time.
 */
export function CalibrationPanel() {
  const { buckets, isLoading, windowsMeasured } = useCalibration();

  return (
    <PanelShell
      title="Calibration"
      description="When the market says 65%, does it happen 65% of the time?"
      headerExtra={
        <Badge variant="secondary">{windowsMeasured} windows</Badge>
      }
    >
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          <div>
            {buckets.map((bucket) => {
              const overconfident = isOverconfident(bucket);

              return (
                <div className="calibration-row" key={bucket.rangeStart}>
                  <span className="calibration-band">
                    {bucket.rangeStart.toFixed(2)}–{bucket.rangeEnd.toFixed(2)}
                  </span>

                  <div className="calibration-track">
                    <div
                      className="calibration-actual"
                      style={{ width: `${bucket.actualFrequency * 100}%` }}
                    />
                    <div
                      className="calibration-predicted"
                      style={{ left: `${bucket.predictedProbability * 100}%` }}
                    />
                  </div>

                  <span
                    className={`calibration-gap ${
                      overconfident ? "calibration-gap-negative" : ""
                    }`}
                  >
                    {formatPointGap(bucket.predictedProbability, bucket.actualFrequency)}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="panel-note mt-3">
            Bar is what happened, line is what was priced. Bands above 0.60 come in
            roughly {formatPercent(0.1, 0)} short — the favourite is being overpriced
            there, so selling it is where the edge sits.
          </p>
        </>
      )}
    </PanelShell>
  );
}
