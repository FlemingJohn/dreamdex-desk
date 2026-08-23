"use client";

import { useState } from "react";
import { Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUsdc } from "@/lib/format/formatUsdc";

interface FaucetResult {
  collateralUsdc: number;
  gasSomi: number;
}

/**
 * Claims test funds so a new wallet can trade.
 *
 * Otherwise this is a detour out of the app — a faucet site for gas, then a
 * contract call for the collateral — and it is the first thing that stops
 * someone trying the venue at all.
 */
export function FaucetButton() {
  const [isClaiming, setIsClaiming] = useState(false);
  const [result, setResult] = useState<FaucetResult | null>(null);

  async function claim() {
    setIsClaiming(true);
    try {
      const response = await fetch("/api/faucet", { method: "POST" });
      if (response.ok) {
        setResult((await response.json()) as FaucetResult);
      }
    } finally {
      setIsClaiming(false);
    }
  }

  if (result) {
    return (
      <span className="text-xs text-muted-foreground tabular-nums">
        +{formatUsdc(result.collateralUsdc)} · {result.gasSomi} SOMI
      </span>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={claim} disabled={isClaiming}>
      <Droplet className="size-4" />
      {isClaiming ? "Claiming..." : "Test funds"}
    </Button>
  );
}
