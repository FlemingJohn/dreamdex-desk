import type { SettlementReceipt } from "@/types/analytics";

/**
 * The most recent settlements, with the oracle's working shown.
 *
 * Every market carries an oracleQuestionId that links to a public page listing
 * each price source, what it returned, the median across them, and how many had
 * to agree. That is the answer to the oldest complaint in betting — "why did I
 * lose?" — and no other interface surfaces it.
 */
export function getMockSettlementReceipts(): SettlementReceipt[] {
  return [
    {
      marketId: "0x8470",
      asset: "BTC",
      windowLength: "15m",
      oracleQuestionId: "418822",
      openingPrice: 114712,
      settlementPrice: 114801,
      medianPrice: 114801,
      sourcesRequired: 3,
      sources: [
        { name: "Binance", reportedPrice: 114803, respondedAt: "14:30:02", includedInMedian: true },
        { name: "Coinbase", reportedPrice: 114799, respondedAt: "14:30:02", includedInMedian: true },
        { name: "Kraken", reportedPrice: 114801, respondedAt: "14:30:03", includedInMedian: true },
        { name: "OKX", reportedPrice: 114804, respondedAt: "14:30:03", includedInMedian: true },
        { name: "Bybit", reportedPrice: 114798, respondedAt: "14:30:04", includedInMedian: true },
      ],
      outcome: "up",
      settledAt: "2026-08-23T14:30:04Z",
    },
    {
      marketId: "0x8466",
      asset: "ETH",
      windowLength: "15m",
      oracleQuestionId: "418819",
      openingPrice: 4188,
      settlementPrice: 4181,
      medianPrice: 4181,
      sourcesRequired: 3,
      sources: [
        { name: "Binance", reportedPrice: 4181, respondedAt: "14:15:02", includedInMedian: true },
        { name: "Coinbase", reportedPrice: 4180, respondedAt: "14:15:02", includedInMedian: true },
        { name: "Kraken", reportedPrice: 4182, respondedAt: "14:15:03", includedInMedian: true },
        { name: "OKX", reportedPrice: 4181, respondedAt: "14:15:03", includedInMedian: true },
        { name: "Bybit", reportedPrice: 0, respondedAt: "—", includedInMedian: false },
      ],
      outcome: "down",
      settledAt: "2026-08-23T14:15:03Z",
    },
  ];
}

/** Where the public working for a settlement lives. */
export function buildOracleExplorerUrl(oracleQuestionId: string): string {
  return `https://prd.oracle.somnia.host/questions/${oracleQuestionId}?view=graph`;
}
