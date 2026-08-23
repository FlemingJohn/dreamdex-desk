import type { WorkingOrder } from "@/types/order";

/**
 * Orders resting on the book.
 *
 * The unfilled remainder of a limit order rests with collateral locked, and it
 * does so invisibly if nothing is tracking it — which is exactly why this needs
 * a panel. Two of these have drifted well away from the touch and are unlikely
 * to fill; one is nearly expired.
 */
export function getMockWorkingOrders(): WorkingOrder[] {
  return [
    {
      orderId: "184213",
      marketId: "0x8471",
      asset: "BTC",
      windowSeconds: 900,
      side: "up",
      probability: 0.54,
      contracts: 40,
      contractsFilled: 12,
      escrowedUsdc: 15.12,
      distanceFromTouch: 0.07,
      expiresInSeconds: 412,
    },
    {
      orderId: "184198",
      marketId: "0x8468",
      asset: "BTC",
      windowSeconds: 3600,
      side: "down",
      probability: 0.38,
      contracts: 60,
      contractsFilled: 0,
      escrowedUsdc: 22.8,
      distanceFromTouch: 0.07,
      expiresInSeconds: 2380,
    },
    {
      orderId: "184176",
      marketId: "0x8472",
      asset: "ETH",
      windowSeconds: 900,
      side: "up",
      probability: 0.44,
      contracts: 25,
      contractsFilled: 25,
      escrowedUsdc: 0,
      distanceFromTouch: 0.04,
      expiresInSeconds: 96,
    },
  ];
}

/** Collateral locked across every resting order. */
export function sumEscrowedCollateral(orders: WorkingOrder[]): number {
  return orders.reduce((total, order) => total + order.escrowedUsdc, 0);
}

/**
 * An order far from the touch with an expiry approaching is dead weight — it
 * is holding collateral it will almost certainly never spend.
 */
export function isStaleOrder(order: WorkingOrder): boolean {
  return order.distanceFromTouch >= 0.06 && order.contractsFilled === 0;
}
