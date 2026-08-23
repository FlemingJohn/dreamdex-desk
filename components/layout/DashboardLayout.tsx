"use client";

import { CopilotLauncher } from "@/components/copilot/CopilotLauncher";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { CalibrationPanel } from "@/components/dashboard/CalibrationPanel";
import { LiquidityPanel } from "@/components/dashboard/LiquidityPanel";
import { LiveMarketsPanel } from "@/components/dashboard/LiveMarketsPanel";
import { OrderBookPanel } from "@/components/dashboard/OrderBookPanel";
import { PortfolioPanel } from "@/components/dashboard/PortfolioPanel";
import { ProbabilityPathPanel } from "@/components/dashboard/ProbabilityPathPanel";
import { SettlementQualityPanel } from "@/components/dashboard/SettlementQualityPanel";
import { SettlementReceiptPanel } from "@/components/dashboard/SettlementReceiptPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCopilotPanel } from "@/hooks/useCopilotPanel";

/**
 * The dashboard shell.
 *
 * Panels always get the full width. The copilot floats above them from a
 * launcher in the corner rather than splitting the screen, so asking a question
 * never shrinks the data you are asking about.
 */
export function DashboardLayout() {
  const { isOpen, open, close } = useCopilotPanel();

  return (
    <div className="dashboard-shell">
      <DashboardHeader />

      <div className="dashboard-body">
        <ScrollArea className="h-full">
          <div className="panel-grid">
            <LiveMarketsPanel />
            <CalibrationPanel />
            <OrderBookPanel />
            <ProbabilityPathPanel />
            <LiquidityPanel />
            <SettlementQualityPanel />
            <SettlementReceiptPanel />
            <PortfolioPanel />
          </div>
        </ScrollArea>
      </div>

      {isOpen ? <CopilotPanel onClose={close} /> : <CopilotLauncher onOpen={open} />}
    </div>
  );
}
