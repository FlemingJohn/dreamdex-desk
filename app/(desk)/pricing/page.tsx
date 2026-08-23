import { CalibrationPanel } from "@/components/dashboard/CalibrationPanel";
import { LiquidityPanel } from "@/components/dashboard/LiquidityPanel";
import { ProbabilityPathPanel } from "@/components/dashboard/ProbabilityPathPanel";

export default function PricingPage() {
  return (
    <>
      <CalibrationPanel />
      <ProbabilityPathPanel />
      <LiquidityPanel />
    </>
  );
}
