import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

/**
 * The connection to Somnia Markets.
 *
 * Server-side only. Reads would be safe in a browser, but the same client is
 * used for writes, and the signing key must never be sent to one — so every
 * call goes through a route handler instead.
 *
 * Event contracts are reachable only through this SDK. The REST and WebSocket
 * APIs cover spot and have no event-contract endpoints at all.
 */

let cachedExchange: SomniaMarkets | null = null;

export function connectExchange(): SomniaMarkets {
  if (cachedExchange) {
    return cachedExchange;
  }

  cachedExchange = new SomniaMarkets({
    indexerUrl:
      process.env.SOMNIA_INDEXER_URL ?? "https://dev.smk.somnia.host/v1/graphql",
    chain: somniaShannon,
    wsRpcUrl:
      process.env.SOMNIA_WS_RPC_URL ?? "wss://api.infra.testnet.somnia.network/ws",
    addresses: SOMNIA_TESTNET_ADDRESSES,
    // Only present when the desk is allowed to sign. Reads work without it.
    privateKey: process.env.TRADING_PRIVATE_KEY as `0x${string}` | undefined,
  });

  return cachedExchange;
}

/** True when a key is configured, so writes can actually be sent. */
export function canSign(): boolean {
  return Boolean(process.env.TRADING_PRIVATE_KEY);
}

/**
 * Which venue to read.
 *
 * A deployment hosts several venues and the indexer mixes them together, so
 * everything has to be filtered by one. The ids move — both networks changed
 * theirs repeatedly — so this is configurable, and when it is unset the busiest
 * live venue is discovered at runtime rather than hardcoded.
 */
export function getConfiguredVenueId(): string | null {
  const configured = process.env.DREAMDEX_VENUE_ID;
  return configured && configured.length > 0 ? configured : null;
}
