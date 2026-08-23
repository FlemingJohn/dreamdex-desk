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

/**
 * One step the copilot took, shown so its answer can be checked.
 *
 * GPT-4o does not emit reasoning tokens the way an extended-thinking model
 * does, so there is no hidden monologue to reveal. What it does emit is a line
 * of narration alongside each tool call saying what it is about to look up, plus
 * the call and its result — and that trail *is* the reasoning. It is captured
 * here rather than discarded.
 */
export interface ToolCallRecord {
  /** Position in the sequence, so the order is legible. */
  step: number;
  name: string;
  status: ToolStatus;
  /** What the copilot said it was doing, when it said anything. */
  narration?: string;
  /** Arguments it passed, for the reader who wants to check them. */
  arguments?: Record<string, unknown>;
  /** A short description of what came back. */
  summary?: string;
  /** How long the call took, in milliseconds. */
  durationMs?: number;
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
