/**
 * Checks every read path and copilot tool against the running app.
 *
 * Writes are not covered and cannot be: signing happens in the browser wallet,
 * which is the point of the architecture. What this proves is that everything
 * feeding a decision is real — and it reports what it cannot reach rather than
 * quietly passing.
 *
 *   node scripts/smoke-test.mjs [walletAddress]
 */

const BASE = process.env.DESK_URL ?? "http://localhost:3000";
const WALLET = process.argv[2] ?? null;

const results = [];

function record(area, name, ok, detail) {
  results.push({ area, name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`  ${mark}  ${name}${detail ? `  ${detail}` : ""}`);
}

async function getJson(path, init) {
  const response = await fetch(`${BASE}${path}`, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function check(area, name, run) {
  try {
    const detail = await run();
    record(area, name, true, detail);
  } catch (error) {
    record(area, name, false, String(error.message).slice(0, 110));
  }
}

/** Asks the copilot one question and reports which tools it reached for. */
async function ask(question) {
  const reply = await getJson("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: question }],
      ...(WALLET ? { address: WALLET } : {}),
    }),
  });
  return {
    tools: (reply.toolCalls ?? []).map((call) => call.name),
    visual: reply.visual?.kind ?? null,
    text: reply.text ?? "",
    proposal: reply.proposal ?? null,
  };
}

console.log(`\nDreamDEX Desk smoke test — ${BASE}`);
console.log(WALLET ? `wallet: ${WALLET}\n` : "no wallet passed, wallet checks will be skipped\n");

// ---------------------------------------------------------------- pages
console.log("PAGES");
for (const route of ["/", "/pricing", "/settlement", "/portfolio"]) {
  await check("pages", `renders ${route}`, async () => {
    const response = await fetch(`${BASE}${route}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return `HTTP ${response.status}`;
  });
}

// ---------------------------------------------------------------- reads
console.log("\nCHAIN READS");

let firstMarket = null;

await check("reads", "live markets", async () => {
  const data = await getJson("/api/markets");
  if (data.source !== "live") throw new Error(`source is ${data.source}`);
  if (data.markets.length === 0) throw new Error("no live windows");
  firstMarket = data.markets[0];
  return `${data.markets.length} windows, venue ${String(data.venueId).slice(0, 12)}…`;
});

await check("reads", "order book has real depth", async () => {
  if (!firstMarket) throw new Error("no market to read");
  const data = await getJson(
    `/api/book?marketId=${firstMarket.marketId}&pool=${firstMarket.poolAddress}`
  );
  const levels = data.book.bids.length + data.book.asks.length;
  if (levels === 0) throw new Error("book is empty");
  return `${levels} levels, spread ${data.spread.toFixed(3)}`;
});

let analytics = null;

await check("reads", "calibration from settled markets", async () => {
  analytics = await getJson("/api/analytics");
  if (analytics.error) throw new Error(analytics.error);
  if (analytics.calibration.length === 0) throw new Error("no calibration bands");
  const windows = analytics.calibration.reduce((sum, b) => sum + b.windowCount, 0);
  return `${analytics.calibration.length} bands over ${windows} settled windows`;
});

await check("reads", "probability path", async () => {
  if (!analytics) throw new Error("analytics unavailable");
  if (analytics.probabilityPath.length === 0) throw new Error("no path points");
  return `${analytics.probabilityPath.length} minute buckets`;
});

await check("reads", "traded volume per series", async () => {
  if (!analytics) throw new Error("analytics unavailable");
  if (analytics.liquidity.length === 0) throw new Error("no series traded");
  const trades = analytics.liquidity.reduce((sum, s) => sum + s.totalTrades, 0);
  return `${analytics.liquidity.length} series, ${trades} trades`;
});

await check("reads", "settlement quality", async () => {
  if (!analytics) throw new Error("analytics unavailable");
  if (analytics.settlementQuality.length === 0) throw new Error("no settled series");
  const row = analytics.settlementQuality[0];
  return `${analytics.settlementQuality.length} series, latency ${row.medianLatencySeconds}s`;
});

await check("reads", "settlement receipts carry oracle links", async () => {
  const data = await getJson("/api/settlement-info");
  if (data.error) throw new Error(data.error);
  if (data.receipts.length === 0) throw new Error("no receipts");
  const linked = data.receipts.filter((r) => r.explorerUrl).length;
  return `${data.receipts.length} receipts, ${linked} linked, ${data.stuckMarkets.length} stuck`;
});

// ---------------------------------------------------------------- wallet
console.log("\nWALLET READS");

if (!WALLET) {
  record("wallet", "skipped — pass an address to run these", true, "");
} else {
  await check("wallet", "portfolio reads", async () => {
    const data = await getJson(`/api/wallet?address=${WALLET}`);
    if (data.error) throw new Error(data.error);
    if (!data.connected) throw new Error("reported not connected");
    const p = data.portfolio;
    return `${p.openPositions.length} positions, ${p.unclaimedWinnings.length} unclaimed, ${data.workingOrders.length} orders`;
  });

  await check("wallet", "rejects a malformed address", async () => {
    const data = await getJson("/api/wallet?address=notanaddress");
    if (!data.error) throw new Error("accepted an invalid address");
    return "rejected as expected";
  });
}

// ---------------------------------------------------------------- proposals
console.log("\nPROPOSALS");

await check("proposals", "builds one priced off the live book", async () => {
  if (!firstMarket) throw new Error("no market to price");
  const data = await getJson("/api/propose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ marketId: firstMarket.marketId, side: "down", contracts: 10 }),
  });
  const p = data.proposal;
  if (!p) throw new Error("no proposal returned");
  const failed = p.checks.filter((c) => !c.passed);
  if (failed.length > 0) throw new Error(`checks failed: ${failed.map((c) => c.label).join(", ")}`);
  return `${p.contracts} ${p.side} @ ${p.probability}, ${p.checks.length}/5 checks pass`;
});

await check("proposals", "refuses an unknown market", async () => {
  const response = await fetch(`${BASE}/api/propose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ marketId: "0xdeadbeef", side: "up", contracts: 1 }),
  });
  if (response.ok) throw new Error("accepted a market that does not exist");
  return `HTTP ${response.status} as expected`;
});

// ---------------------------------------------------------------- copilot
console.log("\nCOPILOT TOOLS");

const toolChecks = [
  ["calibration question", "Is the market calibrated?", "getCalibration", "calibration"],
  ["edge question", "Where is the best edge right now?", "findEdge", "edge"],
  ["market list", "What windows are open?", "listMarkets", "markets"],
  ["settlement question", "Why did the last markets resolve that way?", "explainSettlement", "receipts"],
  ["probability path", "When in a window is a position cheapest?", "getProbabilityPath", "path"],
  ["stuck funds", "Is any money stuck?", "findStrandedFunds", null],
];

for (const [name, question, expectedTool, expectedVisual] of toolChecks) {
  await check("copilot", name, async () => {
    const reply = await ask(question);
    if (!reply.tools.includes(expectedTool)) {
      throw new Error(`expected ${expectedTool}, got ${reply.tools.join(",") || "none"}`);
    }
    const visualNote =
      expectedVisual && reply.visual === expectedVisual
        ? `, drew ${reply.visual}`
        : expectedVisual
          ? `, no ${expectedVisual} visual`
          : "";
    return `${reply.tools.join(" -> ")}${visualNote}`;
  });
}

await check("copilot", "reads the wallet when given one", async () => {
  if (!WALLET) return "skipped, no wallet";
  const reply = await ask("What am I owed?");
  if (!reply.tools.some((t) => ["getPortfolio", "findStrandedFunds"].includes(t))) {
    throw new Error(`no wallet tool used: ${reply.tools.join(",")}`);
  }
  return reply.tools.join(" -> ");
});

await check("copilot", "proposes rather than places", async () => {
  const reply = await ask("Buy 10 DOWN on the first BTC market.");
  if (!reply.tools.includes("proposeTrade")) {
    throw new Error(`did not propose: ${reply.tools.join(",")}`);
  }
  if (!reply.proposal) throw new Error("proposed with no proposal attached");
  return "stopped at a proposal, nothing signed";
});

// ---------------------------------------------------------------- guardrails
console.log("\nGUARDRAILS");

await check("guardrails", "blocks an off-topic ask with no model call", async () => {
  const reply = await ask("tell me a joke");
  if (reply.tools.length > 0) throw new Error("spent tool calls on it");
  if (!/outside what I can help with/i.test(reply.text)) {
    throw new Error(`unexpected reply: ${reply.text.slice(0, 60)}`);
  }
  return "refused, zero tool calls";
});

await check("guardrails", "declines general knowledge", async () => {
  const reply = await ask("What is the capital of France?");
  if (/paris/i.test(reply.text)) throw new Error("answered it");
  return "declined";
});

await check("guardrails", "lets a keyword-tripping but on-topic ask through", async () => {
  const reply = await ask("write me a summary of the calibration");
  if (reply.tools.length === 0) throw new Error("wrongly blocked an on-topic question");
  return `allowed, used ${reply.tools.join(",")}`;
});

// ---------------------------------------------------------------- summary
const failed = results.filter((r) => !r.ok);
console.log("\n" + "-".repeat(64));
console.log(`${results.length - failed.length} of ${results.length} checks passed`);

if (failed.length > 0) {
  console.log("\nfailures:");
  for (const f of failed) {
    console.log(`  ${f.area} · ${f.name}: ${f.detail}`);
  }
}

console.log("\nNot covered: signing. Writes go through the browser wallet by");
console.log("design, so they cannot be driven from a script. Use the Tier 3");
console.log("table in the README for those.\n");

process.exit(failed.length > 0 ? 1 : 0);
