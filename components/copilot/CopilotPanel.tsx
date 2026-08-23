"use client";

import { Bot, ChevronDown, ChevronUp, X } from "lucide-react";
import { useCopilot } from "@/components/copilot/CopilotProvider";
import { MessageInput } from "@/components/copilot/MessageInput";
import { MessageList } from "@/components/copilot/MessageList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SUGGESTED_QUESTIONS = [
  "Where is the best edge right now?",
  "Any orders that will never fill?",
  "Is any money stuck?",
];

/**
 * The copilot, floating over the dashboard from its launcher.
 *
 * Three states, because a panel this size cannot always be welcome. Open, it
 * reserves room in the grid so it covers nothing. Minimised, it is a header bar
 * that keeps the conversation. Closed, it is a button in the corner.
 *
 * It can also be dragged by its header and resized from its top-left corner —
 * once dragged it floats freely and the grid stops making room for it, on the
 * grounds that putting it over something is then a deliberate choice.
 */
export function CopilotPanel() {
  const {
    messages,
    isThinking,
    sendMessage,
    approveProposal,
    rejectProposal,
    close,
    isMinimized,
    toggleMinimized,
    panelRef,
    position,
    isDragging,
    dragHandleProps,
    size,
    isResizing,
    isDefaultSize,
    resetPanel,
    resizeHandleProps,
  } = useCopilot();

  const hasBeenMoved = position !== null || !isDefaultSize;

  return (
    <div
      ref={panelRef}
      className={`copilot-panel ${isMinimized ? "is-minimized" : ""}`}
      style={{
        width: size.width,
        height: isMinimized ? "auto" : size.height,
        ...(position ? { left: position.left, top: position.top, bottom: "auto" } : {}),
      }}
    >
      {isMinimized ? null : (
        <span
          className={`copilot-resize-handle ${isResizing ? "is-resizing" : ""}`}
          aria-hidden="true"
          {...resizeHandleProps}
        />
      )}

      <div
        className={`copilot-header copilot-header-draggable ${isDragging ? "is-dragging" : ""}`}
        {...dragHandleProps}
      >
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-muted-foreground" />
          <span className="copilot-title">Copilot</span>
          {isMinimized ? null : <Badge variant="secondary">approval required</Badge>}
        </div>

        <div className="flex items-center gap-1">
          {hasBeenMoved && !isMinimized ? (
            <Button variant="ghost" size="sm" onClick={resetPanel}>
              Reset
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMinimized}
            aria-label={isMinimized ? "Expand the copilot" : "Minimise the copilot"}
          >
            {isMinimized ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={close} aria-label="Close copilot">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {isMinimized ? null : (
        <>
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
        </>
      )}
    </div>
  );
}
