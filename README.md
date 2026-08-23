# DreamDEX Desk

Analytics and an approval-gated copilot for **DreamDEX event contracts** on Somnia.

Event contracts ask one question every fifteen minutes: does BTC or ETH close
the window at or above the price it opened at? There are no strike prices and no
leverage. Prices are probabilities between 0 and 1, and a winning contract pays
exactly 1 USDC.

The official app lets you take a side. It shows no volume, no history, no
portfolio, and no way to tell whether a price is any good. This fills that gap.

## What it measures

| Panel | Question it answers |
| --- | --- |
| Live markets | What is open right now, and how long is left? |
| Calibration | When the market says 65%, does it happen 65% of the time? |
| Probability path | When in a window is a position cheapest? |
| Liquidity | Is the volume real selling, or two buyers meeting? |
| Settlement quality | How often does this series void and refund both sides? |
| Your book | What do I hold, and what am I owed but have not claimed? |

**Calibration is the one that matters.** Settlement is oracle-driven and happens
on a schedule, so every window produces a labelled outcome — which makes it
possible to check whether the market's prices are honest. Nobody is currently
measuring this.

## The copilot

A side panel, not a help bubble. It reads the same data the dashboard shows and
can draw up trades.

The safety model is one rule, and it lives in the architecture rather than the
prompt:

- **Read tools** run the moment the model asks for them. They only look.
- **Write tools cannot reach the chain.** The model's only write tool produces a
  *proposal* — a description of a trade, with every safety check listed. Signing
  happens through a separate route that only a person pressing **Approve** can
  reach.

So no sequence of model output can move funds. The failed-check guard is
enforced on the server too, not just greyed out in the interface.

The copilot also carries the tribal knowledge that otherwise takes a week to
learn: prices snap to the tick grid before they are proposed, markets close to
expiry are refused, and settled markets are queried the one way that actually
finds unclaimed winnings.

## Running it

```bash
npm install
cp .env.example .env.local   # add your Azure OpenAI values
npm run dev
```

Open http://localhost:3000.

The app runs on **mock data** today, so it works with no wallet and no testnet
funds. Every mock lives in `lib/mock/` and is read through a hook in `hooks/`
— swapping in live chain data means changing those two layers and nothing else.

## Layout

```
app/                 pages and API routes (chat, execute)
components/
  dashboard/         the six analytics panels
  copilot/           side panel, transcript, approval card
  layout/            shell and header
  ui/                shadcn components
hooks/               one hook per data source
lib/
  copilot/           Azure client, tool definitions, proposal builder
  format/            probability, currency, countdown formatting
  mock/              stand-in data
styles/              layout, panels, copilot — kept out of components
types/               shared shapes
```

## Notes

- `.env.local` is gitignored. Never commit real credentials.
- Built against the DreamDEX docs, the `@somnia-chain/markets-sdk` package, and
  the dreamBot Kit's event-contract guide.
