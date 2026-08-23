import type { SettlementQualityRow } from "@/types/analytics";

/**
 * How reliably each series settles, read from the oracle's published question
 * data. A void means the oracle could not agree on a price, so both sides are
 * refunded at 0.5 rather than one side paying 1.
 *
 * That refund is asymmetric: it rescues you if you bought a side cheaply and
 * costs you if you paid up for the favourite. A 1.2% void rate is small but
 * worth pricing in.
 */
export function getMockSettlementQuality(): SettlementQualityRow[] {
  return [
    {
      asset: "BTC",
      windowSeconds: 900,
      settledCount: 412,
      voidRate: 0.005,
      averageSourcesAgreeing: 4.9,
      totalSources: 5,
      medianLatencySeconds: 2.1,
    },
    {
      asset: "BTC",
      windowSeconds: 3600,
      settledCount: 104,
      voidRate: 0,
      averageSourcesAgreeing: 5,
      totalSources: 5,
      medianLatencySeconds: 1.8,
    },
    {
      asset: "ETH",
      windowSeconds: 900,
      settledCount: 412,
      voidRate: 0.012,
      averageSourcesAgreeing: 4.6,
      totalSources: 5,
      medianLatencySeconds: 2.4,
    },
    {
      asset: "ETH",
      windowSeconds: 3600,
      settledCount: 104,
      voidRate: 0,
      averageSourcesAgreeing: 4.9,
      totalSources: 5,
      medianLatencySeconds: 2,
    },
  ];
}
