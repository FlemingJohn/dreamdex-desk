"use client";

import { useState } from "react";
import { Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWriteActions } from "@/hooks/useWriteActions";

/**
 * Claims test collateral so a fresh wallet can trade.
 *
 * Otherwise this is a detour out of the app — a faucet site for gas, then a
 * contract call for the collateral — and it is the first thing that stops
 * someone trying the venue at all.
 */
export function FaucetButton() {
  const { canSign, claimTestFunds, pending } = useWriteActions();
  const [message, setMessage] = useState<string | null>(null);

  if (!canSign) {
    return null;
  }

  async function claim() {
    const outcome = await claimTestFunds();
    setMessage(outcome.message);
  }

  if (message) {
    return <span className="text-xs text-muted-foreground">{message}</span>;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={claim}
      disabled={pending === "faucet"}
    >
      <Droplet className="size-4" />
      {pending === "faucet" ? "Claiming..." : "Test funds"}
    </Button>
  );
}
