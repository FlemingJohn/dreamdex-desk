import { createPublicClient, erc20Abi, http } from "viem";
import { SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

/**
 * How much collateral a wallet actually holds.
 *
 * Sizing and the balance check both need this. Before it existed they used a
 * flat assumption, which is wrong in both directions: it blocks a funded trader
 * from taking a position they can afford, and it sizes a stake against money
 * that may not be there.
 *
 * The decimals are read from the token rather than assumed — Shannon runs 6 and
 * mainnet 18.
 */

let cachedClient: ReturnType<typeof createPublicClient> | null = null;

function getClient() {
  if (!cachedClient) {
    cachedClient = createPublicClient({
      chain: somniaShannon,
      transport: http(
        process.env.SOMNIA_RPC_URL ?? "https://dream-rpc.somnia.network"
      ),
    });
  }
  return cachedClient;
}

/**
 * Assumed when there is no wallet to read.
 *
 * Sizing has to produce something for the venue-wide edge panel, which is shown
 * before anyone connects. Kept modest so an unconnected visitor sees plausible
 * stakes rather than ones implying a balance they do not have.
 */
export const UNCONNECTED_BANKROLL_USDC = 500;

export async function readCollateralBalance(address?: string): Promise<number> {
  if (!address) {
    return UNCONNECTED_BANKROLL_USDC;
  }

  const token = SOMNIA_TESTNET_ADDRESSES.collateral as `0x${string}`;

  try {
    const client = getClient();
    const [raw, decimals] = await Promise.all([
      client.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      }),
      client.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "decimals",
      }),
    ]);

    return Number(raw) / 10 ** decimals;
  } catch {
    /**
     * A failed read must not silently become a large balance, or the checks
     * built on it would pass when they should not. Zero fails closed: the
     * approval card shows the shortfall rather than waving a trade through.
     */
    return 0;
  }
}
