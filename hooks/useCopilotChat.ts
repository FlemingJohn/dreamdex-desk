"use client";

import { useCallback, useState } from "react";
import type { ChatMessage } from "@/types/copilot";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text:
    "I can read the live markets, the calibration curve, your positions, and anything the protocol still owes you. " +
    "Ask me what is worth trading, or tell me to place something and I will show you the trade before anything is signed.",
};

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/**
 * Drives the copilot conversation.
 *
 * A trade never leaves this hook on its own. The chat endpoint can only return
 * a proposal, and reaching the chain requires a separate call that a person
 * triggers by pressing approve.
 */
export function useCopilotChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length === 0 || isThinking) {
        return;
      }

      const question: ChatMessage = { id: createMessageId(), role: "user", text: trimmed };
      setMessages((current) => [...current, question]);
      setIsThinking(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, question].map((message) => ({
              role: message.role,
              content: message.text,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(`Chat request failed with status ${response.status}`);
        }

        const reply = (await response.json()) as ChatMessage;
        setMessages((current) => [...current, { ...reply, id: createMessageId() }]);
      } catch {
        setMessages((current) => [
          ...current,
          {
            id: createMessageId(),
            role: "assistant",
            text: "I could not reach the copilot service. Check that the Azure credentials are set in .env.local, then try again.",
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [isThinking, messages]
  );

  const approveProposal = useCallback(async (messageId: string) => {
    const target = messages.find((message) => message.id === messageId);
    if (!target?.proposal) {
      return;
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, proposalOutcome: "approved" } : message
      )
    );

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal: target.proposal }),
      });
      const result = (await response.json()) as { transactionHash?: string };

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? { ...message, transactionHash: result.transactionHash }
            : message
        )
      );
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          text: "The trade was approved but could not be sent. Nothing was signed.",
        },
      ]);
    }
  }, [messages]);

  const rejectProposal = useCallback((messageId: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, proposalOutcome: "rejected" } : message
      )
    );
  }, []);

  return { messages, isThinking, sendMessage, approveProposal, rejectProposal };
}
