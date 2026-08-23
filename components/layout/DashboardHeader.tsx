"use client";

import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/** Title bar. The copilot has its own launcher, so it is not opened from here. */
export function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <div>
        <div className="dashboard-title">DreamDEX Desk</div>
        <div className="dashboard-subtitle">
          Event contract analytics on Somnia · Shannon testnet
        </div>
      </div>

      <Badge variant="secondary" className="ml-auto">
        mock data
      </Badge>

      <ThemeToggle />
    </header>
  );
}
