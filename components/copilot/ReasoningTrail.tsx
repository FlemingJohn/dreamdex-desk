"use client";

import { useState } from "react";
import { Check, ChevronRight, Loader2, X } from "lucide-react";
import type { ToolCallRecord } from "@/types/copilot";

interface ReasoningTrailProps {
  toolCalls: ToolCallRecord[];
}

function StatusIcon({ status }: { status: ToolCallRecord["status"] }) {
  if (status === "running") {
    return <Loader2 className="size-3 animate-spin shrink-0" />;
  }
  if (status === "failed") {
    return <X className="size-3 shrink-0 text-destructive" />;
  }
  return <Check className="size-3 shrink-0 approval-check-passed" />;
}

/**
 * What the copilot did before answering.
 *
 * Its answers are only worth as much as the data behind them, so the steps are
 * shown rather than hidden — and each one opens to reveal the arguments it
 * passed. A claim like "windows priced this high resolve up less often" should
 * be checkable without taking anyone's word for it.
 *
 * Collapsed by default. The trail matters when you doubt the answer, and gets in
 * the way when you do not.
 */
export function ReasoningTrail({ toolCalls }: ReasoningTrailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openStep, setOpenStep] = useState<number | null>(null);

  if (toolCalls.length === 0) {
    return null;
  }

  const totalMs = toolCalls.reduce((sum, call) => sum + (call.durationMs ?? 0), 0);

  return (
    <div className="reasoning-trail">
      <button
        type="button"
        className="reasoning-summary"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <ChevronRight
          className={`size-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
        <span>
          Checked {toolCalls.length} {toolCalls.length === 1 ? "source" : "sources"}
        </span>
        {totalMs > 0 ? (
          <span className="reasoning-duration">{(totalMs / 1000).toFixed(1)}s</span>
        ) : null}
      </button>

      {isOpen ? (
        <ol className="reasoning-steps">
          {toolCalls.map((call) => {
            const hasDetail =
              call.arguments !== undefined && Object.keys(call.arguments).length > 0;
            const isStepOpen = openStep === call.step;

            return (
              <li className="reasoning-step" key={`${call.step}-${call.name}`}>
                {call.narration ? (
                  <p className="reasoning-narration">{call.narration}</p>
                ) : null}

                <button
                  type="button"
                  className="reasoning-call"
                  disabled={!hasDetail}
                  onClick={() => setOpenStep(isStepOpen ? null : call.step)}
                  aria-expanded={isStepOpen}
                >
                  <StatusIcon status={call.status} />
                  <code className="reasoning-tool-name">{call.name}</code>
                  {call.summary ? (
                    <span className="reasoning-result">{call.summary}</span>
                  ) : null}
                  {call.durationMs ? (
                    <span className="reasoning-duration">{call.durationMs}ms</span>
                  ) : null}
                </button>

                {isStepOpen && call.arguments ? (
                  <pre className="reasoning-arguments">
                    {JSON.stringify(call.arguments, null, 2)}
                  </pre>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
