"use client";

import { PanelRightClose } from "lucide-react";
import { MessageInput } from "@/components/copilot/MessageInput";
import { MessageList } from "@/components/copilot/MessageList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCopilotChat } from "@/hooks/useCopilotChat";

const SUGGESTED_QUESTIONS = [
  "Anything worth trading right now?",
  "Is the market calibrated?",
  "What am I owed?",
];

interface CopilotPanelProps {
  onClose: () => void;
}

/**
 * The copilot, as a side panel rather than a floating bubble.
 *
 * It sits beside the data it talks about, so a claim like "windows priced this
 * high resolve up far less often" can be checked against the calibration panel
 * without leaving the screen.
 */
export function CopilotPanel({ onClose }: CopilotPanelProps) {
  const { messages, isThinking, sendMessage, approveProposal, rejectProposal } =
    useCopilotChat();

  return (
    <div className="copilot-panel">
      <div className="copilot-header">
        <div className="flex items-center gap-2">
          <span className="copilot-title">Copilot</span>
          <Badge variant="secondary">approval required</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Hide copilot">
          <PanelRightClose className="size-4" />
        </Button>
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
