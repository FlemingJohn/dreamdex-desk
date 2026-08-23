import { SettlementQualityPanel } from "@/components/dashboard/SettlementQualityPanel";
import { SettlementReceiptPanel } from "@/components/dashboard/SettlementReceiptPanel";
import { StrandedFundsPanel } from "@/components/dashboard/StrandedFundsPanel";

export default function SettlementPage() {
  return (
    <>
      <StrandedFundsPanel />
      <SettlementQualityPanel />
      <SettlementReceiptPanel />
    </>
  );
}
