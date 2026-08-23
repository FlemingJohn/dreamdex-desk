"use client";

import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { CalibrationPanel } from "@/components/dashboard/CalibrationPanel";
import { LiquidityPanel } from "@/components/dashboard/LiquidityPanel";
import { LiveMarketsPanel } from "@/components/dashboard/LiveMarketsPanel";
import { PortfolioPanel } from "@/components/dashboard/PortfolioPanel";
import { ProbabilityPathPanel } from "@/components/dashboard/ProbabilityPathPanel";
import { SettlementQualityPanel } from "@/components/dashboard/SettlementQualityPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useCopilotPanel } from "@/hooks/useCopilotPanel";

/**
 * The dashboard shell — analytics on the left, copilot on the right, with a
 * draggable divider between them.
 *
 * The copilot gets real estate rather than a floating bubble because it is half
 * the product, not a help widget. Hiding it hands the full width back to the
 * panels.
 */
export function DashboardLayout() {
  const { isOpen, toggle, defaultWidthPercent } = useCopilotPanel();

  const panels = (
    <ScrollArea className="h-full">
      <div className="panel-grid">
        <LiveMarketsPanel />
        <CalibrationPanel />
        <ProbabilityPathPanel />
        <LiquidityPanel />
        <SettlementQualityPanel />
        <PortfolioPanel />
      </div>
    </ScrollArea>
  );

  return (
    <div className="dashboard-shell">
      <DashboardHeader isCopilotOpen={isOpen} onOpenCopilot={toggle} />

      <div className="dashboard-body">
        {isOpen ? (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={100 - defaultWidthPercent} minSize={40}>
              {panels}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={defaultWidthPercent} minSize={20} maxSize={45}>
              <CopilotPanel onClose={toggle} />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          panels
        )}
      </div>
    </div>
  );
}
