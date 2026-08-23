"use client";

import { PanelShell } from "@/components/dashboard/PanelShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isStaleOrder, useWorkingOrders } from "@/hooks/useWorkingOrders";
import { formatCountdown } from "@/lib/format/formatCountdown";
import { formatWindow } from "@/lib/format/formatWindow";
import { formatProbability } from "@/lib/format/formatProbability";
import { formatUsdc } from "@/lib/format/formatUsdc";

/**
 * Orders resting on the book, and how to clear them.
 *
 * The unfilled part of a limit order sits there with collateral locked, and it
 * does so invisibly unless something is tracking it — so an order placed and
 * forgotten quietly ties up funds you think you still have. This panel exists
 * to make that impossible.
 *
 * Shrinking uses reduce rather than cancel-and-replace, because reduce keeps
 * the order's place in the price-time queue.
 */
export function WorkingOrdersPanel() {
  const {
    orders,
    staleOrders,
    escrowedTotal,
    isConnected,
    busyId,
    cancelOrder,
    cancelStaleOrders,
    reduceOrder,
  } = useWorkingOrders();

  return (
    <PanelShell
      id="working-orders"
      title="Working orders"
      description="Orders resting on the book with collateral locked behind them."
      headerExtra={
        <Badge variant={escrowedTotal > 0 ? "default" : "secondary"}>
          {formatUsdc(escrowedTotal)} locked
        </Badge>
      }
      askQuestion="Are any of my resting orders never going to fill?"
    >
      {!isConnected ? (
        <p className="panel-note">
          Connect a wallet to see what you have resting on the book.
        </p>
      ) : orders.length === 0 ? (
        <p className="panel-note">Nothing resting. No collateral tied up.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Market</TableHead>
                <TableHead>Side</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Filled</TableHead>
                <TableHead className="text-right">Locked</TableHead>
                <TableHead className="text-right">From touch</TableHead>
                <TableHead className="text-right">Expires</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const stale = isStaleOrder(order);
                const isBusy = busyId === order.orderId || busyId === "all";
                const remaining = order.contracts - order.contractsFilled;

                return (
                  <TableRow key={order.orderId}>
                    <TableCell className="font-medium">
                      {order.asset} {formatWindow(order.windowSeconds)}
                    </TableCell>
                    <TableCell className={order.side === "up" ? "side-up" : "side-down"}>
                      {order.side.toUpperCase()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatProbability(order.probability)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {order.contractsFilled} / {order.contracts}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatUsdc(order.escrowedUsdc)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${
                        stale ? "value-negative font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {formatProbability(order.distanceFromTouch)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCountdown(order.expiresInSeconds)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {remaining > 1 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isBusy}
                            onClick={() =>
                              reduceOrder(order.orderId, Math.floor(remaining / 2))
                            }
                            title="Halve the size, keeping its place in the queue"
                          >
                            Halve
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => cancelOrder(order.orderId)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {staleOrders.length > 0 ? (
            <div className="panel-metric-row mt-3">
              <span className="panel-note">
                {staleOrders.length}{" "}
                {staleOrders.length === 1 ? "order has" : "orders have"} drifted from the
                touch with nothing filled — they are holding collateral they will not spend.
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId !== null}
                onClick={cancelStaleOrders}
              >
                Cancel stale
              </Button>
            </div>
          ) : null}
        </>
      )}
    </PanelShell>
  );
}
