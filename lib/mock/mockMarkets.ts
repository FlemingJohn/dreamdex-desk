import type { LiveMarket } from "@/types/market";

/**
 * Stand-in markets, used when the chain cannot be reached.
 *
 * Shaped like the real rows the indexer returns — including a strike, since the
 * venues live on Shannon set one — so nothing downstream has to care which
 * source it is looking at.
 *
 * The countdown is derived from the clock passed in rather than read here, so
 * the same input always gives the same output and the server and browser agree.
 */

function secondsLeftInWindow(windowSeconds: number, secondsNow: number): number {
  return windowSeconds - (secondsNow % windowSeconds);
}

export function getMockMarkets(secondsNow: number): LiveMarket[] {
  return [
    {
      marketId: "0x76e4",
      poolAddress: "0x5df066ab7cd4bb86fa6516b2512199cd89b92cdf",
      venueId: "0xmock",
      asset: "BTC",
      windowSeconds: 900,
      strike: 114800,
      upProbability: 0.61,
      spread: 0.02,
      depthAtTouch: 1420,
      volumeUsdc: 8240,
      tradeCount: 186,
      secondsRemaining: secondsLeftInWindow(900, secondsNow),
      status: "trading",
      oracleQuestionId: "418822",
    },
    {
      marketId: "0x76e1",
      poolAddress: "0x6a2ce98f392eda26c68e9762fc3632dd32d034b7",
      venueId: "0xmock",
      asset: "BTC",
      windowSeconds: 3600,
      strike: 114610,
      upProbability: 0.55,
      spread: 0.04,
      depthAtTouch: 3110,
      volumeUsdc: 22410,
      tradeCount: 402,
      secondsRemaining: secondsLeftInWindow(3600, secondsNow),
      status: "trading",
      oracleQuestionId: "418818",
    },
    {
      marketId: "0x76e5",
      poolAddress: "0x7c4e1a9b8d3f5027ac6e2b41f890cd35ea7b6142",
      venueId: "0xmock",
      asset: "ETH",
      windowSeconds: 900,
      strike: 4182,
      upProbability: 0.48,
      spread: 0.03,
      depthAtTouch: 940,
      volumeUsdc: 4120,
      tradeCount: 97,
      secondsRemaining: secondsLeftInWindow(900, secondsNow),
      status: "trading",
      oracleQuestionId: "418823",
    },
    {
      marketId: "0x76e2",
      poolAddress: "0x3f18cd02ab7145e9d6c8f230b95a4e17cc80d3f6",
      venueId: "0xmock",
      asset: "ETH",
      windowSeconds: 3600,
      strike: 4165,
      upProbability: 0.52,
      spread: 0.05,
      depthAtTouch: 2240,
      volumeUsdc: 11830,
      tradeCount: 233,
      secondsRemaining: secondsLeftInWindow(3600, secondsNow),
      status: "trading",
      oracleQuestionId: "418819",
    },
  ];
}
