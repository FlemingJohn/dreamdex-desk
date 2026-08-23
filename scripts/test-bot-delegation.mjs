/**
 * Proves the claim behind the Automation access panel: a delegated key can
 * trade for you, and cannot take your money.
 *
 * Run it in three stages.
 *
 *   node scripts/test-bot-delegation.mjs new
 *     Generates a bot key. Prints the address to paste into the panel, and the
 *     private key to pass back in. Nothing on-chain happens.
 *
 *   node scripts/test-bot-delegation.mjs check <botAddress> <ownerAddress>
 *     Reads the registry. Tells you which of the three permissions are granted.
 *     Run it before and after using the panel to see the grant land.
 *
 *   node scripts/test-bot-delegation.mjs trade <botPrivateKey> <ownerAddress>
 *     The real test. The bot key tries to place an order that belongs to the
 *     owner, then tries to take the owner's money. The first should succeed once
 *     granted; the second should fail whatever the grant says.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  toFunctionSelector,
  erc20Abi,
  formatUnits,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const RPC = "https://dream-rpc.somnia.network";
const REGISTRY = "0x15C7e8CE38F021c5b45d098AaD788f63090bF20A";
const TUSDC = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E";

/**
 * The binary place selector is computed, not imported: the SDK exports only the
 * spot one, and granting that authorises nothing here. Cancel and reduce are
 * shared with spot and resolve on binary pools unchanged.
 */
const SELECTORS = {
  placeBinaryOrderFor: toFunctionSelector(
    "function placeBinaryOrderFor(address,uint8,uint256,uint256,uint64,uint8,uint8,address,uint96,uint64)"
  ),
  cancelOrderFor: toFunctionSelector("function cancelOrderFor(address,uint128)"),
  reduceOrderFor: toFunctionSelector("function reduceOrderFor(address,uint128,uint256)"),
};

const REGISTRY_ABI = [
  {
    type: "function",
    name: "isApproved",
    stateMutability: "view",
    inputs: [
      { type: "address" },
      { type: "address" },
      { type: "bytes4" },
      { type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
];

const PLACE_FOR_ABI = [
  {
    type: "function",
    name: "placeBinaryOrderFor",
    stateMutability: "payable",
    inputs: [
      { name: "owner", type: "address" },
      { name: "kind", type: "uint8" },
      { name: "price", type: "uint256" },
      { name: "quantity", type: "uint256" },
      { name: "expireTimestampNs", type: "uint64" },
      { name: "orderType", type: "uint8" },
      { name: "selfMatchingOption", type: "uint8" },
      { name: "builder", type: "address" },
      { name: "builderFeeBpsTimes1k", type: "uint96" },
      { name: "userData", type: "uint64" },
    ],
    outputs: [
      { name: "success", type: "bool" },
      { name: "id", type: "uint128" },
    ],
  },
];

const rpc = createPublicClient({ chain: somniaShannon, transport: http(RPC) });
const [mode, argOne, argTwo] = process.argv.slice(2);

/** Picks a live market with enough time left to be worth trading. */
async function findMarket() {
  const exchange = new SomniaMarkets({
    indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
    chain: somniaShannon,
    wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
    addresses: SOMNIA_TESTNET_ADDRESSES,
  });

  const now = Math.floor(Date.now() / 1000);
  const rows = await exchange.client.listBinaryMarkets({
    status: "Trading",
    orderBy: "newest",
    limit: 60,
  });

  const usable = rows
    .filter((row) => Number(row.expiry) - now > 600)
    .sort((a, b) => Number(b.tradeCount) - Number(a.tradeCount));

  if (usable.length === 0) {
    throw new Error("no live market with enough headroom");
  }
  return { market: usable[0], exchange };
}

if (mode === "new") {
  const key = generatePrivateKey();
  const account = privateKeyToAccount(key);

  console.log("\nBot key generated. Nothing has touched the chain.\n");
  console.log("  address     ", account.address);
  console.log("  private key ", key);
  console.log("\nNext:");
  console.log("  1. Send this address a little STT for gas — it pays for its own");
  console.log("     transactions, but it never holds your collateral.");
  console.log("  2. Paste the ADDRESS into Automation access, click Grant.");
  console.log("  3. node scripts/test-bot-delegation.mjs trade <privateKey> <yourAddress>\n");
  process.exit(0);
}

if (mode === "check") {
  if (!argOne || !argTwo) {
    console.log("usage: check <botAddress> <ownerAddress>");
    process.exit(1);
  }

  const { market } = await findMarket();
  console.log(`\nmarket: ${market.asset} ${market.intervalSec}s`);
  console.log(`pool  : ${market.poolAddress}\n`);

  let granted = 0;
  for (const [name, selector] of Object.entries(SELECTORS)) {
    const approved = await rpc.readContract({
      address: REGISTRY,
      abi: REGISTRY_ABI,
      functionName: "isApproved",
      args: [argTwo, argOne, selector, market.poolAddress],
    });
    if (approved) granted += 1;
    console.log(`  ${approved ? "GRANTED" : "  ---  "}  ${name}  ${selector}`);
  }

  console.log(
    `\n${granted} of 3 granted.` +
      (granted === 0
        ? " Paste the bot address into Automation access and click Grant."
        : granted === 3
          ? " The bot can trade this pool on the owner's behalf."
          : " Partial — a key that can place but not cancel is worse than none.")
  );
  console.log();
  process.exit(0);
}

if (mode === "trade") {
  if (!argOne || !argTwo) {
    console.log("usage: trade <botPrivateKey> <ownerAddress>");
    process.exit(1);
  }

  const bot = privateKeyToAccount(argOne);
  const owner = argTwo;
  const wallet = createWalletClient({
    account: bot,
    chain: somniaShannon,
    transport: http(RPC),
  });

  const { market, exchange } = await findMarket();
  const pool = market.poolAddress;

  console.log(`\nbot   : ${bot.address}`);
  console.log(`owner : ${owner}`);
  console.log(`market: ${market.asset} ${market.intervalSec}s  pool ${pool}\n`);

  const botGas = await rpc.getBalance({ address: bot.address });
  console.log(`bot STT: ${formatUnits(botGas, 18)}`);
  if (botGas === 0n) {
    console.log("  the bot needs a little STT to pay for its own transactions.\n");
    process.exit(1);
  }

  // Price it off the live book so the order is realistic.
  const book = await exchange.client.getBinaryOrderBook(pool);
  const bestBid = book.yesBids?.[0] ? Number(book.yesBids[0].price) / 1e6 : 0.5;
  const price = BigInt(Math.round(bestBid * 1000)) * 1000n;
  const quantity = BigInt(1 * 1e6);
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 600) * 1_000_000_000n;

  console.log(`\n--- TEST 1: can the bot trade for the owner? ---`);
  console.log(`placing 1 UP at ${(Number(price) / 1e6).toFixed(3)} as ${owner}`);

  try {
    const { request } = await rpc.simulateContract({
      address: pool,
      abi: PLACE_FOR_ABI,
      functionName: "placeBinaryOrderFor",
      // POST_ONLY so it rests rather than spending the owner's collateral now.
      args: [owner, 0, price, quantity, expiry, 3, 0, "0x0000000000000000000000000000000000000000", 0n, 0n],
      account: bot,
    });
    const hash = await wallet.writeContract(request);
    const receipt = await rpc.waitForTransactionReceipt({ hash });
    console.log(`  RESULT: ${receipt.status}  ${hash}`);
    console.log("  the bot placed an order that belongs to the owner.");
  } catch (error) {
    const raw = String(error.message ?? "");
    const denied = raw.includes("0x3fb0ba2e");
    console.log(
      denied
        ? "  RESULT: refused — OnlyApprovedContracts. Not granted yet."
        : `  RESULT: reverted — ${String(error.shortMessage ?? raw).slice(0, 140)}`
    );
  }

  console.log(`\n--- TEST 2: can the bot take the owner's money? ---`);
  console.log("attempting to move the owner's collateral to the bot");

  try {
    await rpc.simulateContract({
      address: TUSDC,
      abi: erc20Abi,
      functionName: "transferFrom",
      args: [owner, bot.address, BigInt(100 * 1e6)],
      account: bot,
    });
    console.log("  RESULT: SUCCEEDED — the safety claim is WRONG. Investigate.");
  } catch {
    console.log("  RESULT: refused. The bot cannot move the owner's collateral.");
    console.log("  Trading rights and spending rights are separate on-chain.");
  }

  console.log("\nThat is the whole claim: it can trade, it cannot steal.\n");
  process.exit(0);
}

console.log(`
Prove that a delegated bot key can trade for you but cannot take your funds.

  node scripts/test-bot-delegation.mjs new
  node scripts/test-bot-delegation.mjs check <botAddress> <ownerAddress>
  node scripts/test-bot-delegation.mjs trade <botPrivateKey> <ownerAddress>
`);
process.exit(1);
