import { Activity, ShieldCheck, Target, Wallet, type LucideIcon } from "lucide-react";

/**
 * The four pages of the desk, in the order a trader actually works.
 *
 * See what is open, judge whether the price is fair, confirm the result was
 * settled honestly, then look at your own book. Each is a real route rather
 * than an anchor, so the browser's back button works and a page can be linked
 * to directly.
 */
export interface DashboardRoute {
  href: string;
  label: string;
  /** Shown under the page title, and as the tooltip on the collapsed rail. */
  description: string;
  icon: LucideIcon;
}

export const dashboardRoutes: DashboardRoute[] = [
  {
    href: "/",
    label: "Markets",
    description: "Every open window and where the resting orders sit",
    icon: Activity,
  },
  {
    href: "/pricing",
    label: "Pricing",
    description: "Whether the market means what it says, and when to enter",
    icon: Target,
  },
  {
    href: "/settlement",
    label: "Settlement",
    description: "Void risk, and why each market resolved the way it did",
    icon: ShieldCheck,
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    description: "Open positions, performance, and anything unclaimed",
    icon: Wallet,
  },
];

export function findRouteByPath(pathname: string): DashboardRoute | undefined {
  return dashboardRoutes.find((route) => route.href === pathname);
}
