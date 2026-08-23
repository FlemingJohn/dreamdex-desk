import { SettlementQualityPanel } from "@/components/dashboard/SettlementQualityPanel";
import { SettlementReceiptPanel } from "@/components/dashboard/SettlementReceiptPanel";

export default function SettlementPage() {
  return (
    <>
      <SettlementQualityPanel />
      <SettlementReceiptPanel />
    </>
  );
}
