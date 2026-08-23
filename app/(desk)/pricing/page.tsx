import { CalibrationPanel } from "@/components/dashboard/CalibrationPanel";
import { EdgePanel } from "@/components/dashboard/EdgePanel";
import { LiquidityPanel } from "@/components/dashboard/LiquidityPanel";
import { ProbabilityPathPanel } from "@/components/dashboard/ProbabilityPathPanel";

/**
 * The edge panel comes first because it is the conclusion — calibration and the
 * probability path are the workings behind it.
 */
export default function PricingPage() {
  return (
    <>
      <EdgePanel />
      <div className="panel-pair">
        <CalibrationPanel />
        <ProbabilityPathPanel />
      </div>
      <LiquidityPanel />
    </>
  );
}
