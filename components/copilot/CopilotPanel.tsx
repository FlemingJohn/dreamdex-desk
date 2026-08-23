"use client";

import { X } from "lucide-react";
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
 * The copilot, floating over the dashboard from its launcher.
 *
 * It sits on top of the data it talks about rather than beside it, so a claim
 * like "windows priced this high resolve up far less often" can still be
 * checked against the calibration panel — close the copilot and it is there.
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
          <X className="size-4" />
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
