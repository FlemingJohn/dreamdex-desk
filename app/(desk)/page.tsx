import { LiveMarketsPanel } from "@/components/dashboard/LiveMarketsPanel";
import { OrderBookPanel } from "@/components/dashboard/OrderBookPanel";
import { WorkingOrdersPanel } from "@/components/dashboard/WorkingOrdersPanel";

export default function MarketsPage() {
  return (
    <>
      <LiveMarketsPanel />
      <WorkingOrdersPanel />
      <OrderBookPanel />
    </>
  );
}
