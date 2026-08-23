/**
 * A DreamDEX event contract asks one question: does the asset close the window
 * at or above the price it opened at? There are no strike prices — the line is
 * always the window's own opening price.
 */

export type Asset = "BTC" | "ETH";

export type WindowLength = "15m" | "1h";

export type Side = "up" | "down";

/**
 * Only a market in "trading" accepts orders. "voided" means the oracle could
 * not agree on a price, so both sides are refunded at 0.5 instead of one side
 * paying 1.
 */
export type MarketStatus = "listed" | "trading" | "locked" | "resolved" | "voided";

export interface LiveMarket {
  marketId: string;
  asset: Asset;
  windowLength: WindowLength;
  /** The line to beat — the underlying price when this window opened. */
  openingPrice: number;
  /** Where the underlying is trading right now. */
  currentPrice: number;
  /** Market's implied chance of UP winning, between 0 and 1. */
  upProbability: number;
  /** Gap between the best bid and best ask, in probability terms. */
  spread: number;
  /** Contracts resting at the touch, both sides combined. */
  depthAtTouch: number;
  /** Collateral traded so far in this window. */
  volumeUsdc: number;
  tradeCount: number;
  secondsRemaining: number;
  status: MarketStatus;
}

/** One price level on the order book. Prices are probabilities. */
export interface OrderBookLevel {
  probability: number;
  contracts: number;
}

export interface OrderBook {
  marketId: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}
