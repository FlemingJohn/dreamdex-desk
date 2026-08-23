"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCopilotChat } from "@/hooks/useCopilotChat";
import { useCopilotPanel } from "@/hooks/useCopilotPanel";
import { useDraggablePanel } from "@/hooks/useDraggablePanel";
import { usePanelSize } from "@/hooks/usePanelSize";
import type { ChatMessage, TradeProposal } from "@/types/copilot";
import type { Side } from "@/types/market";

type PanelGeometry = ReturnType<typeof useDraggablePanel> &
  ReturnType<typeof usePanelSize>;

interface CopilotContextValue extends PanelGeometry {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Collapsed to just its header, keeping the conversation. */
  isMinimized: boolean;
  toggleMinimized: () => void;
  /**
   * How much room the dashboard should leave on the right so the copilot is not
   * covering anything. Zero once the panel has been dragged away from its
   * corner, because at that point overlapping is the reader's own choice.
   */
  dashboardInset: number;
  resetPanel: () => void;
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

/** Gap between the panel and the content it should not be covering. */
const BREATHING_ROOM = 20;

/**
 * Shares one copilot between the dashboard and the panel.
 *
 * The panel's geometry lives here rather than inside the panel because the
 * dashboard needs it too: while the copilot sits in its corner the grid leaves
 * room for it, so opening the copilot moves content aside instead of hiding it.
 *
 * Both ways of acting also end up here. Whether a trade came from a buy button
 * or a sentence, it becomes the same proposal in the same transcript and waits
 * for the same approval — there is only ever one gate.
 */
export function CopilotProvider({ children }: { children: ReactNode }) {
  const { isOpen, open, close } = useCopilotPanel();
  const [isMinimized, setIsMinimized] = useState(false);
  const drag = useDraggablePanel();
  const panelSize = usePanelSize();
  const chat = useCopilotChat();
  const { addProposal, addNote, sendMessage } = chat;

  const toggleMinimized = useCallback(() => setIsMinimized((current) => !current), []);

  const resetPanel = useCallback(() => {
    drag.resetPosition();
    panelSize.resetSize();
  }, [drag, panelSize]);

  /**
   * Once the panel has been dragged it can be anywhere, so reserving space on
   * one edge would be guesswork. Minimised it is only a header, which nobody
   * needs the grid to dodge.
   */
  const isParkedInCorner = drag.position === null;
  const dashboardInset =
    isOpen && isParkedInCorner && !isMinimized
      ? panelSize.size.width + BREATHING_ROOM
      : 0;

  const proposeTrade = useCallback(
    async (marketId: string, side: Side, contracts: number, why: string) => {
      open();
      setIsMinimized(false);
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
      setIsMinimized(false);
      sendMessage(question);
    },
    [open, sendMessage]
  );

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      isMinimized,
      toggleMinimized,
      dashboardInset,
      resetPanel,
      ...drag,
      ...panelSize,
      ...chat,
      proposeTrade,
      askAbout,
    }),
    [
      askAbout,
      chat,
      close,
      dashboardInset,
      drag,
      isMinimized,
      isOpen,
      open,
      panelSize,
      proposeTrade,
      resetPanel,
      toggleMinimized,
    ]
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
