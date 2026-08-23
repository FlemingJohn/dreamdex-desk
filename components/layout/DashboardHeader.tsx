"use client";

import { PanelRightOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  isCopilotOpen: boolean;
  onOpenCopilot: () => void;
}

/** Title bar. The copilot toggle only appears when the panel is hidden. */
export function DashboardHeader({ isCopilotOpen, onOpenCopilot }: DashboardHeaderProps) {
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

      {isCopilotOpen ? null : (
        <Button variant="outline" size="sm" onClick={onOpenCopilot}>
          <PanelRightOpen className="size-4" />
          Copilot
        </Button>
      )}
    </header>
  );
}
