"use client";

import { CopilotLauncher } from "@/components/copilot/CopilotLauncher";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import { CopilotProvider, useCopilot } from "@/components/copilot/CopilotProvider";
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

/** Panels always get the full width; the copilot floats above them. */
function DashboardBody() {
  const { isOpen } = useCopilot();

  return (
    <>
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

      {isOpen ? <CopilotPanel /> : <CopilotLauncher />}
    </>
  );
}

/**
 * The dashboard shell.
 *
 * Everything sits inside the copilot provider so a buy button on a panel and a
 * sentence in the chat reach the same place — one transcript, one approval.
 */
export function DashboardLayout() {
  return (
    <CopilotProvider>
      <div className="dashboard-shell">
        <DashboardHeader />
        <DashboardBody />
      </div>
    </CopilotProvider>
  );
}
