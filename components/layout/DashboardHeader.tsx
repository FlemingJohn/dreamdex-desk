"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * Title bar. The sidebar collapses from here; the copilot has its own launcher
 * in the corner, so it is not opened from this row.
 */
export function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />

      <div>
        <div className="dashboard-title">Event contract analytics</div>
        <div className="dashboard-subtitle">
          BTC and ETH · 15 minute and 1 hour windows
        </div>
      </div>

      <Badge variant="secondary" className="ml-auto">
        mock data
      </Badge>

      <ThemeToggle />
    </header>
  );
}
