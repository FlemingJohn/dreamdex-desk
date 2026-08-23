"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { dashboardSections } from "@/lib/dashboardSections";

/**
 * Navigation for the panel grid.
 *
 * Eight panels is more than fits on a screen, so the sidebar is how you reach
 * one directly. The group headings are questions rather than categories,
 * because that is closer to why someone opens a given panel.
 */
export function DashboardSidebar() {
  function scrollToPanel(anchor: string) {
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="px-2 py-1.5">
          <div className="dashboard-title">DreamDEX Desk</div>
          <div className="dashboard-subtitle">Shannon testnet</div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {dashboardSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.panels.map((panel) => (
                  <SidebarMenuItem key={panel.anchor}>
                    <SidebarMenuButton
                      tooltip={panel.label}
                      onClick={() => scrollToPanel(panel.anchor)}
                    >
                      <span>{panel.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
