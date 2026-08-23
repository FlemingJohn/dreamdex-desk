import { Check, Loader2, X } from "lucide-react";
import type { ToolCallRecord } from "@/types/copilot";

interface ToolCallRowProps {
  toolCall: ToolCallRecord;
}

/**
 * One line showing a tool the copilot reached for.
 *
 * These are visible on purpose. The copilot's answers are only as trustworthy
 * as the data behind them, so the reader should be able to see exactly what it
 * looked at before believing what it says.
 */
export function ToolCallRow({ toolCall }: ToolCallRowProps) {
  return (
    <div className="copilot-tool-row">
      {toolCall.status === "running" ? (
        <Loader2 className="size-3 animate-spin" />
      ) : toolCall.status === "failed" ? (
        <X className="size-3 text-destructive" />
      ) : (
        <Check className="size-3" />
      )}
      <span className="copilot-tool-name">{toolCall.name}</span>
      {toolCall.summary ? <span>· {toolCall.summary}</span> : null}
    </div>
  );
}
