# DreamDEX Desk - Bot Builder Architectures

This document outlines two potential pathways for integrating a **Bot Builder** into the DreamDEX Desk platform. Currently, the AI Copilot acts as an *advisor* (proposing trades that require manual approval). A Bot Builder would evolve the platform into an automated trading engine, aligning perfectly with the hackathon's focus on AI-agentic applications.

## Option 1: AI-Prompted Bots (Agentic Approach)
Leverage the existing Azure OpenAI copilot to allow users to build automated trading algorithms using natural language.

**The Workflow:**
1. **User Prompt:** "Create a bot that buys 10 UP contracts whenever my Calibration 'Edge' is greater than 3%."
2. **AI Translation:** The Copilot parses the intent and generates a standardized JSON rule set:
   ```json
   {
     "id": "bot-001",
     "condition": { "metric": "edge", "operator": ">", "value": 0.03 },
     "action": { "type": "buy", "side": "up", "size": 10 }
   }
   ```
3. **Execution Engine:** A background React hook (or Node.js worker) continuously subscribes to the `@somnia-chain/markets-sdk` WebSockets. Every second, it evaluates the active JSON rules against the live data.
4. **Execution:** When a condition is met, the engine automatically fires the transaction via Wagmi, allowing the user to trade while away from the keyboard.

## Option 2: Visual "If-This-Then-That" (IFTTT) Panel
A more traditional, UI-driven approach for users who prefer strict visual configuration over chat prompts.

**The Workflow:**
1. **The Interface:** A new dashboard panel titled **"Automations"**.
2. **Rule Construction:** Users build logic trees using dropdowns:
   - **Trigger Metrics:** [Time Remaining, Liquidity Spread, Calibration Edge, Price, Void Rate]
   - **Operators:** [<, >, =, crosses above, crosses below]
   - **Actions:** [Market Buy, Snipe (IOC), Mint Set, Sell Inventory]
3. **Example Rule:** `IF [Time Remaining] < [5 mins] AND [Price of UP] < [0.20], THEN [Buy 50 UP]`
4. **Execution Engine:** Similar to the Agentic approach, these visual rules are compiled into a config object and evaluated every tick against the live market data stream.

## Why Build This?
Adding a Bot Builder dramatically increases the project's **Business & Ecosystem Impact** score. It transitions the application from a read-only analytics terminal into an automated wealth-generation tool that continuously drives volume to the DreamDEX smart contracts.
