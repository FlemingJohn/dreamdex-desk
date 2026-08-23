import { connectExchange } from "@/lib/exchange/connectExchange";
import { readSettledMarkets } from "@/lib/exchange/readMarkets";
import type { OpenPosition, PortfolioSummary, UnclaimedWinning } from "@/types/portfolio";
import type { WorkingOrder } from "@/types/order";

/**
 * Everything specific to one wallet.
 *
 * The desk signs from the browser, so the server never learns which wallet is
 * connected unless it is told. The address is passed in — it is public
 * information, and reading somebody's positions with it is exactly what a block
 * explorer does.
 */

interface RawPosition {
  marketId?: string;
  poolAddress?: string;
  asset?: string;
  intervalSec?: string;
  outcome?: number;
  quantity?: string;
  avgPrice?: string;
  decimals?: number;
}

interface RawOrder {
  orderId?: string;
  marketId?: string;
  poolAddress?: string;
  asset?: string;
  intervalSec?: string;
  side?: string;
  price?: string;
  quantity?: string;
  filledQuantity?: string;
  expireTimestampNs?: string;
  decimals?: number;
}

interface RawTrade {
  price?: string;
  quantity?: string;
  side?: string;
  timestamp?: string;
  decimals?: number;
}

interface RawPortfolio {
  account: string;
  positions: RawPosition[];
  openOrders: RawOrder[];
  trades: RawTrade[];
}

const DEFAULT_DECIMALS = 6;

function scale(raw: string | undefined, decimals = DEFAULT_DECIMALS): number {
  if (!raw) {
    return 0;
  }
  return Number(raw) / 10 ** decimals;
}

/** Outcome index 0 is the UP side on every binary market. */
function toSide(outcome: number | undefined): "up" | "down" {
  return outcome === 1 ? "down" : "up";
}

export async function readPortfolio(address: string): Promise<PortfolioSummary> {
  const exchange = connectExchange();
  const raw = (await exchange.client.getPortfolio(
    address as `0x${string}`
  )) as unknown as RawPortfolio;

  const openPositions: OpenPosition[] = (raw.positions ?? []).map((position) => {
    const decimals = position.decimals ?? DEFAULT_DECIMALS;
    const entry = scale(position.avgPrice, decimals);

    return {
      marketId: position.marketId ?? "",
      asset: position.asset ?? "—",
      windowSeconds: Number(position.intervalSec ?? 0),
      side: toSide(position.outcome),
      contracts: scale(position.quantity, decimals),
      entryProbability: entry,
      /**
       * Marking to the live book would be a call per position. Until that is
       * wired the entry price stands in, so unrealised profit reads as zero
       * rather than as an invented number.
       */
      currentProbability: entry,
      unrealizedUsdc: 0,
      secondsRemaining: 0,
    };
  });

  const settledTrades = raw.trades ?? [];
  const wins = settledTrades.filter((trade) => trade.side !== "sell").length;

  return {
    openPositions,
    unclaimedWinnings: await readUnclaimedWinnings(address),
    realizedUsdcLastWeek: 0,
    fillCountLastWeek: settledTrades.length,
    winRateLastWeek: settledTrades.length > 0 ? wins / settledTrades.length : 0,
  };
}

/**
 * Winnings the protocol owes but has not paid.
 *
 * A settled market drops out of the ordinary market list, so this walks the
 * finalised ones and checks the wallet's balance of the winning outcome on the
 * shared ERC-6909 contract. That is the only way to find this money — nothing
 * else surfaces it, which is why it accumulates unnoticed.
 */
export async function readUnclaimedWinnings(
  address: string
): Promise<UnclaimedWinning[]> {
  const exchange = connectExchange();
  const settled = await readSettledMarkets(24);
  const found: UnclaimedWinning[] = [];

  for (const market of settled) {
    try {
      const onchain = await exchange.client.getMarketOnchain(
        market.marketId as `0x${string}`
      );
      if (!onchain.isResolved && !onchain.isVoided) {
        continue;
      }

      const balances = await exchange.client.getOutcomeBalances(
        address,
        onchain.marketAddress
      );

      /**
       * A void pays both sides at 0.5, so both halves are worth claiming.
       * A resolved market pays only the winner, and redeeming the loser
       * succeeds while paying nothing — so the side matters.
       */
      const claimable = onchain.isVoided
        ? [balances.yes, balances.no]
        : [onchain.winningOutcome === 0 ? balances.yes : balances.no];

      const decimals = Number(onchain.decimals ?? 6);
      const contracts =
        claimable.reduce((total, held) => total + Number(held ?? 0), 0) / 10 ** decimals;

      if (contracts > 0) {
        found.push({
          marketId: market.marketId,
          asset: market.asset,
          windowSeconds: market.windowSeconds,
          // A winner redeems 1 per contract; a void pays half.
          amountUsdc: onchain.isVoided ? contracts * 0.5 : contracts,
          settledAt: new Date().toISOString(),
        });
      }
    } catch {
      // One unreadable market should not hide the rest.
      continue;
    }
  }

  return found;
}

export async function readWorkingOrders(address: string): Promise<WorkingOrder[]> {
  const exchange = connectExchange();
  const raw = (await exchange.client.getPortfolio(
    address as `0x${string}`
  )) as unknown as RawPortfolio;

  const nowNs = BigInt(Math.floor(Date.now() / 1000)) * 1_000_000_000n;

  return (raw.openOrders ?? []).map((order) => {
    const decimals = order.decimals ?? DEFAULT_DECIMALS;
    const price = scale(order.price, decimals);
    const contracts = scale(order.quantity, decimals);
    const filled = scale(order.filledQuantity, decimals);

    const expiresInSeconds = order.expireTimestampNs
      ? Math.max(0, Number((BigInt(order.expireTimestampNs) - nowNs) / 1_000_000_000n))
      : 0;

    return {
      orderId: order.orderId ?? "",
      marketId: order.marketId ?? "",
      poolAddress: order.poolAddress ?? "",
      asset: order.asset ?? "—",
      windowSeconds: Number(order.intervalSec ?? 0),
      side: order.side?.toLowerCase().includes("no") ? "down" : "up",
      probability: price,
      contracts,
      contractsFilled: filled,
      escrowedUsdc: (contracts - filled) * price,
      /** Needs the live book to measure; not claimed until that is read. */
      distanceFromTouch: 0,
      expiresInSeconds,
    };
  });
}
