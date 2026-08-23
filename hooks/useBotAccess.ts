"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient, useWalletClient } from "wagmi";
import type { Address } from "viem";
import {
  OPERATOR_REGISTRY_SHANNON,
  REGISTRY_ABI,
  TRADING_BOT_SELECTORS,
  setBotTradingRights,
} from "@/lib/wallet/operatorGrants";

export interface BotAccessState {
  /** True when every selector the bot needs is granted. */
  isGranted: boolean;
  /** How many of the three are granted, so a partial state is visible. */
  grantedCount: number;
  totalCount: number;
}

/**
 * Whether a bot key may trade on your behalf, and the switch that decides it.
 *
 * Each selector is checked separately rather than assumed, because a partial
 * grant is a genuinely dangerous state: a key that can place but not cancel
 * would open positions the owner alone can close. Showing the count makes that
 * visible instead of reporting a misleading "on".
 */
export function useBotAccess(pool: Address | null, operator: Address | null) {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const owner = walletClient?.account?.address;

  /**
   * Each selector is read separately rather than assumed, because a partial
   * grant is a genuinely dangerous state: a key that can place but not cancel
   * opens positions only the owner can close.
   */
  const { data: access, refetch } = useQuery({
    queryKey: ["botAccess", owner, operator, pool],
    enabled: Boolean(publicClient && owner && operator && pool),
    queryFn: async (): Promise<BotAccessState> => {
      const results = await Promise.all(
        TRADING_BOT_SELECTORS.map((selector) =>
          publicClient!.readContract({
            address: OPERATOR_REGISTRY_SHANNON,
            abi: REGISTRY_ABI,
            functionName: "isApproved",
            args: [owner!, operator!, selector, pool!],
          })
        )
      );
      const grantedCount = results.filter(Boolean).length;
      return {
        isGranted: grantedCount === TRADING_BOT_SELECTORS.length,
        grantedCount,
        totalCount: TRADING_BOT_SELECTORS.length,
      };
    },
  });

  const setRights = useCallback(
    async (approved: boolean) => {
      if (!walletClient || !pool || !operator) {
        setMessage("Connect a wallet and pick a market first.");
        return;
      }

      setIsBusy(true);
      try {
        const hash = await setBotTradingRights({
          walletClient,
          pool,
          operator,
          approved,
        });
        setMessage(
          approved
            ? `Granted. The bot can trade this market and nothing else. ${hash.slice(0, 10)}…`
            : `Revoked. Resting orders are untouched. ${hash.slice(0, 10)}…`
        );
        await refetch();
      } catch (error) {
        const raw = (error as Error).message ?? "";
        const rejected = /reject|denied|user cancel/i.test(raw);
        setMessage(
          rejected ? "You rejected the signature." : raw.slice(0, 160)
        );
      } finally {
        setIsBusy(false);
      }
    },
    [operator, pool, refetch, walletClient]
  );

  return {
    access:
      access ?? {
        isGranted: false,
        grantedCount: 0,
        totalCount: TRADING_BOT_SELECTORS.length,
      },
    isBusy,
    message,
    canManage: Boolean(walletClient && pool && operator),
    grant: () => setRights(true),
    revoke: () => setRights(false),
    refresh: refetch,
  };
}
