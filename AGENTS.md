<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DreamDEX Desk — working on this codebase

Analytics and an approval-gated AI copilot for DreamDEX Event Contracts on
Somnia. Read `README.md` first for what it does and why.

## The rule that must not be broken

Writes are in three classes, and the boundary is the whole safety claim:

| Class | Examples | Behaviour |
| --- | --- | --- |
| Read | calibration, markets, book, portfolio | Runs freely |
| Recover | cancel, shrink, merge a set, unblock a settled market | Runs when asked |
| **Spend** | place an order | **Produces a proposal. Never executes.** |

A spending write reaches the chain only after a person presses Approve *and*
signs in their wallet. The copilot has no tool that can sign, and the server
holds no key. Do not add one. If a new write can spend, it goes through
`buildTradeProposal` and the approval card.

## Where things live

```
lib/exchange/     every chain read, mapped to this app's own types
lib/analytics/    expected value, position sizing — pure functions
lib/copilot/      Azure client, tool definitions, proposal builder, guardrails
lib/wallet/       wagmi config, the signing exchange, operator grants
hooks/            one per data source, plus useWriteActions
components/       dashboard panels · copilot · wallet · layout · ui
styles/           layout · panels · copilot — kept out of component files
```

Reads run on the server so indexer and RPC config stays there. Writes run in the
browser because that is where the wallet is.

## Conventions

- **Plain verbs, spelled out.** `buildTradeProposal`, not `mkProp`.
  `findUnclaimedWinnings`, not `sweep`.
- **Styles live in `styles/`,** not inside components. Type sizes come from
  Tailwind's own scale — the theme block in `app/globals.css` raises it one step
  so the desk and shadcn's components stay in step.
- **Comments explain why, not what.** Especially where the chain surprised us.
- **No mock data.** If the chain does not expose something, say so in the UI
  rather than inventing a plausible number. There are four such gaps and each is
  named in the README.
- **One commit per file,** plain lowercase messages.

## Traps this codebase already handles

Do not undo these.

- **Never hand a float price to the venue.** Snap to integer ticks. A float
  passes on 6-decimal Shannon and fails on every 18-decimal mainnet order.
- **Scale by the market row's own decimals.** 6 on Shannon, 18 on mainnet.
- **Gate on on-chain status before a write.** The indexer lags by seconds.
- **Key state by `marketId`, never pool address.** Pools are recycled between
  windows.
- **Settled markets are invisible to the ordinary market list.** Query
  `status: "Finalized"` or unclaimed winnings stay lost.
- **Venue ids move.** Discovered at runtime by finding the venue with live
  windows — do not hardcode one.
- **`orderBy: "closingSoon"` fills a page with markets about to expire,** all of
  which fail the headroom check. Use `"newest"`.

## React 19 in this repo

The linter forbids `setState` inside an effect, and it is right to. Anything
external — the clock, `localStorage`, a media query, a polled endpoint — is read
through `useSyncExternalStore`, usually via `lib/createPollingStore.ts`. Several
panels share one poll that way, so they never disagree.

Two shadcn components needed this fix after being generated. Re-running
`shadcn add` will reintroduce the bug.

## Testing

```bash
node scripts/smoke-test.mjs [walletAddress]
```

26 checks across pages, chain reads, wallet reads, proposals, copilot tools and
guardrails. Signing is not covered and cannot be — the wallet lives in the
browser by design. The README's Tier 3 table covers those by hand.

Always run `npm run build` and `npm run lint` before committing.
