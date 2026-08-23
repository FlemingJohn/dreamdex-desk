"use client";

import { PanelShell } from "@/components/dashboard/PanelShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalibration } from "@/hooks/useCalibration";
import { useCopilot } from "@/components/copilot/CopilotProvider";
import { useLiveMarkets } from "@/hooks/useLiveMarkets";
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
  const { proposeTrade } = useCopilot();
  const { tradingMarkets } = useLiveMarkets();

  /**
   * An overconfident band means the favourite is overpriced, so the edge is in
   * selling it — which here means buying the other side of whichever open
   * market currently sits in that band.
   */
  function tradeThisEdge(rangeStart: number, rangeEnd: number) {
    const marketInBand = tradingMarkets.find(
      (market) => market.upProbability >= rangeStart && market.upProbability < rangeEnd
    );
    if (!marketInBand) {
      return;
    }
    proposeTrade(
      marketInBand.marketId,
      "down",
      10,
      `Fading the favourite in the ${rangeStart.toFixed(2)}–${rangeEnd.toFixed(2)} band, where settled windows came in short of the price.`
    );
  }

  return (
    <PanelShell
      id="calibration"
      title="Calibration"
      description="When the market says 65%, does it happen 65% of the time?"
      headerExtra={<Badge variant="secondary">{windowsMeasured} windows</Badge>}
      askQuestion="Where is the market least calibrated, and how would I trade that?"
    >
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          <div>
            {buckets.map((bucket) => {
              const overconfident = isOverconfident(bucket);
              const hasMarketInBand = tradingMarkets.some(
                (market) =>
                  market.upProbability >= bucket.rangeStart &&
                  market.upProbability < bucket.rangeEnd
              );
              const isTradeable = overconfident && hasMarketInBand;

              return (
                <div
                  className={`calibration-row ${isTradeable ? "calibration-row-tradeable" : ""}`}
                  key={bucket.rangeStart}
                  onClick={
                    isTradeable
                      ? () => tradeThisEdge(bucket.rangeStart, bucket.rangeEnd)
                      : undefined
                  }
                  title={isTradeable ? "Trade this edge" : undefined}
                >
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
