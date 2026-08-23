"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { FaucetButton } from "@/components/layout/FaucetButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { findRouteByPath } from "@/lib/dashboardRoutes";

/**
 * Title bar. Names the page you are on, so the sidebar and the heading never
 * disagree about where you are.
 */
export function DashboardHeader() {
  const pathname = usePathname();
  const route = findRouteByPath(pathname);

  return (
    <header className="dashboard-header">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />

      <div className="flex flex-col gap-0.5">
        <h1 className="text-sm font-semibold tracking-tight">
          {route?.label ?? "Desk"}
        </h1>
        <p className="text-xs text-muted-foreground">
          {route?.description ?? "Event contract analytics on Somnia"}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <FaucetButton />
        <ConnectWalletButton />
      </div>

      <ThemeToggle />
    </header>
  );
}
