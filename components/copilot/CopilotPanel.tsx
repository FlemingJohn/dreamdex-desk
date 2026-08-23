"use client";

import { Bot, X } from "lucide-react";
import { useCopilot } from "@/components/copilot/CopilotProvider";
import { MessageInput } from "@/components/copilot/MessageInput";
import { MessageList } from "@/components/copilot/MessageList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDraggablePanel } from "@/hooks/useDraggablePanel";
import { usePanelSize } from "@/hooks/usePanelSize";

const SUGGESTED_QUESTIONS = [
  "Anything worth trading right now?",
  "Is the market calibrated?",
  "What am I owed?",
];

/**
 * The copilot, floating over the dashboard from its launcher.
 *
 * It can be dragged by its header and resized from its top-right corner,
 * because it necessarily covers part of the thing it is talking about — being
 * able to shove it aside or shrink it is the whole reason it floats rather
 * than docking.
 */
export function CopilotPanel() {
  const { messages, isThinking, sendMessage, approveProposal, rejectProposal, close } =
    useCopilot();
  const { panelRef, position, isDragging, resetPosition, dragHandleProps } =
    useDraggablePanel();
  const { size, isResizing, isDefaultSize, resetSize, resizeHandleProps } = usePanelSize();

  const hasBeenMoved = position !== null || !isDefaultSize;

  function resetPanel() {
    resetPosition();
    resetSize();
  }

  return (
    <div
      ref={panelRef}
      className="copilot-panel"
      style={{
        width: size.width,
        height: size.height,
        ...(position ? { left: position.left, top: position.top, bottom: "auto" } : {}),
      }}
    >
      <span
        className={`copilot-resize-handle ${isResizing ? "is-resizing" : ""}`}
        aria-hidden="true"
        {...resizeHandleProps}
      />

      <div
        className={`copilot-header copilot-header-draggable ${isDragging ? "is-dragging" : ""}`}
        {...dragHandleProps}
      >
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-muted-foreground" />
          <span className="copilot-title">Copilot</span>
          <Badge variant="secondary">approval required</Badge>
        </div>

        <div className="flex items-center gap-1">
          {hasBeenMoved ? (
            <Button variant="ghost" size="sm" onClick={resetPanel}>
              Reset
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" onClick={close} aria-label="Close copilot">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <MessageList
        messages={messages}
        isThinking={isThinking}
        onApprove={approveProposal}
        onReject={rejectProposal}
      />

      {messages.length <= 1 ? (
        <div className="copilot-suggestions">
          {SUGGESTED_QUESTIONS.map((question) => (
            <Button
              key={question}
              variant="outline"
              size="sm"
              onClick={() => sendMessage(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      ) : null}

      <MessageInput onSend={sendMessage} disabled={isThinking} />
    </div>
  );
}
