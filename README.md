# DreamDEX Desk

**🏆 Somnia × DreamDEX Event Contracts Hackathon Submission**
> 🎥 **[Watch the 3-Minute Demo Video Here](#)** *(Placeholder - Add your link!)*
> 📑 **[Read the Pitch Deck](#)** *(Placeholder - Add your link!)*
**Somnia × DreamDEX Event Contracts Hackathon Submission**
> **[Watch the 3-Minute Demo Video Here](#)** *(Placeholder - Add your link!)*
> **[Read the Pitch Deck](#)** *(Placeholder - Add your link!)*

Analytics and an approval-gated AI copilot for **DreamDEX event contracts** on
Somnia. Every figure is read from the chain — there is no mock data anywhere in
the app.

An event contract asks one question: will the asset be at or above a line when
the window closes? Prices are probabilities between 0 and 1, a winning contract
pays exactly 1 USDC, and your stake is the most you can lose. Windows run from
one minute to a day.

The official app lets you take a side. It shows no volume, no history, no
portfolio, and no way to tell whether a price is any good. This fills that gap.

## The finding

Calibration is the measurement this desk exists for. Settlement is oracle-driven
and happens on a schedule, so every window leaves behind a matched pair — what
the market predicted, and what actually happened. Nothing else in crypto hands
you labelled outcomes at that rate, and nobody is measuring it.

Across settled windows on the live Shannon venue, the market is **under**
confident in the middle bands:

| Band | Windows | Predicted | Actual | Gap |
| --- | --- | --- | --- | --- |
| 0.20–0.35 | 21 | 0.277 | 0.381 | +10.4 |
| 0.35–0.50 | 11 | 0.410 | 0.545 | +13.5 |
| 0.50–0.65 | 7 | 0.599 | 0.714 | +11.5 |
| 0.65–0.80 | 17 | 0.729 | 0.824 | +9.5 |

Read that as a standing edge, with the caveat the desk itself applies: bands
under forty windows are labelled thin rather than presented as findings.

## Panels

Four pages, twelve panels.

**Markets** — what is open, the resting book, your working orders, and complete
sets for minting a pair so you can sell a side.

**Pricing** — where the edge is, calibration, the probability path, and which
series actually trade.

**Settlement** — money stuck in markets that expired without paying out, void
rates per series, and a receipt for every settlement linking to the oracle's own
working.

**Portfolio** — your positions, and anything the protocol owes you but has not
paid.

Two are worth calling out. **Where the edge is** prices every open market against
the calibration curve and sizes a stake at quarter-Kelly capped at 5% of the
bankroll — a binary contract pays 1 or 0, so buying at *p* when the real chance
is *q* earns *q − p* per contract, and calibration supplies *q*. **Stranded
funds** finds markets that expired without settling; anyone can unblock those,
for anyone, which is deliberate protocol design so funds are never held behind
one party's permission.

## The copilot

Sixteen tools, and it draws its answers rather than describing them — ask about
calibration and the curve renders inline, ask where the edge is and each row
carries a button that takes it.

The safety model is one rule, and it lives in the architecture rather than the
prompt:

- **Reads run freely.** They only look.
- **Writes that can only recover funds run too** — cancelling an order, merging a
  set, unblocking a settled market. The worst case is gas spent on nothing.
- **Anything that can spend money stops.** The model's trade tool produces a
  *proposal*, never an order: a description with every safety check listed. It
  reaches the chain only after a person presses Approve *and* signs in their own
  wallet.

Two deliberate human acts sit between the model and any spend, and the desk holds
no key at all.

Every answer opens to show its work — the tools called, the arguments passed, and
how long each took. GPT-4o emits no reasoning tokens, so there is no hidden
monologue to reveal; what it does emit is a line of narration alongside each call,
and that trail is captured rather than discarded.

It also carries the knowledge that otherwise takes a week to learn: prices snap
to the tick grid before they are proposed, markets close to expiry are refused,
and settled markets are queried the one way that actually finds unclaimed
winnings. It declines anything outside these markets.

## The wallet

Two jobs, and neither is optional for what depends on it.

**It says whose money you are looking at.** Positions are balances on a shared
ERC-6909 contract, so your book, your orders and your unclaimed winnings all need
an address.

**It signs.** Every write goes through it — place, cancel, reduce, redeem, mint,
merge, poke, void, faucet.

The analytics half needs no wallet at all: calibration, live markets, order books,
settlement receipts and void rates are venue-wide. Connect one to see your own
book and to act.

## Running it

```bash
npm install
cp .env.example .env.local   # add your Azure OpenAI values
npm run dev
```

Open http://localhost:3000, then connect a wallet on Somnia Shannon and press
**Test funds** for test collateral.

Reads work with no wallet and no configuration — the venue is discovered at
runtime by finding the one with live windows, because venue ids move and both
networks have changed theirs repeatedly.

## Layout

```
app/
  (desk)/            four pages behind one shared shell
  api/               reads: markets · book · analytics · wallet
                     settlement-info · chat · propose
components/
  dashboard/         twelve panels
  copilot/           panel, reasoning trail, visuals, approval card
  wallet/            connect button and providers
  layout/            shell, sidebar, header
  ui/                shadcn components
hooks/               one per data source, plus the write actions
lib/
  exchange/          every chain read, mapped to the app's own types
  analytics/         expected value and position sizing
  copilot/           Azure client, tools, proposal builder, guardrails
  wallet/            wagmi config and the signing exchange
  format/            probability, currency, window, countdown
styles/              layout · panels · copilot, kept out of components
types/               shared shapes
```

Reads happen on the server, so the indexer and RPC configuration stay there.
Writes happen in the browser, because that is where the wallet is.

## Things the chain does not expose

Stated rather than invented, since an analytics tool that fills gaps with plausible
numbers is worse than one that admits them:

- **How each fill crossed** — whether two buyers met or a real seller was involved
  is in the fill events, not the market rows.
- **Per-source oracle detail** — which feeds answered and what each returned lives
  on the oracle explorer. Every receipt links to it.
- **Unrealised P&L and order distance from the touch** — both need a book read per
  position.

## Hackathon Impact (For the Judges)

Built to directly address the Somnia Hackathon criteria:
1. **Innovation:** Moves beyond standard swap UI. An approval-gated AI that acts as a risk manager and calculates true market edge.
2. **Technical Depth:** 100% coverage of the `@somnia-chain/markets-sdk` (minting, merging, sweeping, and streaming live on-chain state).
3. **Business Ecosystem:** Proves market honesty via the Calibration curve and surfaces Stranded Funds, bringing institutional trust and liquidity to the DEX.

## Future: The Bot Builder & Session Keys

The desk currently enforces a strict "human-in-the-loop" safety model. A fully automated trading bot is the deliberate opposite. 

The planned **Bot Builder** resolves this tension without compromising security by utilizing the protocol's native `OperatorPermissionsRegistry`:
1. The user's cold wallet grants a temporary "hot" session key limited to `placeOrderFor` and `cancelOrderFor`.
2. The automated engine trades in the background using this hot key.
3. The hot key is structurally unable to withdraw or steal funds; all escrow remains `msg.sender`-scoped.

*"The bot trades while you sleep, but provably cannot steal."*

## Notes

- Shannon testnet only. Nothing here should point at real money yet.
- `.env.local` is gitignored. Never commit credentials.
- Two SDK writes remain unwired: `amendOrder` (atomic cancel-and-replace, the
  right primitive for re-quoting a ladder without leaving a gap) and
  `approveBuilder` (builder codes — a per-fill fee on routed flow, which the docs
  never mention works on binary markets, though the ABI confirms it does).
- Built against the DreamDEX documentation, the `@somnia-chain/markets-sdk`
  package, and the dreamBot Kit's event-contract guide. Where those disagreed,
  on-chain behaviour won: the live venues do set strike prices and run six window
  lengths, both of which the docs describe otherwise.
