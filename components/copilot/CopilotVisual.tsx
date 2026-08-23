"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCopilot } from "@/components/copilot/CopilotProvider";
import { formatCountdown } from "@/lib/format/formatCountdown";
import { formatPointGap } from "@/lib/format/formatPercent";
import { formatProbability } from "@/lib/format/formatProbability";
import { formatSignedUsdc, formatUsdc } from "@/lib/format/formatUsdc";
import { formatWindow } from "@/lib/format/formatWindow";
import type { CopilotVisual as Visual } from "@/types/copilot";

/**
 * Draws the answer instead of describing it.
 *
 * A calibration curve read aloud is a paragraph of numbers; drawn, it is one
 * glance. Everything here renders the exact data the tool returned, so what is
 * shown cannot drift from what the copilot reasoned over.
 *
 * These are deliberately smaller and quieter than the dashboard panels — they
 * answer one question inside a conversation rather than standing alone.
 */
export function CopilotVisual({ visual }: { visual: Visual }) {
  switch (visual.kind) {
    case "calibration":
      return <CalibrationVisual buckets={visual.buckets} />;
    case "markets":
      return <MarketsVisual markets={visual.markets} />;
    case "edge":
      return <EdgeVisual opportunities={visual.opportunities} />;
    case "book":
      return <BookVisual visual={visual} />;
    case "path":
      return <PathVisual points={visual.points} />;
    case "receipts":
      return <ReceiptsVisual receipts={visual.receipts} />;
    default:
      return null;
  }
}

/** Narrows the union to one variant's payload, so each renderer stays typed. */
type VisualOf<K extends Visual["kind"]> = Extract<Visual, { kind: K }>;

function CalibrationVisual({ buckets }: { buckets: VisualOf<"calibration">["buckets"] }) {
  if (buckets.length === 0) {
    return null;
  }

  return (
    <div className="visual-card">
      <div className="visual-title">Calibration · predicted against actual</div>
      {buckets.map((bucket) => {
        const gap = bucket.actualFrequency - bucket.predictedProbability;
        const isOff = Math.abs(gap) > 0.02;

        return (
          <div className="visual-bar-row" key={bucket.rangeStart}>
            <span className="visual-label">
              {bucket.rangeStart.toFixed(2)}–{bucket.rangeEnd.toFixed(2)}
            </span>
            <span className="visual-track">
              <span
                className="visual-fill"
                style={{ width: `${bucket.actualFrequency * 100}%` }}
              />
              <span
                className="visual-marker"
                style={{ left: `${bucket.predictedProbability * 100}%` }}
              />
            </span>
            <span className={`visual-value ${isOff ? "value-negative" : ""}`}>
              {formatPointGap(bucket.predictedProbability, bucket.actualFrequency)}
            </span>
            <span className="visual-note">n={bucket.windowCount}</span>
          </div>
        );
      })}
      <p className="visual-footnote">
        Bar is what happened, line is what was priced.
      </p>
    </div>
  );
}

function MarketsVisual({
  markets,
}: {
  markets: VisualOf<"markets">["markets"];
}) {
  if (markets.length === 0) {
    return null;
  }

  return (
    <div className="visual-card">
      <div className="visual-title">Open windows</div>
      {markets.slice(0, 6).map((market) => (
        <div className="visual-row" key={market.marketId}>
          <span className="visual-label">
            {market.asset} {formatWindow(market.windowSeconds)}
          </span>
          <span className="visual-value side-up">
            {formatProbability(market.upProbability)}
          </span>
          <span className="visual-note">
            spread {formatProbability(market.spread)}
          </span>
          <span className="visual-note">{formatCountdown(market.secondsRemaining)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The one visual that acts. An edge is only useful if taking it is one click
 * away, so each row that clears the bar carries its own button — which goes
 * through the same proposal and approval as anything else.
 */
function EdgeVisual({
  opportunities,
}: {
  opportunities: VisualOf<"edge">["opportunities"];
}) {
  const { proposeTrade } = useCopilot();
  const worthTaking = opportunities.filter(
    (entry) => entry.verdict === "buy" && (entry.recommendedStake?.contracts ?? 0) > 0
  );

  if (opportunities.length === 0) {
    return null;
  }

  return (
    <div className="visual-card">
      <div className="visual-title">
        Edge · {worthTaking.length} of {opportunities.length} worth taking
      </div>
      {opportunities.slice(0, 6).map((entry) => {
        const stake = entry.recommendedStake;
        const isGood = entry.verdict === "buy" && (stake?.contracts ?? 0) > 0;
        const isThin = entry.verdict === "thin-sample";

        return (
          <div className="visual-row" key={entry.marketId}>
            <span className="visual-label">
              {entry.asset} {formatWindow(entry.windowSeconds)}
            </span>

            {entry.bestSide ? (
              <span className={entry.bestSide === "up" ? "side-up" : "side-down"}>
                {entry.bestSide.toUpperCase()}
              </span>
            ) : (
              <span className="visual-note">{entry.note}</span>
            )}

            {entry.expectedValuePerContract !== undefined ? (
              <span
                className={`visual-value ${
                  entry.expectedValuePerContract >= 0 ? "value-positive" : "value-negative"
                }`}
              >
                {formatSignedUsdc(entry.expectedValuePerContract)}
              </span>
            ) : null}

            {isThin ? <Badge variant="outline">n={entry.sampleSize}</Badge> : null}

            {isGood && stake && entry.bestSide ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  proposeTrade(
                    entry.marketId,
                    entry.bestSide!,
                    stake.contracts,
                    `${stake.contracts} ${entry.bestSide!.toUpperCase()} on ${entry.asset} ${formatWindow(entry.windowSeconds)} — priced ${formatProbability(entry.pricePaid ?? 0)}, worth ${formatProbability(entry.trueProbability ?? 0)} over ${entry.sampleSize} settled windows.`
                  )
                }
              >
                Take {stake.contracts} · {formatUsdc(stake.costUsdc)}
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function BookVisual({ visual }: { visual: VisualOf<"book"> }) {
  const levels = [...visual.bids, ...visual.asks];
  if (levels.length === 0) {
    return null;
  }
  const deepest = Math.max(...levels.map((level) => level.contracts), 1);

  return (
    <div className="visual-card">
      <div className="visual-title">
        {visual.asset} {formatWindow(visual.windowSeconds)} · resting book
      </div>
      {[...visual.asks].reverse().map((level) => (
        <div className="visual-book-row" key={`ask-${level.probability}`}>
          <span
            className="visual-book-depth visual-book-ask"
            style={{ width: `${(level.contracts / deepest) * 100}%` }}
          />
          <span className="visual-book-price side-down">
            {formatProbability(level.probability)}
          </span>
          <span className="visual-book-size">{level.contracts.toFixed(0)}</span>
        </div>
      ))}
      {visual.bids.map((level) => (
        <div className="visual-book-row" key={`bid-${level.probability}`}>
          <span
            className="visual-book-depth visual-book-bid"
            style={{ width: `${(level.contracts / deepest) * 100}%` }}
          />
          <span className="visual-book-price side-up">
            {formatProbability(level.probability)}
          </span>
          <span className="visual-book-size">{level.contracts.toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}

function PathVisual({
  points,
}: {
  points: VisualOf<"path">["points"];
}) {
  if (points.length === 0) {
    return null;
  }

  return (
    <div className="visual-card">
      <div className="visual-title">Where the winner is cheapest</div>
      <div className="visual-path">
        {points.map((point) => (
          <span
            key={point.minutesFromOpen}
            className="visual-path-bar"
            style={{ height: `${point.averageProbability * 100}%` }}
            title={`minute ${point.minutesFromOpen} · ${point.averageProbability.toFixed(2)}`}
          />
        ))}
      </div>
      <p className="visual-footnote">Window open on the left, expiry on the right.</p>
    </div>
  );
}

function ReceiptsVisual({
  receipts,
}: {
  receipts: VisualOf<"receipts">["receipts"];
}) {
  if (receipts.length === 0) {
    return null;
  }

  return (
    <div className="visual-card">
      <div className="visual-title">How they settled</div>
      {receipts.slice(0, 6).map((receipt) => (
        <div className="visual-row" key={receipt.marketId}>
          <span className="visual-label">
            {receipt.asset} {formatWindow(receipt.windowSeconds)}
          </span>
          <span className="visual-value">
            {formatProbability(receipt.finalProbability)}
          </span>
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
          {receipt.explorerUrl ? (
            <a
              className="visual-link"
              href={receipt.explorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              sources
              <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}
