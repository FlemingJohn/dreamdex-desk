"use client";

import { useCallback, useMemo, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useWriteActions } from "@/hooks/useWriteActions";
import type { WorkingOrder } from "@/types/order";

/**
 * An order that has drifted from the touch with nothing filled is holding
 * collateral it will not spend.
 */
export function isStaleOrder(order: WorkingOrder): boolean {
  return order.contractsFilled === 0 && order.expiresInSeconds < 300;
}

/**
 * Orders resting on the book, and the actions that clear them.
 *
 * Cancelling and shrinking need no approval card. Both can only ever return
 * collateral — the worst case is wanting the order back — so a confirmation
 * would be ceremony without a purpose.
 */
export function useWorkingOrders() {
  const { workingOrders, isConnected, isLoading, refresh } = useWallet();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const escrowedTotal = useMemo(
    () => workingOrders.reduce((total, order) => total + order.escrowedUsdc, 0),
    [workingOrders]
  );
  const staleOrders = useMemo(
    () => workingOrders.filter(isStaleOrder),
    [workingOrders]
  );

  const write = useWriteActions();

  /**
   * Cancelling and shrinking need no approval card — both can only return
   * collateral, so the worst case is wanting the order back. They still raise a
   * wallet prompt, because every write does.
   */
  const cancelOrder = useCallback(
    async (orderId: string, poolAddress: string) => {
      setBusyId(orderId);
      try {
        const outcome = await write.cancelOrder(orderId, poolAddress);
        setLastMessage(outcome.message);
        if (outcome.ok) {
          await refresh();
        }
      } finally {
        setBusyId(null);
      }
    },
    [refresh, write]
  );

  /**
   * Clears stale orders in one transaction per pool rather than one per order.
   *
   * Batch cancel is best-effort: an order that filled in the race window is
   * skipped instead of failing the whole pull, which is exactly what you want
   * when clearing a ladder.
   */
  const cancelStaleOrders = useCallback(async () => {
    if (staleOrders.length === 0) {
      return;
    }
    setBusyId("all");
    try {
      const byPool = new Map<string, string[]>();
      for (const order of staleOrders) {
        byPool.set(order.poolAddress, [
          ...(byPool.get(order.poolAddress) ?? []),
          order.orderId,
        ]);
      }

      for (const [poolAddress, orderIds] of byPool) {
        const outcome = await write.cancelOrders(poolAddress, orderIds);
        setLastMessage(outcome.message);
        if (!outcome.ok) {
          break;
        }
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  }, [refresh, staleOrders, write]);

  /**
   * Shrinks rather than replaces, which keeps the order's place in the
   * price-time queue. Cancelling and re-placing would send it to the back.
   */
  const reduceOrder = useCallback(
    async (orderId: string, poolAddress: string, newContracts: number) => {
      setBusyId(orderId);
      try {
        const outcome = await write.reduceOrder(orderId, poolAddress, newContracts);
        setLastMessage(outcome.message);
        if (outcome.ok) {
          await refresh();
        }
      } finally {
        setBusyId(null);
      }
    },
    [refresh, write]
  );

  return {
    orders: workingOrders,
    staleOrders,
    escrowedTotal,
    isConnected,
    isLoading,
    busyId,
    lastMessage,
    cancelOrder,
    cancelStaleOrders,
    reduceOrder,
  };
}
