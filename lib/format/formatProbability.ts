/**
 * Prices on an event contract are probabilities between 0 and 1, so they are
 * shown to two decimal places. UP and DOWN always add up to exactly 1.
 */
export function formatProbability(probability: number): string {
  return probability.toFixed(2);
}

/** The same number said out loud, for prose and copilot replies. */
export function formatProbabilityAsPercent(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

/** DOWN is whatever UP is not. */
export function invertProbability(probability: number): number {
  return 1 - probability;
}
