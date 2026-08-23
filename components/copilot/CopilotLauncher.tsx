"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopilot } from "@/components/copilot/CopilotProvider";

/**
 * The button that summons the copilot, parked in the bottom-left corner.
 *
 * It stays out of the way until asked for. The dashboard keeps its full width
 * whether the copilot is open or not, so opening it never costs you a panel.
 */
export function CopilotLauncher() {
  const { open } = useCopilot();

  return (
    <Button className="copilot-launcher" size="lg" onClick={open}>
      <MessageSquare className="size-4" />
      Copilot
    </Button>
  );
}
