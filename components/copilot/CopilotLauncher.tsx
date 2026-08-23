"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopilot } from "@/components/copilot/CopilotProvider";

/**
 * The button that summons the copilot, parked in the bottom-right corner.
 *
 * It stays out of the way until asked for. The dashboard keeps its full width
 * whether the copilot is open or not, so opening it never costs you a panel.
 */
export function CopilotLauncher() {
  const { open } = useCopilot();

  return (
    <Button
      className="copilot-launcher"
      size="lg"
      onClick={open}
      aria-label="Open the copilot"
    >
      <Bot className="size-5" />
      Copilot
    </Button>
  );
}
