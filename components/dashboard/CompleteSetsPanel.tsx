"use client";

import { useState } from "react";
import { PanelShell } from "@/components/dashboard/PanelShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLiveMarkets } from "@/hooks/useLiveMarkets";
import { useWriteActions } from "@/hooks/useWriteActions";
import { formatProbability } from "@/lib/format/formatProbability";
import { formatUsdc } from "@/lib/format/formatUsdc";
import { formatWindow } from "@/lib/format/formatWindow";

const DEFAULT_CONTRACTS = 10;

/**
 * Minting and merging complete sets, and selling a side once you hold one.
 *
 * One unit of collateral mints one Up and one Down. Exactly one of them pays out
 * at settlement, so a complete set is always worth exactly one — minting is a
 * swap rather than a bet, and merging reverses it.
 *
 * The reason to bother is narrower than it first appears. Quoting *both* sides
 * needs no inventory at all: two opposite-side buyers cross with no seller,
 * because the pool mints the pair from their combined collateral. What a
 * complete set unlocks is selling — you can only sell what you hold and there is
 * no naked short, so without one you can post bids and never an offer.
 *
 * The spread shown per market is what an offer would earn, which is the number
 * that decides whether any of this is worth the gas.
 */
export function CompleteSetsPanel() {
  const { tradingMarkets } = useLiveMarkets();
  const { canSign, pending, mintSet, burnSet, sellSide } = useWriteActions();
  const [contracts, setContracts] = useState(DEFAULT_CONTRACTS);
  const [message, setMessage] = useState<string | null>(null);

  const market = tradingMarkets[0];

  async function act(action: () => Promise<{ message: string }>) {
    const outcome = await action();
    setMessage(outcome.message);
  }

  return (
    <PanelShell
      id="complete-sets"
      title="Complete sets"
      description="Mint a matched pair so you can sell a side, or merge one back into collateral."
      headerExtra={
        market ? (
          <Badge variant="secondary">
            spread {formatProbability(market.spread)}
          </Badge>
        ) : null
      }
      askQuestion="Is the spread wide enough to be worth quoting an offer into?"
    >
      {!canSign ? (
        <p className="panel-note">
          Connect a wallet to mint, merge, or post an offer.
        </p>
      ) : !market ? (
        <p className="panel-note">No open market to work in right now.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="panel-metric-row">
            <span className="text-sm">
              <span className="font-medium">
                {market.asset} {formatWindow(market.windowSeconds)}
              </span>{" "}
              <span className="text-muted-foreground">
                up {formatProbability(market.upProbability)} · spread{" "}
                {formatProbability(market.spread)}
              </span>
            </span>

            <span className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={contracts}
                onChange={(event) =>
                  setContracts(Math.max(1, Number(event.target.value) || 1))
                }
                className="w-20"
                aria-label="Contracts"
              />
              <span className="panel-note">contracts</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={pending !== null}
              onClick={() => act(() => mintSet(market.poolAddress, contracts))}
            >
              Mint {contracts} pairs · {formatUsdc(contracts)}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null}
              onClick={() => act(() => burnSet(market.poolAddress, contracts))}
            >
              Merge back
            </Button>
          </div>

          <Separator />

          <div>
            <p className="panel-note mb-2">
              Holding a set, you can offer either side. Post-only, so the quote never
              pays the spread it is trying to earn.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pending !== null}
                onClick={() =>
                  act(() =>
                    sellSide(
                      market.poolAddress,
                      "up",
                      contracts,
                      market.upProbability + market.spread / 2
                    )
                  )
                }
              >
                Offer UP at{" "}
                {formatProbability(market.upProbability + market.spread / 2)}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending !== null}
                onClick={() =>
                  act(() =>
                    sellSide(
                      market.poolAddress,
                      "down",
                      contracts,
                      1 - market.upProbability + market.spread / 2
                    )
                  )
                }
              >
                Offer DOWN at{" "}
                {formatProbability(1 - market.upProbability + market.spread / 2)}
              </Button>
            </div>
          </div>

          {message ? <p className="panel-note">{message}</p> : null}
        </div>
      )}
    </PanelShell>
  );
}
