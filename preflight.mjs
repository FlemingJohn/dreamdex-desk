import { createPublicClient, http, erc20Abi, formatUnits } from "viem";
import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const YOU = "0xf0904aC69ECCA5e3ec5e69807B666f5EDd04e288";
const TUSDC = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E";
const rpc = createPublicClient({ chain: somniaShannon, transport: http("https://dream-rpc.somnia.network") });

const ex = new SomniaMarkets({
  indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
  chain: somniaShannon,
  wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
  addresses: SOMNIA_TESTNET_ADDRESSES,
});

// The market the app would offer first.
const live = await ex.client.listBinaryMarkets({
  venueId: "0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c",
  status: "Trading", orderBy: "newest", limit: 60,
});
const now = Math.floor(Date.now() / 1000);
const market = live.filter(m => Number(m.expiry) - now > 300).sort((a,b) => Number(b.tradeCount) - Number(a.tradeCount))[0];
const pool = market.poolAddress;

console.log("market:", market.asset, Number(market.intervalSec) + "s", "| pool", pool);
console.log("expires in", Number(market.expiry) - now, "seconds\n");

// What the app would price a 10-contract DOWN buy at.
const book = await ex.client.getBinaryOrderBook(pool);
const bestBid = book.yesBids?.[0] ? Number(book.yesBids[0].price) / 1e6 : null;
const bestAsk = book.yesAsks?.[0] ? Number(book.yesAsks[0].price) / 1e6 : null;
console.log("book: bestBid", bestBid, " bestAsk", bestAsk);

const downPrice = bestBid !== null ? 1 - bestBid : 0.5;
const snapped = Math.round(downPrice * 1000) / 1000;
const priceRaw = BigInt(Math.round(snapped * 1e6));
const qtyRaw = BigInt(10 * 1e6);
console.log("DOWN at", snapped, "-> raw", priceRaw.toString(), "| qty raw", qtyRaw.toString());
console.log("cost:", (snapped * 10).toFixed(2), "tUSDC\n");

// CHECK 1: allowance. The pool must be able to pull collateral.
const [balance, allowance] = await Promise.all([
  rpc.readContract({ address: TUSDC, abi: erc20Abi, functionName: "balanceOf", args: [YOU] }),
  rpc.readContract({ address: TUSDC, abi: erc20Abi, functionName: "allowance", args: [YOU, pool] }),
]);
console.log("tUSDC balance :", formatUnits(balance, 6));
console.log("allowance to pool:", formatUnits(allowance, 6));
if (allowance === 0n) console.log("  ^^ ZERO — the pool cannot pull collateral. An approve() is needed first.\n");
else console.log();

// CHECK 2: simulate the actual order.
const abi = [{
  type: "function", name: "placeBinaryOrder", stateMutability: "payable",
  inputs: [
    { name: "kind", type: "uint8" }, { name: "price", type: "uint256" },
    { name: "quantity", type: "uint256" }, { name: "expireTimestampNs", type: "uint64" },
    { name: "orderType", type: "uint8" }, { name: "selfMatchingOption", type: "uint8" },
    { name: "builder", type: "address" }, { name: "builderFeeBpsTimes1k", type: "uint96" },
    { name: "userData", type: "uint64" },
  ],
  outputs: [{ name: "success", type: "bool" }, { name: "id", type: "uint128" }],
}];

const expiry = BigInt(Math.floor(Date.now() / 1000) + 300) * 1_000_000_000n;
const BUY_NO = 2;

try {
  const sim = await rpc.simulateContract({
    address: pool, abi, functionName: "placeBinaryOrder",
    args: [BUY_NO, priceRaw, qtyRaw, expiry, 2, 0, "0x0000000000000000000000000000000000000000", 0n, 0n],
    account: YOU,
  });
  console.log("SIMULATION PASSED — the click would fill.");
  console.log("  returns:", JSON.stringify(sim.result, (_, v) => typeof v === "bigint" ? v.toString() : v));
} catch (e) {
  const raw = String(e.message ?? "");
  const sig = raw.match(/0x[0-9a-f]{8}/i);
  console.log("SIMULATION REVERTED");
  console.log("  signature:", sig ? sig[0] : "none");
  console.log("  ", String(e.shortMessage ?? raw).slice(0, 200));
}
process.exit(0);
