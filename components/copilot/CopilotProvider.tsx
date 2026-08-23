"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useCopilotChat } from "@/hooks/useCopilotChat";
import { useCopilotPanel } from "@/hooks/useCopilotPanel";
import type { ChatMessage, TradeProposal } from "@/types/copilot";
import type { Side } from "@/types/market";

interface CopilotContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  messages: ChatMessage[];
  isThinking: boolean;
  sendMessage: (text: string) => void;
  approveProposal: (messageId: string) => void;
  rejectProposal: (messageId: string) => void;
  /** Act by pointing at a panel rather than typing. */
  proposeTrade: (marketId: string, side: Side, contracts: number, why: string) => void;
  /** Hand a panel's question to the copilot, already phrased. */
  askAbout: (question: string) => void;
}

const CopilotContext = createContext<CopilotContextValue | null>(null);

/**
 * Shares one copilot between the dashboard and the panel.
 *
 * Both ways of acting end up here. Whether a trade came from a buy button or a
 * sentence, it becomes the same proposal in the same transcript and waits for
 * the same approval — there is only ever one gate.
 */
export function CopilotProvider({ children }: { children: ReactNode }) {
  const { isOpen, open, close } = useCopilotPanel();
  const chat = useCopilotChat();
  const { addProposal, addNote, sendMessage } = chat;

  const proposeTrade = useCallback(
    async (marketId: string, side: Side, contracts: number, why: string) => {
      open();
      try {
        const response = await fetch("/api/propose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marketId, side, contracts }),
        });

        if (!response.ok) {
          addNote("That market is no longer open.");
          return;
        }

        const { proposal } = (await response.json()) as { proposal: TradeProposal };
        addProposal(proposal, why);
      } catch {
        addNote("I could not draw up that trade. Nothing was sent.");
      }
    },
    [addNote, addProposal, open]
  );

  const askAbout = useCallback(
    (question: string) => {
      open();
      sendMessage(question);
    },
    [open, sendMessage]
  );

  const value = useMemo(
    () => ({ isOpen, open, close, ...chat, proposeTrade, askAbout }),
    [askAbout, chat, close, isOpen, open, proposeTrade]
  );

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
}

export function useCopilot(): CopilotContextValue {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error("useCopilot must be used inside a CopilotProvider.");
  }
  return context;
}
