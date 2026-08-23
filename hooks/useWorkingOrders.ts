"use client";

import { useCallback, useMemo, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
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

  const escrowedTotal = useMemo(
    () => workingOrders.reduce((total, order) => total + order.escrowedUsdc, 0),
    [workingOrders]
  );
  const staleOrders = useMemo(
    () => workingOrders.filter(isStaleOrder),
    [workingOrders]
  );

  const send = useCallback(
    async (busyKey: string, body: Record<string, unknown>) => {
      setBusyId(busyKey);
      try {
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        await refresh();
      } finally {
        setBusyId(null);
      }
    },
    [refresh]
  );

  const cancelOrder = useCallback(
    (orderId: string) => send(orderId, { action: "cancel", orderIds: [orderId] }),
    [send]
  );

  /**
   * Batch cancel is best-effort by design — an order that filled in the race
   * window is skipped rather than failing the whole pull.
   */
  const cancelStaleOrders = useCallback(() => {
    const orderIds = staleOrders.map((order) => order.orderId);
    if (orderIds.length === 0) {
      return Promise.resolve();
    }
    return send("all", { action: "cancel", orderIds });
  }, [send, staleOrders]);

  /**
   * Shrinks an order rather than replacing it, which keeps its place in the
   * price-time queue. Re-placing a smaller order would send it to the back.
   */
  const reduceOrder = useCallback(
    (orderId: string, newContracts: number) =>
      send(orderId, { action: "reduce", orderId, newContracts }),
    [send]
  );

  return {
    orders: workingOrders,
    staleOrders,
    escrowedTotal,
    isConnected,
    isLoading,
    busyId,
    cancelOrder,
    cancelStaleOrders,
    reduceOrder,
  };
}
