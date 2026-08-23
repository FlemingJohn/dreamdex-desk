"use client";

import { Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { SHANNON_CHAIN_ID } from "@/lib/wallet/wagmiConfig";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Connect, switch network, disconnect.
 *
 * Being on the wrong chain is called out rather than left to fail later: a
 * write signed against mainnet would simply revert, and the reason would not be
 * obvious from the error.
 */
export function ConnectWalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const injectedConnector = connectors[0];

  if (!isConnected) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isPending || !injectedConnector}
        onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      >
        <Wallet className="size-4" />
        {isPending ? "Connecting..." : "Connect wallet"}
      </Button>
    );
  }

  if (chainId !== SHANNON_CHAIN_ID) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => switchChain({ chainId: SHANNON_CHAIN_ID })}
      >
        Switch to Shannon
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => disconnect()} title="Disconnect">
      <Wallet className="size-4" />
      {address ? shortenAddress(address) : "Connected"}
    </Button>
  );
}
