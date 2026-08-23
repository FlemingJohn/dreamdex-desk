"use client";

import { useCallback, useMemo, useState } from "react";
import {
  getMockWorkingOrders,
  isStaleOrder,
  sumEscrowedCollateral,
} from "@/lib/mock/mockWorkingOrders";

/**
 * Orders resting on the book, and the actions that clear them.
 *
 * Cancelling and shrinking need no approval card. Both can only ever return
 * collateral to you — the worst case is that you wanted the order after all —
 * so a confirmation would be ceremony without a purpose.
 */
export function useWorkingOrders() {
  const [cancelledIds, setCancelledIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const allOrders = useMemo(() => getMockWorkingOrders(), []);
  const orders = useMemo(
    () => allOrders.filter((order) => !cancelledIds.includes(order.orderId)),
    [allOrders, cancelledIds]
  );

  const escrowedTotal = useMemo(() => sumEscrowedCollateral(orders), [orders]);
  const staleOrders = useMemo(() => orders.filter(isStaleOrder), [orders]);

  const cancelOrder = useCallback(async (orderId: string) => {
    setBusyId(orderId);
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", orderIds: [orderId] }),
      });
      setCancelledIds((current) => [...current, orderId]);
    } finally {
      setBusyId(null);
    }
  }, []);

  /**
   * Clears every order that has drifted away from the touch and filled
   * nothing. Batch cancel is best-effort by design — an order that filled in
   * the race window is skipped rather than failing the whole pull.
   */
  const cancelStaleOrders = useCallback(async () => {
    const ids = staleOrders.map((order) => order.orderId);
    if (ids.length === 0) {
      return;
    }
    setBusyId("all");
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", orderIds: ids }),
      });
      setCancelledIds((current) => [...current, ...ids]);
    } finally {
      setBusyId(null);
    }
  }, [staleOrders]);

  /**
   * Shrinks an order instead of replacing it, which keeps its place in the
   * price-time queue. Re-placing a smaller order would send it to the back.
   */
  const reduceOrder = useCallback(async (orderId: string, newContracts: number) => {
    setBusyId(orderId);
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reduce", orderId, newContracts }),
      });
    } finally {
      setBusyId(null);
    }
  }, []);

  return {
    orders,
    staleOrders,
    escrowedTotal,
    busyId,
    cancelOrder,
    cancelStaleOrders,
    reduceOrder,
    isLoading: false,
  };
}
