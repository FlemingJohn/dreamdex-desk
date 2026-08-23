/**
 * A DreamDEX event contract asks one question: will the asset be at or above a
 * line when the window closes?
 *
 * What that line is depends on the venue. dreamDEX's own venue compares against
 * the window's opening price and carries no strike. The venues live on Shannon
 * do set an explicit strike, which the market row reports — so a strike is
 * optional here rather than absent.
 */

export type Asset = string;

/**
 * How long a window runs, in seconds.
 *
 * Live venues run 60, 300, 900, 3600, 14400 and 86400 — a minute through to a
 * day — so this is a number rather than a fixed set of labels.
 */
export type WindowSeconds = number;

export type Side = "up" | "down";

/**
 * Only a market in "trading" accepts orders. "voided" means the oracle could
 * not agree on a price, so both sides are refunded at 0.5 instead of one side
 * paying 1.
 */
export type MarketStatus = "listed" | "trading" | "locked" | "resolved" | "voided";

export interface LiveMarket {
  marketId: string;
  /** The pool this market currently trades on. Recycled between windows. */
  poolAddress: string;
  /** Which venue listed it — a deployment hosts several side by side. */
  venueId: string;
  asset: Asset;
  windowSeconds: WindowSeconds;
  /** The price the close is measured against, when the venue sets one. */
  strike: number | null;
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
  /** Links a settlement to the sources that decided it. */
  oracleQuestionId: string | null;
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

/** Whether the figures on screen came from the chain or from stand-in data. */
export type DataSource = "live" | "mock";
