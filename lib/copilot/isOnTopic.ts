/**
 * A cheap check for questions this desk has no business answering.
 *
 * The system prompt already tells the copilot to decline off-topic questions,
 * and that handles nuance far better than a word list can — "does weather move
 * BTC" is a market question, "what is the weather" is not, and only a model can
 * reliably tell those apart.
 *
 * This exists for the small set of requests where a model call is pure waste:
 * someone asking the trading desk to write their code or tell them a joke. It
 * saves a round trip and a token spend, nothing more, so it is deliberately
 * narrow and errs toward letting things through.
 */

/** Phrases that only ever appear in requests this desk should refuse. */
const CLEARLY_OFF_TOPIC = [
  "write me a",
  "write a poem",
  "write an essay",
  "tell me a joke",
  "translate this",
  "what is the weather",
  "who won the",
  "recipe for",
  "summarise this article",
  "summarize this article",
  "debug my",
  "fix my code",
];

/** Words that pull an otherwise vague question back into scope. */
const ON_TOPIC_ANCHORS = [
  "market",
  "price",
  "probability",
  "calibrat",
  "settle",
  "oracle",
  "order",
  "position",
  "trade",
  "edge",
  "window",
  "book",
  "spread",
  "void",
  "claim",
  "btc",
  "eth",
  "up",
  "down",
  "venue",
  "contract",
];

export function isClearlyOffTopic(question: string): boolean {
  const asked = question.toLowerCase();

  const matchesOffTopic = CLEARLY_OFF_TOPIC.some((phrase) => asked.includes(phrase));
  if (!matchesOffTopic) {
    return false;
  }

  /**
   * A question can hit an off-topic phrase and still be about the desk — "write
   * me a summary of the calibration" is a fair thing to ask. So an anchor word
   * overrides the match.
   */
  return !ON_TOPIC_ANCHORS.some((anchor) => asked.includes(anchor));
}

export const OFF_TOPIC_REPLY =
  "That is outside what I can help with. I cover the event contract markets on this venue — pricing, calibration, settlement, and your own positions.";
