/**
 * Prices on an event contract are probabilities, and they sit on the venue's
 * tick grid — a whole number of thousandths.
 *
 * So three decimals is the real precision, not a flourish. Two would round
 * 0.747 and 0.752 to the same 0.75 while they are different ticks and different
 * prices, which is how a trader ends up seeing one number on a card and paying
 * another.
 */
const TICK_DECIMALS = 3;

export function formatProbability(probability: number): string {
  return probability.toFixed(TICK_DECIMALS);
}

/**
 * The same number said out loud, for prose and copilot replies.
 *
 * Rounded to whole percent here on purpose: "the market says 75%" is how people
 * talk, and a spoken sentence is not where tick precision belongs.
 */
export function formatProbabilityAsPercent(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

/**
 * A spread is a difference between two ticks, so it is a whole number of ticks
 * too. Rounding to the grid clears the float dust that subtraction leaves —
 * 0.763 minus 0.737 arrives as 0.026000000000000023.
 */
export function formatSpread(spread: number): string {
  const ticks = Math.round(spread * 10 ** TICK_DECIMALS);
  return (ticks / 10 ** TICK_DECIMALS).toFixed(TICK_DECIMALS);
}

/** DOWN is whatever UP is not. */
export function invertProbability(probability: number): number {
  return 1 - probability;
}
