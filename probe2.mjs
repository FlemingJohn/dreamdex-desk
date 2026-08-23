import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";

const ex = new SomniaMarkets({
  indexerUrl: "https://dev.smk.somnia.host/v1/graphql",
  chain: somniaShannon,
  wsRpcUrl: "wss://api.infra.testnet.somnia.network/ws",
  addresses: SOMNIA_TESTNET_ADDRESSES,
});

const VENUE = "0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c";

// Settled markets: do they carry the outcome AND the last price? That is
// everything calibration needs.
const settled = await ex.client.listBinaryMarkets({ venueId: VENUE, status: "Finalized", limit: 250 });
console.log("settled rows:", settled.length);
const usable = settled.filter(r => r.lastPrice !== null && r.winningOutcome !== null);
console.log("with price AND outcome:", usable.length);
if (usable[0]) {
  const r = usable[0];
  console.log("sample:", {
    asset: r.asset, intervalSec: r.intervalSec,
    lastPrice: r.lastPrice, quoteDecimals: r.quoteDecimals,
    winningOutcome: r.winningOutcome, voided: r.voided,
    payoutNumerators: r.payoutNumerators, payoutDenominator: r.payoutDenominator,
    tradeCount: r.tradeCount, cumulativeQuoteVolume: r.cumulativeQuoteVolume,
  });
}
const voided = settled.filter(r => r.voided === true);
console.log("voided:", voided.length, "of", settled.length);

// Candles for the probability path.
const live = await ex.client.listBinaryMarkets({ venueId: VENUE, status: "Trading", orderBy: "newest", limit: 20 });
const pool = live[0]?.poolAddress;
if (pool) {
  try {
    const candles = await ex.client.getCandles(pool, 60, { limit: 10 });
    console.log("\ncandles:", Array.isArray(candles) ? candles.length : typeof candles);
    if (Array.isArray(candles) && candles[0]) console.log(" sample:", JSON.stringify(candles[0]));
  } catch (e) { console.log("\ncandles FAILED:", String(e.message).slice(0,160)); }
}

// Fills, for liquidity mix.
if (pool) {
  try {
    const fills = await ex.client.getFills({ pool, limit: 10 });
    console.log("\nfills:", Array.isArray(fills) ? fills.length : typeof fills);
    if (Array.isArray(fills) && fills[0]) console.log(" keys:", Object.keys(fills[0]).join(", "));
    if (Array.isArray(fills) && fills[0]) console.log(" sample:", JSON.stringify(fills[0]).slice(0,400));
  } catch (e) { console.log("\nfills FAILED:", String(e.message).slice(0,160)); }
}
process.exit(0);
