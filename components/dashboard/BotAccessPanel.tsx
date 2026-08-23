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
 * Letting a bot trade one window for you, without letting it touch your funds.
 *
 * A granted key can open, cancel and shrink your orders. It cannot deposit,
 * withdraw or redeem — the contracts keep those scoped to the owner whatever the
 * grant says, so a compromised bot key can churn your positions but never move
 * money out. That half of the claim is solid.
 *
 * The reach is narrower than "automation" suggests, and the panel says so.
 * Grants are per-pool because binary pools are absent from the registry a global
 * grant checks against, and a binary pool is recycled between windows — so the
 * address being granted will later serve a different market. One window of
 * autonomy, then another signature.
 *
 * That is worth stating plainly rather than implying a bot can be left running.
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
            The bot key. It gets place, cancel and shrink on the one window named
            below — enough to manage its own orders, and nothing else.
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

        <p className="panel-note">
          {market
            ? `Granting for ${market.asset} ${formatWindow(market.windowSeconds)}, which closes in about ${Math.round(market.secondsRemaining / 60)} minutes. When it does, the pool is reused by a different market and this grant no longer follows your series — you would grant again.`
            : "No open window to grant against."}
        </p>

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
          <p className="panel-note">
            <span className="font-medium">Scope</span> is one pool. Binary pools are
            not in the registry a venue-wide grant checks, so there is no way to
            cover a whole rolling series in one signature.
          </p>
        </div>
      </div>
    </PanelShell>
  );
}
