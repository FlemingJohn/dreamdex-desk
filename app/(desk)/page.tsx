import { LiveMarketsPanel } from "@/components/dashboard/LiveMarketsPanel";
import { OrderBookPanel } from "@/components/dashboard/OrderBookPanel";

export default function MarketsPage() {
  return (
    <>
      <LiveMarketsPanel />
      <OrderBookPanel />
    </>
  );
}
