import { toFunctionSelector, type Address, type Hex, type WalletClient } from "viem";

/**
 * Delegating trading rights to a bot, without giving it your funds.
 *
 * A granted operator can open, cancel and shrink orders that belong to you. It
 * cannot deposit, withdraw or redeem — those stay scoped to the owner on-chain,
 * so the key a bot runs on is structurally unable to take anything out. Revoking
 * is immediate and does not disturb orders already resting.
 *
 * None of this is reachable through the SDK for event contracts, which is why
 * the constants below are here rather than imported. Three gaps, all verified
 * against a live Shannon pool:
 *
 *   1. The registry address is absent from the SDK's address book.
 *   2. `placeBinaryOrderFor` has its own selector, and the SDK exports only the
 *      spot one. Granting the spot selector does not authorise the binary call.
 *   3. The grant helpers live under `dist/spot/`, and reject anything else.
 *
 * The mechanism itself is wired: simulating each of these functions from an
 * unauthorised caller reverts with `OnlyApprovedContracts`, which is the pool
 * asking the registry and being told no.
 */

/**
 * OperatorPermissionsRegistry on Shannon.
 *
 * Taken from the protocol documentation — the SDK's `SOMNIA_TESTNET_ADDRESSES`
 * does not carry it.
 */
export const OPERATOR_REGISTRY_SHANNON: Address =
  "0x15C7e8CE38F021c5b45d098AaD788f63090bF20A";

/**
 * Placing on someone's behalf on a binary pool.
 *
 * Computed rather than imported: the binary function takes a different argument
 * list from the spot one, so it has a different selector, and the SDK exports
 * only `placeOrderFor` at `0x80054449`. Granting that one authorises nothing
 * here.
 */
export const PLACE_BINARY_ORDER_FOR = toFunctionSelector(
  "function placeBinaryOrderFor(address,uint8,uint256,uint256,uint64,uint8,uint8,address,uint96,uint64)"
);

/**
 * Cancelling and shrinking are shared with spot — the binary pool extends the
 * same matching engine, and both selectors resolve on it. Confirmed by
 * simulation: each reverts with the authorisation error rather than as a missing
 * function.
 */
export const CANCEL_ORDER_FOR = toFunctionSelector(
  "function cancelOrderFor(address,uint128)"
);
export const REDUCE_ORDER_FOR = toFunctionSelector(
  "function reduceOrderFor(address,uint128,uint256)"
);

/**
 * What a trading bot needs and no more.
 *
 * Placing alone would be reckless: the bot could open positions and have no way
 * to close them, leaving the owner as the only account able to pull a quote.
 * Cancelling and shrinking are what let it manage its own risk.
 *
 * Deliberately excluded is anything that moves money. There is no selector here
 * for depositing, withdrawing or redeeming, because the contracts keep those
 * scoped to the owner regardless.
 */
export const TRADING_BOT_SELECTORS: readonly Hex[] = [
  PLACE_BINARY_ORDER_FOR,
  CANCEL_ORDER_FOR,
  REDUCE_ORDER_FOR,
];

const REGISTRY_ABI = [
  {
    type: "function",
    name: "setOperatorApprovalForPool",
    stateMutability: "nonpayable",
    inputs: [
      { name: "pool", type: "address" },
      { name: "operator", type: "address" },
      { name: "selectors", type: "bytes4[]" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isApproved",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" },
      { name: "selector", type: "bytes4" },
      { name: "pool", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export { REGISTRY_ABI };

interface GrantParams {
  walletClient: WalletClient;
  /** The pool the bot may trade. Kept narrow on purpose — see below. */
  pool: Address;
  /** The hot key the bot runs on. */
  operator: Address;
  approved: boolean;
}

/**
 * Grants or revokes a bot's trading rights on one pool.
 *
 * Per-pool rather than global, which is the tighter of the two options the
 * registry offers. A global grant auto-extends to pools registered in future,
 * and a bot should not gain reach over venues that did not exist when it was
 * approved.
 *
 * Revoking is the same call with `approved: false`. It takes effect immediately
 * and leaves resting orders alone, so a kill switch stops new activity without
 * disturbing what is already on the book.
 */
export async function setBotTradingRights({
  walletClient,
  pool,
  operator,
  approved,
}: GrantParams): Promise<Hex> {
  const account = walletClient.account;
  if (!account) {
    throw new Error("No account on the wallet client.");
  }

  return walletClient.writeContract({
    address: OPERATOR_REGISTRY_SHANNON,
    abi: REGISTRY_ABI,
    functionName: "setOperatorApprovalForPool",
    args: [pool, operator, TRADING_BOT_SELECTORS, approved],
    account,
    chain: walletClient.chain,
  });
}
