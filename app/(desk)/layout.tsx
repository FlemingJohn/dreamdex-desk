import type { ReactNode } from "react";
import { CopilotLauncher } from "@/components/copilot/CopilotLauncher";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import { CopilotProvider } from "@/components/copilot/CopilotProvider";
import { CopilotSurface } from "@/components/copilot/CopilotSurface";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * The shell every page of the desk shares — sidebar, header, and the copilot
 * floating above whatever page is showing.
 *
 * Because this is a layout rather than part of each page, the copilot keeps its
 * conversation when you move between pages. Ask about calibration, walk over to
 * your portfolio, and the transcript is still there.
 */
export default function DeskLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <CopilotProvider>
          <div className="dashboard-shell">
            <DashboardHeader />
            <div className="dashboard-body">
              <ScrollArea className="h-full">
                <div className="panel-grid">{children}</div>
              </ScrollArea>
            </div>
            <CopilotSurface panel={<CopilotPanel />} launcher={<CopilotLauncher />} />
          </div>
        </CopilotProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
