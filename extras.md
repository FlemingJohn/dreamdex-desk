# DreamDEX Desk - Extra Features & Ideas

This document outlines high-impact features that can be built on top of the `@somnia-chain/markets-sdk` to give traders an edge and complete the hackathon submission.

## 1. Market Making Mode (Risk-Free Spread Capture)
**The Concept:** Event contracts only have two outcomes (Up or Down) that always equal 1 USDC combined. If the true price is 50/50, a trader can offer to buy "Up" for $0.49 and buy "Down" for $0.49.
**The Mechanics:** If an impatient trader buys the "Up" order and another buys the "Down" order, $0.98 is spent in total. The protocol automatically merges them into a complete 1 USDC set, guaranteeing a $0.02 profit with zero directional risk.
**The Feature:** A "Provide Liquidity" panel where the user sets a desired profit margin (e.g., 2%). The app automatically places resting limit orders on *both* sides of the book simultaneously. 

## 2. Live Streaming & Micro-Charts
**The Concept:** 15-minute markets move incredibly fast. Relying on API polling (refreshing data every 5 seconds) means traders are reacting to stale data.
**The Mechanics:** The `@somnia-chain/markets-sdk` provides WebSockets to instantly stream every trade, fill, and order book update.
**The Feature:** 
- A live-updating order book that flashes green/red as liquidity shifts.
- A **1-minute candlestick chart** tracking the probability of the contract. Traders can visually spot momentum (e.g., "Up" climbing from 40% to 60%) and jump in before the 15-minute window closes.

## 3. Auto-Compound & Rollovers
**The Concept:** Markets close every 15 minutes, requiring winners to manually run a claim function on the settled market to receive their USDC.
**The Mechanics:** Traders who want to maintain a continuous position (e.g., "BTC Up" for 2 hours) currently have to sit at their desk, wait for expiry, click claim, and re-buy 8 times in a row.
**The Feature:** An **"Auto-Roll"** toggle switch. The app listens for the settlement event in the background. If the trader wins, the app automatically claims the $1 USDC and immediately reinvests those winnings into the *exact same position* on the newly spawned 15-minute market.

## 4. Edge Snipping (Immediate-Or-Cancel)
**The Concept:** The SDK supports `IOC` (Immediate-Or-Cancel) orders, which attempt to buy immediately and cancel any unfilled portion so funds don't get stuck resting on the book.
**The Mechanics:** Human error often leads to mispriced contracts (e.g., listing an "Up" contract for $0.30 when the true mathematical value is $0.60).
**The Feature:** The AI Copilot constantly scans the live order book against the app's internal calibration model. If a massive positive edge is detected, the Copilot flashes a red **"SNIPE"** button in the UI. Clicking it fires an `IOC` order to instantly execute the trade before high-frequency bots can grab it.
