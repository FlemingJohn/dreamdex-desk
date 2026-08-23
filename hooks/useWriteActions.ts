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

  return {
    canSign: exchange !== null,
    pending,
    placeProposal,
    cancelOrder,
    reduceOrder,
    redeem,
    pokeOracle,
    voidExpired,
    claimTestFunds,
  };
}
