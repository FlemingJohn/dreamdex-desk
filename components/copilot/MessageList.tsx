"use client";

import { useEffect, useRef } from "react";
import { ApprovalCard } from "@/components/copilot/ApprovalCard";
import { CopilotVisual } from "@/components/copilot/CopilotVisual";
import { ReasoningTrail } from "@/components/copilot/ReasoningTrail";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/types/copilot";

interface MessageListProps {
  messages: ChatMessage[];
  isThinking: boolean;
  onApprove: (messageId: string) => void;
  onReject: (messageId: string) => void;
}

/** The transcript, scrolled to the newest message as it arrives. */
export function MessageList({
  messages,
  isThinking,
  onApprove,
  onReject,
}: MessageListProps) {
  const bottomAnchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomAnchor.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <ScrollArea className="copilot-transcript">
      <div className="copilot-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user" ? "copilot-message-user" : "copilot-message-assistant"
            }
          >
            <div className="copilot-message-role">
              {message.role === "user" ? "You" : "Copilot"}
            </div>

            {message.toolCalls && message.toolCalls.length > 0 ? (
              <ReasoningTrail toolCalls={message.toolCalls} />
            ) : null}

            {message.visual ? <CopilotVisual visual={message.visual} /> : null}

            <p className="copilot-message-text">{message.text}</p>

            {message.proposal ? (
              <ApprovalCard
                proposal={message.proposal}
                outcome={message.proposalOutcome}
                transactionHash={message.transactionHash}
                onApprove={() => onApprove(message.id)}
                onReject={() => onReject(message.id)}
              />
            ) : null}
          </div>
        ))}

        {isThinking ? (
          <div className="copilot-message-assistant">
            <div className="copilot-message-role">Copilot</div>
            <p className="copilot-message-text text-muted-foreground">Reading the market...</p>
          </div>
        ) : null}

        <div ref={bottomAnchor} />
      </div>
    </ScrollArea>
  );
}
