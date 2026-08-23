"use client";

import { useCallback, useState } from "react";
import { useExchange } from "@/lib/wallet/useExchange";
import type { TradeProposal } from "@/types/copilot";

export interface WriteOutcome {
  ok: boolean;
  transactionHash?: string;
  message: string;
}

/** Contracts and prices go on-chain as integers scaled by the collateral. */
const TESTNET_DECIMALS = 6;
const SCALE = 10 ** TESTNET_DECIMALS;

const NEEDS_WALLET: WriteOutcome = { ok: false, message: "Connect a wallet first." };

function toRawUnits(human: number): bigint {
  return BigInt(Math.round(human * SCALE));
}

/**
 * Every write the desk can sign.
 *
 * All of them go through the wallet in the browser, so each one raises a
 * signature prompt the trader has to accept. The desk never holds a key and
 * cannot send anything on its own.
 *
 * Failures are returned rather than thrown, because every one of these is
 * triggered by a button that needs to say what happened — including the very
 * common case of the trader simply rejecting the prompt.
 */
export function useWriteActions() {
  const exchange = useExchange();
  const [pending, setPending] = useState<string | null>(null);

  const run = useCallback(
    async (key: string, action: () => Promise<WriteOutcome>): Promise<WriteOutcome> => {
      if (!exchange) {
        return NEEDS_WALLET;
      }
      setPending(key);
      try {
        return await action();
      } catch (error) {
        const raw = (error as Error).message ?? "";
        /**
         * A rejected prompt is the most likely failure by far, and it is not an
         * error worth alarming anyone about.
         */
        const rejected = /reject|denied|user cancel/i.test(raw);
        return {
          ok: false,
          message: rejected ? "You rejected the signature." : raw.slice(0, 160),
        };
      } finally {
        setPending(null);
      }
    },
    [exchange]
  );

  /**
   * Places the trade a proposal describes.
   *
   * The price is already snapped to the tick grid by the proposal, so it is
   * converted straight to integer units here — never re-derived from a float,
   * which is what produces the venue's InvalidPrice rejection.
   */
  const placeProposal = useCallback(
    (proposal: TradeProposal, poolAddress: string) =>
      run(proposal.proposalId, async () => {
        const expiresAt =
          BigInt(Math.floor(Date.now() / 1000) + 300) * 1_000_000_000n;

        /**
         * The SDK approves the collateral to the pool first when the allowance
         * is short, which it always is on a fresh wallet. That means the first
         * trade on a given pool raises TWO prompts — an approval, then the
         * order. Later trades on the same pool raise one.
         *
         * Without the approval the order reverts ERC20InsufficientAllowance,
         * because the pool cannot pull the collateral it is meant to escrow.
         */

        const result = await exchange!.trader.placeOrder({
          pool: poolAddress as `0x${string}`,
          side: proposal.side === "up" ? "BUY_YES" : "BUY_NO",
          price: toRawUnits(proposal.probability),
          quantity: toRawUnits(proposal.contracts),
          orderType: 2,
          expireTimestampNs: expiresAt,
        });

        if (result.receipt?.status === "reverted") {
          return { ok: false, message: "The order reverted on-chain." };
        }
        return {
          ok: true,
          transactionHash: result.hash,
          message: `Filled ${proposal.contracts} ${proposal.side.toUpperCase()}.`,
        };
      }),
    [exchange, run]
  );

  const cancelOrder = useCallback(
    (orderId: string, poolAddress: string) =>
      run(orderId, async () => {
        const result = await exchange!.trader.cancelOrder({
          pool: poolAddress as `0x${string}`,
          orderId,
        });
        return {
          ok: true,
          transactionHash: result.hash,
          message: "Cancelled. The escrow is back in your wallet.",
        };
      }),
    [exchange, run]
  );

  /** Shrinks an order while keeping its place in the price-time queue. */
  const reduceOrder = useCallback(
    (orderId: string, poolAddress: string, newContracts: number) =>
      run(orderId, async () => {
        const result = await exchange!.trader.reduceOrder({
          pool: poolAddress as `0x${string}`,
          orderId,
          newQuantityRemaining: toRawUnits(newContracts),
        });
        return {
          ok: true,
          transactionHash: result.hash,
          message: `Shrunk to ${newContracts}, queue place kept.`,
        };
      }),
    [exchange, run]
  );

  /**
   * Redeems a settled position.
   *
   * Redeeming a loser succeeds and pays nothing, so the caller is expected to
   * have checked which side won before spending gas on this.
   */
  const redeem = useCallback(
    (marketId: string, contracts: number) =>
      run(marketId, async () => {
        const result = await exchange!.trader.redeem({
          marketId: marketId as `0x${string}`,
          amount: toRawUnits(contracts),
        });
        return {
          ok: true,
          transactionHash: result.hash,
          message: "Redeemed.",
        };
      }),
    [exchange, run]
  );

  /**
   * Pushes a settled market through to payout.
   *
   * Both remedies are permissionless — they work on any market, including ones
   * the trader has no stake in. That is deliberate protocol design, so funds are
   * never stranded behind one party's permission.
   */
  const pokeOracle = useCallback(
    (marketId: string, oracleQuestionId: string) =>
      run(marketId, async () => {
        const result = await exchange!.trader.pokeOracle({
          oracleQuestionId: BigInt(oracleQuestionId),
        });
        return {
          ok: true,
          transactionHash: result.hash,
          message: "Pulled the answer through. Redemption is open.",
        };
      }),
    [exchange, run]
  );

  const voidExpired = useCallback(
    (marketId: string) =>
      run(marketId, async () => {
        const result = await exchange!.trader.voidExpired({
          marketId: marketId as `0x${string}`,
        });
        return {
          ok: true,
          transactionHash: result.hash,
          message: "Voided. Both sides redeem at 0.5.",
        };
      }),
    [exchange, run]
  );

  /** Claims test collateral so a fresh wallet can trade. */
  const claimTestFunds = useCallback(
    () =>
      run("faucet", async () => {
        const result = await exchange!.trader.faucet({});
        return {
          ok: true,
          transactionHash: result.hash,
          message: "Test collateral claimed.",
        };
      }),
    [exchange, run]
  );

  /**
   * Turns collateral into a matched pair of positions.
   *
   * One unit of collateral mints one Up and one Down, and merging the pair
   * returns the collateral. Because exactly one side pays out at settlement, a
   * complete set is always worth exactly one — so this is a swap, not a bet.
   *
   * The reason it matters is narrower than it looks. You can already quote both
   * sides with no inventory at all, because two opposite-side buyers cross
   * without a seller and the pool mints the pair from their combined collateral.
   * What minting unlocks is *selling*: you can only sell what you hold, there is
   * no naked short, so without a complete set you can post bids and never an
   * offer.
   */
  const mintSet = useCallback(
    (poolAddress: string, contracts: number) =>
      run(`mint-${poolAddress}`, async () => {
        const result = await exchange!.trader.mintSet({
          pool: poolAddress as `0x${string}`,
          amount: toRawUnits(contracts),
        });
        return {
          ok: true,
          transactionHash: result.hash,
          message: `Minted ${contracts} Up and ${contracts} Down. You can now sell either side.`,
        };
      }),
    [exchange, run]
  );

  /** Merges a matched pair back into collateral. */
  const burnSet = useCallback(
    (poolAddress: string, contracts: number) =>
      run(`burn-${poolAddress}`, async () => {
        const result = await exchange!.trader.burnSet({
          pool: poolAddress as `0x${string}`,
          amount: toRawUnits(contracts),
        });
        return {
          ok: true,
          transactionHash: result.hash,
          message: `Merged ${contracts} pairs back into ${contracts} collateral.`,
        };
      }),
    [exchange, run]
  );

  /**
   * Cancels several orders in one transaction.
   *
   * Best-effort by design: an order that filled in the race window is skipped
   * rather than failing the whole pull, which is what you want when clearing a
   * ladder. One signature instead of one per order.
   */
  const cancelOrders = useCallback(
    (poolAddress: string, orderIds: string[]) =>
      run("cancel-many", async () => {
        const result = await exchange!.trader.cancelOrders({
          pool: poolAddress as `0x${string}`,
          orderIds,
        });
        /**
         * A false outcome means the contract skipped that id — already filled,
         * already gone, or not the signer's. It cannot tell a benign race from
         * a mistake, so the count is reported without interpreting it.
         */
        const cancelled = result.outcomes.filter((outcome) => outcome.cancelled).length;
        return {
          ok: true,
          transactionHash: result.hash,
          message: `Cancelled ${cancelled} of ${orderIds.length}. Escrow is back in your wallet.`,
        };
      }),
    [exchange, run]
  );

  /**
   * Posts an offer rather than a bid.
   *
   * Only possible against outcome tokens you already hold, which is why this
   * sits next to minting — mint a set, then sell the side you do not want.
   */
  const sellSide = useCallback(
    (poolAddress: string, side: "up" | "down", contracts: number, probability: number) =>
      run(`sell-${poolAddress}`, async () => {
        const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 300) * 1_000_000_000n;
        const result = await exchange!.trader.placeOrder({
          pool: poolAddress as `0x${string}`,
          side: side === "up" ? "SELL_YES" : "SELL_NO",
          price: toRawUnits(probability),
          quantity: toRawUnits(contracts),
          // Post-only, so a quote never pays the spread it is trying to earn.
          orderType: 3,
          expireTimestampNs: expiresAt,
        });
        if (result.receipt?.status === "reverted") {
          return { ok: false, message: "The offer reverted on-chain." };
        }
        return {
          ok: true,
          transactionHash: result.hash,
          message: `Offered ${contracts} ${side.toUpperCase()} at ${probability.toFixed(3)}.`,
        };
      }),
    [exchange, run]
  );

  /**
   * Moves a resting order to a new price in one transaction.
   *
   * Cancelling and re-placing leaves a gap: for the block or two between the
   * two transactions the quote is simply absent, and on a fast tape that is
   * where the fill you wanted goes. An amend cancels and places atomically, so
   * the quote never disappears.
   *
   * The replacement carries a brand new order id and the old one is dead the
   * moment this lands, so anything tracking it has to follow the new id — which
   * is why the id is returned rather than just a hash.
   */
  const amendOrder = useCallback(
    (
      orderId: string,
      poolAddress: string,
      side: "up" | "down",
      contracts: number,
      newProbability: number
    ) =>
      run(orderId, async () => {
        const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 300) * 1_000_000_000n;

        const result = await exchange!.trader.amendOrder({
          pool: poolAddress as `0x${string}`,
          oldOrderId: orderId,
          /**
           * Left false so a filled order is reported rather than silently
           * replaced. A maker racing a fill wants to know it happened and
           * decide again, not have a fresh order placed on its behalf.
           */
          alwaysPlace: false,
          newOrder: {
            isBid: side === "up",
            price: toRawUnits(newProbability),
            quantity: toRawUnits(contracts),
            expireTimestampNs: expiresAt,
            // Post-only, so a re-quote never crosses into the book by accident.
            orderType: 3,
          },
        });

        return {
          ok: true,
          transactionHash: result.hash,
          message: `Moved to ${newProbability.toFixed(3)} without leaving a gap.`,
        };
      }),
    [exchange, run]
  );

  /**
   * Lets a front end charge a fee on the flow it routes.
   *
   * This is the venue's revenue model for anything built on top of it: an app
   * tags the orders it submits, and earns a per-fill cut that settles to its own
   * vault balance. The cap is a whole percent, and approving zero revokes.
   *
   * It is per-pool and keyed on the order owner, so the trader grants it — a
   * front end cannot tag itself onto someone else's flow. The docs only ever
   * describe this for spot, but the binary order path carries the same two
   * fields, so it works here too.
   */
  const approveBuilder = useCallback(
    (poolAddress: string, builderAddress: string, feeBps: number) =>
      run(`builder-${poolAddress}`, async () => {
        // The contract counts in basis points times a thousand.
        const rate = BigInt(Math.round(feeBps * 1000));

        const result = await exchange!.trader.approveBuilder({
          pool: poolAddress as `0x${string}`,
          builder: builderAddress as `0x${string}`,
          maxFeeBpsTimes1k: rate,
        });

        return {
          ok: true,
          transactionHash: result.hash,
          message:
            feeBps === 0
              ? "Builder approval revoked."
              : `Approved up to ${feeBps} bps per fill on this pool.`,
        };
      }),
    [exchange, run]
  );

  return {
    canSign: exchange !== null,
    pending,
    placeProposal,
    cancelOrder,
    cancelOrders,
    reduceOrder,
    amendOrder,
    redeem,
    pokeOracle,
    voidExpired,
    claimTestFunds,
    mintSet,
    burnSet,
    sellSide,
    approveBuilder,
  };
}
