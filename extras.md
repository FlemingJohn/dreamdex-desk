# DreamDEX Desk - Bot Builder Architectures

This document outlines potential pathways for integrating a **Bot Builder** into the DreamDEX Desk platform. 

Adding an automated trading engine fundamentally changes the risk profile of the app. The core of DreamDEX Desk's current pitch is **human-in-the-loop safety** (two human acts between the AI model and any spent funds). A bot is the deliberate opposite. Therefore, the Bot Builder must be a clearly separate, explicitly opted-into mode equipped with strict risk limits and a global kill switch.

## The Architecture: Operator Session Keys
To trade while the user is away from the keyboard, the engine cannot rely on Wagmi for execution, as Wagmi requires a human to approve every signature prompt. Instead, we use the protocol's native **OperatorPermissionsRegistry**.

**The Honest Architecture:**
1. **Delegation:** The user's main wallet (cold wallet) signs a transaction granting a temporary "hot" key specific permissions (`placeOrderFor`, `cancelOrderFor`).
2. **Safety:** This hot operator key can trade on the user's behalf but is *structurally unable to withdraw funds*. Deposits, withdrawals, and redemptions remain strictly `msg.sender`-scoped to the cold owner wallet.
3. **Execution:** The background engine runs holding the hot operator key, executing automated trades seamlessly. 
4. **Revocation:** The user can instantly revoke the operator key's permissions at any time via a Kill Switch. 

*"The bot can trade but provably cannot steal."*

---

## Option 1: AI-Prompted Bots (Agentic Approach)
Leverage the existing copilot to allow users to build automated trading algorithms using natural language.

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
3. **Execution Engine:** A background process evaluates active rules against the live data stream. When triggered, it fires the transaction using the **delegated hot operator key**.

## Option 2: Visual "If-This-Then-That" (IFTTT) Panel
A more traditional, UI-driven approach for users who prefer strict visual configuration over chat prompts.

**The Workflow:**
1. **The Interface:** A new dashboard panel titled **"Automations"**.
2. **Rule Construction:** Users build logic trees using dropdowns:
   - **Trigger Metrics:** [Time Remaining, Liquidity Spread, Calibration Edge, Price, Void Rate]
   - **Operators:** [<, >, =, crosses above, crosses below]
   - **Actions:** [Market Buy, Snipe (IOC), Mint Set, Sell Inventory]
3. **Execution Engine:** Similar to the Agentic approach, these visual rules are compiled and evaluated every tick, executed seamlessly via the operator key.
