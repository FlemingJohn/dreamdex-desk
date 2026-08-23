"use client";

import { Sparkles } from "lucide-react";
import { useCopilot } from "@/components/copilot/CopilotProvider";
import { Button } from "@/components/ui/button";

interface AskAboutButtonProps {
  question: string;
}

/**
 * Hands a panel's question to the copilot already phrased.
 *
 * Chat has a blank-page problem — you have to know what to ask. This removes
 * that: the panel knows what question it answers, so the reader never has to
 * work out how to word it.
 */
export function AskAboutButton({ question }: AskAboutButtonProps) {
  const { askAbout } = useCopilot();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => askAbout(question)}
      title={question}
    >
      <Sparkles className="size-3.5" />
      Ask
    </Button>
  );
}
