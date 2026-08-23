import { CompleteSetsPanel } from "@/components/dashboard/CompleteSetsPanel";
import { LiveMarketsPanel } from "@/components/dashboard/LiveMarketsPanel";
import { OrderBookPanel } from "@/components/dashboard/OrderBookPanel";
import { WorkingOrdersPanel } from "@/components/dashboard/WorkingOrdersPanel";

/**
 * The book and complete sets sit side by side because they are read together:
 * the spread on one decides whether minting to quote into it is worth it.
 */
export default function MarketsPage() {
  return (
    <>
      <LiveMarketsPanel />
      <WorkingOrdersPanel />
      <div className="panel-pair">
        <OrderBookPanel />
        <CompleteSetsPanel />
      </div>
    </>
  );
}
