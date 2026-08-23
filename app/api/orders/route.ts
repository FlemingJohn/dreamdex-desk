import { NextResponse } from "next/server";

type OrderAction = "cancel" | "reduce" | "amend";

interface OrderRequest {
  action: OrderAction;
  orderIds?: string[];
  orderId?: string;
  newContracts?: number;
  newProbability?: number;
}

/**
 * Managing orders already on the book.
 *
 * None of these need the approval card a new trade does. Cancelling and
 * shrinking return collateral to you and can never spend more, so the only
 * risk is changing your mind. Amending is a cancel and a replace in one
 * transaction, which is why it is here rather than on the trade path.
 *
 * Against the live SDK: cancel maps to `cancelOrders`, which is best-effort so
 * one order filling mid-flight does not fail the rest; reduce maps to
 * `reduceOrder`, which keeps the order's place in the price-time queue where
 * cancelling and re-placing would send it to the back; amend maps to
 * `amendOrder`, which is atomic and so never leaves a gap in a quote.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as OrderRequest;

  if (body.action === "cancel") {
    const orderIds = body.orderIds ?? [];
    if (orderIds.length === 0) {
      return NextResponse.json({ error: "No orders named." }, { status: 400 });
    }

    return NextResponse.json({
      cancelled: orderIds,
      transactionHash: `0xcancel${Date.now().toString(16).slice(-6)}`,
    });
  }

  if (body.action === "reduce") {
    if (!body.orderId || typeof body.newContracts !== "number") {
      return NextResponse.json(
        { error: "Reducing needs an order and a new size." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      orderId: body.orderId,
      newContracts: body.newContracts,
      keptQueuePriority: true,
      transactionHash: `0xreduce${Date.now().toString(16).slice(-6)}`,
    });
  }

  if (body.action === "amend") {
    if (!body.orderId || typeof body.newProbability !== "number") {
      return NextResponse.json(
        { error: "Amending needs an order and a new price." },
        { status: 400 }
      );
    }

    /**
     * An amend returns a brand new order id — the old one is dead the moment
     * this lands, so anything tracking it has to follow the replacement.
     */
    return NextResponse.json({
      oldOrderId: body.orderId,
      newOrderId: String(Number(body.orderId) + 1),
      newProbability: body.newProbability,
      transactionHash: `0xamend${Date.now().toString(16).slice(-6)}`,
    });
  }

  return NextResponse.json({ error: "Unknown order action." }, { status: 400 });
}
