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
  "listWorkingOrders",
  "findEdge",
  "findStrandedFunds",
] as const;

export const WRITE_TOOL_NAMES = [
  "proposeTrade",
  "cancelOrders",
  "reduceOrder",
  "unblockMarket",
  "sweepVaults",
] as const;

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
      name: "listWorkingOrders",
      description:
        "The trader's orders resting on the book, with the collateral each has locked and how far it has drifted from the touch. An order far from the touch with nothing filled is holding funds it will not spend.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "findEdge",
      description:
        "Prices every open market against the calibration curve and returns the expected value per contract plus a recommended stake. Use this for any question about what is worth buying or how much to bet — it is the arithmetic behind the calibration chart.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "findStrandedFunds",
      description:
        "Money the protocol is holding but has not paid out: markets that finished without resolving because a settlement callback was missed, and payouts parked in a pool vault after delivery to a wallet failed. Nothing else surfaces either.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "cancelOrders",
      description:
        "Cancels resting orders and returns their locked collateral. Safe to run without asking — cancelling can only return funds, never spend them. Pass the ids from listWorkingOrders.",
      parameters: {
        type: "object",
        properties: {
          orderIds: {
            type: "array",
            items: { type: "string" },
            description: "Order ids to cancel.",
          },
        },
        required: ["orderIds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reduceOrder",
      description:
        "Shrinks a resting order to a smaller size, keeping its place in the price-time queue. Prefer this over cancelling and re-placing, which sends the order to the back of the queue.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Order to shrink." },
          newContracts: { type: "number", description: "New size in contracts." },
        },
        required: ["orderId", "newContracts"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "unblockMarket",
      description:
        "Pushes a finished market through to payout. Use pokeOracle when the oracle has answered but the market never caught up, and voidExpired once the settlement window lapsed with no answer at all. Anyone may call either, on any market, including ones the trader has no position in.",
      parameters: {
        type: "object",
        properties: {
          marketId: { type: "string", description: "Market id from findStrandedFunds." },
          remedy: {
            type: "string",
            enum: ["pokeOracle", "voidExpired"],
            description: "Which remedy the market needs, as reported by findStrandedFunds.",
          },
        },
        required: ["marketId", "remedy"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sweepVaults",
      description:
        "Withdraws payouts parked in pool vaults after a delivery to the wallet failed. Can only pay the trader, so it needs no approval.",
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
