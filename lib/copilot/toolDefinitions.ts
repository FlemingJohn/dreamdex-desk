import type { ChatCompletionTool } from "openai/resources/chat/completions";

/**
 * What the copilot is allowed to do.
 *
 * Read tools run the moment the model asks for them. Write tools are different:
 * proposeTrade does not place anything, it describes a trade for a person to
 * approve. That split is the entire safety model — the model has no path to the
 * chain, only a path to a proposal.
 */

export const READ_TOOL_NAMES = [
  "listMarkets",
  "getCalibration",
  "getProbabilityPath",
  "getLiquidity",
  "getSettlementQuality",
  "getPortfolio",
  "getOrderBook",
  "explainSettlement",
] as const;

export const WRITE_TOOL_NAMES = ["proposeTrade"] as const;

export type ReadToolName = (typeof READ_TOOL_NAMES)[number];
export type WriteToolName = (typeof WRITE_TOOL_NAMES)[number];

export const copilotTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "listMarkets",
      description:
        "Every event contract window currently open, with its opening price (the line), current probability, spread, depth, volume and seconds remaining.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "getCalibration",
      description:
        "The calibration curve across settled windows: what the market predicted against how often that side actually won. Use this to judge whether a price is fair.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "getProbabilityPath",
      description:
        "Average probability of the eventual winner at each minute of a window. Use this to judge when a position is cheapest, not which side to take.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "getLiquidity",
      description:
        "How trades crossed per series — mint-a-pair (two buyers, no seller) against genuine sellers — plus median depth and spread.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "getSettlementQuality",
      description:
        "Void rate, oracle source agreement and settlement latency per series. A void refunds both sides at 0.5.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "getPortfolio",
      description:
        "The trader's open positions, realised performance, and any winnings the protocol still owes them.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "getOrderBook",
      description:
        "Resting bids and asks for one market, quoted in Up terms. Use it to check whether a size can actually be filled before proposing a trade.",
      parameters: {
        type: "object",
        properties: {
          marketId: { type: "string", description: "Market id from listMarkets." },
        },
        required: ["marketId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "explainSettlement",
      description:
        "Why recently settled markets resolved the way they did — every price source the oracle asked, what each returned, the median, and how many had to agree. Use this whenever someone asks why they lost or whether a result was fair.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "proposeTrade",
      description:
        "Draw up a trade for the trader to approve. This does NOT place an order — it produces a proposal that a person must approve before anything is signed. Call it whenever the trader asks to buy or sell.",
      parameters: {
        type: "object",
        properties: {
          marketId: {
            type: "string",
            description: "Market id from listMarkets.",
          },
          side: {
            type: "string",
            enum: ["up", "down"],
            description: "Which side to buy.",
          },
          contracts: {
            type: "number",
            description: "How many contracts to buy.",
          },
          reasoning: {
            type: "string",
            description:
              "One or two sentences on why this trade, referencing the data you read.",
          },
        },
        required: ["marketId", "side", "contracts", "reasoning"],
      },
    },
  },
];
