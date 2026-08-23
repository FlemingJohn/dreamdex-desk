"use client";

import { useMemo } from "react";
import { useWalletClient } from "wagmi";
import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

/**
 * An exchange bound to the connected wallet, for writing.
 *
 * Reads happen on the server, but writes cannot: the signing key lives in the
 * wallet extension and must never leave the browser. The SDK takes a wagmi
 * wallet client directly for exactly this — it signs through the wallet and
 * confirms off the chain's newHeads subscription.
 *
 * Returns null until a wallet is connected, so callers have to handle the
 * disconnected case rather than discovering it when a signature is requested.
 */
export function useExchange(): SomniaMarkets | null {
  const { data: walletClient } = useWalletClient();

  return useMemo(() => {
    if (!walletClient) {
      return null;
    }

    return new SomniaMarkets({
      indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
      chain: somniaShannon,
      wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
      addresses: SOMNIA_TESTNET_ADDRESSES,
      walletClient,
    });
  }, [walletClient]);
}
