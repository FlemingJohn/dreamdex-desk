/**
 * Copilot conversation shapes.
 *
 * The safety rule lives in these types: a write tool never returns a receipt,
 * it returns a TradeProposal. Nothing reaches the chain until a person presses
 * approve, so the model cannot move funds on its own.
 */

import type { Asset, Side, WindowSeconds } from "./market";

export type MessageRole = "user" | "assistant";

export type ToolStatus = "running" | "finished" | "failed";

/** Shown in the transcript as the copilot reads data. */
export interface ToolCallRecord {
  name: string;
  status: ToolStatus;
  summary?: string;
}

/** One safety check run before a trade is offered for approval. */
export interface ProposalCheck {
  label: string;
  passed: boolean;
  detail?: string;
}

/**
 * A trade the copilot wants to make. It is inert until approved — this object
 * describes the trade, it does not perform it.
 */
export interface TradeProposal {
  proposalId: string;
  marketId: string;
  /** The pool this market currently trades on, needed to sign. */
  poolAddress: string;
  asset: Asset;
  windowSeconds: WindowSeconds;
  side: Side;
  contracts: number;
  /** Price after snapping to the venue's tick grid. */
  probability: number;
  costUsdc: number;
  maxLossUsdc: number;
  maxGainUsdc: number;
  checks: ProposalCheck[];
}

export type ProposalOutcome = "pending" | "approved" | "rejected";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  toolCalls?: ToolCallRecord[];
  proposal?: TradeProposal;
  proposalOutcome?: ProposalOutcome;
  transactionHash?: string;
}
