"use client";

import type { ReactNode } from "react";
import { useCopilot } from "@/components/copilot/CopilotProvider";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * The scrolling panel area.
 *
 * It leaves room on the right for the copilot while the copilot is parked in
 * its corner, so opening the copilot pushes the panels aside rather than
 * covering them. Once the copilot has been dragged elsewhere the inset drops to
 * zero and it floats freely — at that point overlapping is the reader's choice
 * rather than something the layout imposed.
 */
export function DashboardBody({ children }: { children: ReactNode }) {
  const { dashboardInset } = useCopilot();

  return (
    <div className="dashboard-body">
      <ScrollArea className="h-full">
        <div
          className="panel-grid"
          style={{ paddingRight: `calc(1.25rem + ${dashboardInset}px)` }}
        >
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}
