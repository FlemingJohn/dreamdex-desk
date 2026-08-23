"use client";

import { useCallback, useState } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { erc20Abi } from "viem";

/**
 * The test-collateral token on Shannon. The venue's own faucet mints it.
 *
 * Six decimals here and eighteen on mainnet, which is why nothing in this app
 * hardcodes a scale — it reads decimals from the token.
 */
export const TEST_USDC_SHANNON = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E";

/** Enough gas for a handful of transactions. Below this, warn. */
const LOW_GAS_THRESHOLD = 0.05;

/**
 * Whether this wallet can actually trade yet.
 *
 * Two assets are needed and they come from different places: STT for gas, which
 * only an external faucet can give, and test collateral, which the venue mints.
 * The order matters — minting collateral is itself a transaction, so a wallet
 * with no STT cannot even claim the thing it needs. Reporting both balances is
 * the only way to make that legible before someone hits a failing prompt.
 */
export function useFundingStatus() {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);

  const { data: gas, refetch: refetchGas } = useBalance({ address });

  const { data: collateralRaw, refetch: refetchCollateral } = useReadContract({
    address: TEST_USDC_SHANNON,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: collateralDecimals } = useReadContract({
    address: TEST_USDC_SHANNON,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: Boolean(address) },
  });

  const gasAmount = gas ? Number(gas.value) / 10 ** gas.decimals : 0;
  const collateralAmount =
    collateralRaw !== undefined
      ? Number(collateralRaw) / 10 ** (collateralDecimals ?? 6)
      : 0;

  const copyAddress = useCallback(async () => {
    if (!address) {
      return;
    }
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked outright; the address is shown either way.
    }
  }, [address]);

  const refresh = useCallback(() => {
    void refetchGas();
    void refetchCollateral();
  }, [refetchCollateral, refetchGas]);

  return {
    address,
    isConnected,
    gasAmount,
    gasSymbol: gas?.symbol ?? "STT",
    collateralAmount,
    /** Nothing can be signed at all without gas — not even claiming collateral. */
    needsGas: isConnected && gasAmount < LOW_GAS_THRESHOLD,
    needsCollateral: isConnected && collateralAmount === 0,
    isReadyToTrade: isConnected && gasAmount >= LOW_GAS_THRESHOLD && collateralAmount > 0,
    copied,
    copyAddress,
    refresh,
  };
}
