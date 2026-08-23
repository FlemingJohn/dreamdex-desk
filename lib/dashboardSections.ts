/**
 * How the panels are grouped in the sidebar.
 *
 * The order runs the way a trader actually works: see what is open, judge
 * whether the price is fair, check you can get filled, confirm the result was
 * honest, then look at your own book.
 */
export interface DashboardPanelLink {
  anchor: string;
  label: string;
}

export interface DashboardSection {
  label: string;
  panels: DashboardPanelLink[];
}

export const dashboardSections: DashboardSection[] = [
  {
    label: "Markets",
    panels: [
      { anchor: "live-markets", label: "Live markets" },
      { anchor: "order-book", label: "Order book" },
    ],
  },
  {
    label: "Is the price fair?",
    panels: [
      { anchor: "calibration", label: "Calibration" },
      { anchor: "probability-path", label: "Probability path" },
      { anchor: "liquidity", label: "Liquidity" },
    ],
  },
  {
    label: "Settlement",
    panels: [
      { anchor: "settlement-quality", label: "Quality" },
      { anchor: "settlement-receipts", label: "Receipts" },
    ],
  },
  {
    label: "You",
    panels: [{ anchor: "portfolio", label: "Your book" }],
  },
];
