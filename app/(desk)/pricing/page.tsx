import { CalibrationPanel } from "@/components/dashboard/CalibrationPanel";
import { LiquidityPanel } from "@/components/dashboard/LiquidityPanel";
import { ProbabilityPathPanel } from "@/components/dashboard/ProbabilityPathPanel";

/**
 * Calibration and the probability path are read together — one says whether a
 * price is fair, the other says when to take it — so they sit side by side.
 * Liquidity answers a separate question and gets its own width.
 */
export default function PricingPage() {
  return (
    <>
      <div className="panel-pair">
        <CalibrationPanel />
        <ProbabilityPathPanel />
      </div>
      <LiquidityPanel />
    </>
  );
}
