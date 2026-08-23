/**
 * Orders you have resting on the book, and the two kinds of money that get
 * stranded on this venue.
 */

import type { Asset, Side, WindowSeconds } from "./market";

/**
 * An order sitting on the book waiting to fill.
 *
 * Every order carries a mandatory expiry, which doubles as a dead man's switch
 * — if a bot dies its orders age off the book on their own rather than resting
 * with collateral locked forever.
 */
export interface WorkingOrder {
  orderId: string;
  marketId: string;
  /** The pool this order rests on, needed to cancel or shrink it. */
  poolAddress: string;
  asset: Asset;
  windowSeconds: WindowSeconds;
  side: Side;
  /** Price this order is resting at, as a probability. */
  probability: number;
  contracts: number;
  contractsFilled: number;
  /** Collateral locked by the pool until this fills or is cancelled. */
  escrowedUsdc: number;
  /** How far the market has moved away from this order. */
  distanceFromTouch: number;
  expiresInSeconds: number;
}

/**
 * A market that settled but has not paid out yet.
 *
 * Resolution is normally automatic — the oracle posts an answer and Somnia's
 * reactivity delivers it straight to the market. When that callback is missed
 * the market sits there, and anyone at all can push it through. These are the
 * permissionless backstops that stop funds being stranded on a missed message.
 */
export interface StuckMarket {
  marketId: string;
  asset: Asset;
  windowSeconds: WindowSeconds;
  oracleQuestionId: string;
  /** "answered" means the oracle replied and the market has not caught up. */
  problem: "answered-not-resolved" | "settlement-window-lapsed";
  /** What anyone can call to unblock it. */
  remedy: "pokeOracle" | "voidExpired";
  expiredAgoSeconds: number;
  /** Collateral sitting in the market until it resolves. */
  lockedUsdc: number;
  /** Whether you personally hold a position in it. */
  youHoldPosition: boolean;
}

/**
 * Money parked in a pool's vault because paying it to your wallet failed.
 *
 * Payouts normally land straight in your wallet. If that delivery reverts the
 * pool falls back to crediting the vault instead — which reads zero in normal
 * operation, so nobody ever thinks to look there. This is a second class of
 * stranded money, separate from unclaimed winnings.
 */
export interface VaultFallback {
  poolAddress: string;
  asset: Asset;
  windowSeconds: WindowSeconds;
  amountUsdc: number;
  strandedAt: string;
}
