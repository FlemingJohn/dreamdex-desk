"use client";

import type { ReactNode } from "react";
import { useCopilot } from "@/components/copilot/CopilotProvider";

interface CopilotSurfaceProps {
  panel: ReactNode;
  launcher: ReactNode;
}

/**
 * Shows either the copilot or the button that summons it.
 *
 * Split out so the desk layout can stay a server component — only this needs
 * to read whether the panel is open.
 */
export function CopilotSurface({ panel, launcher }: CopilotSurfaceProps) {
  const { isOpen } = useCopilot();
  return <>{isOpen ? panel : launcher}</>;
}
