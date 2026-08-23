import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatProbability } from "@/lib/format/formatProbability";
import { formatUsdc } from "@/lib/format/formatUsdc";
import type { TradeProposal, ProposalOutcome } from "@/types/copilot";

interface ApprovalCardProps {
  proposal: TradeProposal;
  outcome?: ProposalOutcome;
  transactionHash?: string;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * The only place in the product where money is authorised to move.
 *
 * The copilot cannot sign anything. It produces this proposal and stops; the
 * trade reaches the chain only when a person presses approve. Every check the
 * copilot ran is listed so the decision is made on visible evidence rather
 * than trust.
 */
export function ApprovalCard({
  proposal,
  outcome = "pending",
  transactionHash,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const isPending = outcome === "pending";
  const everyCheckPassed = proposal.checks.every((check) => check.passed);

  return (
    <div className="approval-card">
      <div className="approval-card-header">Approval required</div>

      <div className="approval-card-body">
        <p className="approval-summary">
          Buy {proposal.contracts}{" "}
          <span className={proposal.side === "up" ? "side-up" : "side-down"}>
            {proposal.side.toUpperCase()}
          </span>{" "}
          · {proposal.asset} {proposal.windowLength}
        </p>

        <div className="approval-figures">
          <span className="approval-figure-label">Price</span>
          <span>{formatProbability(proposal.probability)}</span>

          <span className="approval-figure-label">Cost</span>
          <span>{formatUsdc(proposal.costUsdc)}</span>

          <span className="approval-figure-label">Max loss</span>
          <span>{formatUsdc(proposal.maxLossUsdc)}</span>

          <span className="approval-figure-label">Max gain</span>
          <span>{formatUsdc(proposal.maxGainUsdc)}</span>
        </div>

        <div className="approval-checks">
          {proposal.checks.map((check) => (
            <div className="approval-check-row" key={check.label}>
              {check.passed ? (
                <Check className="size-3 approval-check-passed" />
              ) : (
                <X className="size-3 approval-check-failed" />
              )}
              <span>{check.label}</span>
              {check.detail ? (
                <span className="text-muted-foreground">{check.detail}</span>
              ) : null}
            </div>
          ))}
        </div>

        {isPending ? (
          <div className="approval-actions">
            <Button variant="outline" size="sm" onClick={onReject}>
              Reject
            </Button>
            <Button size="sm" onClick={onApprove} disabled={!everyCheckPassed}>
              Approve and sign
            </Button>
          </div>
        ) : null}
      </div>

      {outcome === "rejected" ? (
        <div className="approval-settled">Rejected. Nothing was signed.</div>
      ) : null}

      {outcome === "approved" ? (
        <div className="approval-settled">
          {transactionHash ? `Sent · ${transactionHash}` : "Signing..."}
        </div>
      ) : null}
    </div>
  );
}
