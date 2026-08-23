import type { LiveMarket } from "@/types/market";

/**
 * Stand-in for the live market list until the app reads the chain directly.
 *
 * Windows roll continuously, so the countdown is derived from the clock rather
 * than stored. That keeps the dashboard feeling live while running on mocks.
 */

const FIFTEEN_MINUTES_IN_SECONDS = 15 * 60;
const ONE_HOUR_IN_SECONDS = 60 * 60;

function secondsLeftInWindow(windowLengthInSeconds: number): number {
  const secondsNow = Math.floor(Date.now() / 1000);
  return windowLengthInSeconds - (secondsNow % windowLengthInSeconds);
}

export function getMockMarkets(): LiveMarket[] {
  return [
    {
      marketId: "0x8471",
      asset: "BTC",
      windowLength: "15m",
      openingPrice: 114800,
      currentPrice: 114952,
      upProbability: 0.61,
      spread: 0.02,
      depthAtTouch: 1420,
      volumeUsdc: 8240,
      tradeCount: 186,
      secondsRemaining: secondsLeftInWindow(FIFTEEN_MINUTES_IN_SECONDS),
      status: "trading",
    },
    {
      marketId: "0x8468",
      asset: "BTC",
      windowLength: "1h",
      openingPrice: 114610,
      currentPrice: 114952,
      upProbability: 0.55,
      spread: 0.04,
      depthAtTouch: 3110,
      volumeUsdc: 22410,
      tradeCount: 402,
      secondsRemaining: secondsLeftInWindow(ONE_HOUR_IN_SECONDS),
      status: "trading",
    },
    {
      marketId: "0x8472",
      asset: "ETH",
      windowLength: "15m",
      openingPrice: 4182,
      currentPrice: 4176,
      upProbability: 0.48,
      spread: 0.03,
      depthAtTouch: 940,
      volumeUsdc: 4120,
      tradeCount: 97,
      secondsRemaining: secondsLeftInWindow(FIFTEEN_MINUTES_IN_SECONDS),
      status: "trading",
    },
    {
      marketId: "0x8469",
      asset: "ETH",
      windowLength: "1h",
      openingPrice: 4165,
      currentPrice: 4176,
      upProbability: 0.52,
      spread: 0.05,
      depthAtTouch: 2240,
      volumeUsdc: 11830,
      tradeCount: 233,
      secondsRemaining: secondsLeftInWindow(ONE_HOUR_IN_SECONDS),
      status: "trading",
    },
    {
      marketId: "0x8470",
      asset: "BTC",
      windowLength: "15m",
      openingPrice: 114712,
      currentPrice: 114800,
      upProbability: 0.58,
      spread: 0,
      depthAtTouch: 0,
      volumeUsdc: 6910,
      tradeCount: 154,
      secondsRemaining: 0,
      status: "locked",
    },
  ];
}
