"use client";

import { useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { isAddress, type Address } from "viem";
import { PanelShell } from "@/components/dashboard/PanelShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useBotAccess } from "@/hooks/useBotAccess";
import { useLiveMarkets } from "@/hooks/useLiveMarkets";
import { formatWindow } from "@/lib/format/formatWindow";

/**
 * Letting a bot trade for you, without letting it touch your funds.
 *
 * A granted key can open, cancel and shrink your orders. It cannot deposit,
 * withdraw or redeem — the contracts keep those scoped to the owner whatever
 * the grant says, so a compromised bot key can churn your positions but never
 * move money out.
 *
 * The grant is per-pool rather than global. A global one silently extends to
 * every pool registered in future, which is more reach than a bot approved
 * today should inherit tomorrow.
 */
export function BotAccessPanel() {
  const { tradingMarkets } = useLiveMarkets();
  const [operatorInput, setOperatorInput] = useState("");

  const market = tradingMarkets[0];
  const pool = (market?.poolAddress ?? null) as Address | null;
  const operator = isAddress(operatorInput) ? (operatorInput as Address) : null;

  const { access, isBusy, message, canManage, grant, revoke } = useBotAccess(
    pool,
    operator
  );

  /** Partly granted is worth flagging loudly — see the hook for why. */
  const isPartial = access.grantedCount > 0 && !access.isGranted;

  return (
    <PanelShell
      id="bot-access"
      title="Automation access"
      description="Delegate trading to a bot key that cannot withdraw your funds."
      headerExtra={
        access.isGranted ? (
          <Badge>
            <ShieldCheck className="size-3" />
            granted
          </Badge>
        ) : isPartial ? (
          <Badge variant="destructive">
            {access.grantedCount} of {access.totalCount}
          </Badge>
        ) : (
          <Badge variant="secondary">
            <ShieldOff className="size-3" />
            not granted
          </Badge>
        )
      }
      askQuestion="What can a delegated bot key do on my behalf, and what can it not do?"
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="panel-note mb-2">
            The bot key. Grant it place, cancel and shrink on one market — it can
            manage its own orders and nothing else.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={operatorInput}
              onChange={(event) => setOperatorInput(event.target.value)}
              placeholder="0x… bot key address"
              className="max-w-xs font-mono"
              aria-label="Bot key address"
            />
            {market ? (
              <Badge variant="secondary">
                {market.asset} {formatWindow(market.windowSeconds)}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={!canManage || isBusy || access.isGranted}
            onClick={grant}
          >
            {isBusy ? "Signing..." : "Grant trading rights"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!canManage || isBusy || access.grantedCount === 0}
            onClick={revoke}
          >
            Revoke now
          </Button>
        </div>

        {isPartial ? (
          <p className="panel-note value-negative">
            Only part of the grant is in place. A key that can open orders but not
            cancel them leaves you as the only account able to pull a quote — grant
            the rest or revoke entirely.
          </p>
        ) : null}

        {message ? <p className="panel-note">{message}</p> : null}

        <Separator />

        <div className="flex flex-col gap-1">
          <p className="panel-note">
            <span className="side-up font-medium">The bot can</span> place, cancel and
            shrink orders that belong to you.
          </p>
          <p className="panel-note">
            <span className="side-down font-medium">The bot cannot</span> deposit,
            withdraw or redeem. Those stay scoped to your wallet on-chain, whatever
            this grant says.
          </p>
          <p className="panel-note">
            Revoking takes effect immediately and leaves resting orders alone, so it
            stops new activity without disturbing the book.
          </p>
        </div>
      </div>
    </PanelShell>
  );
}
