export interface SizeRecommendation {
  /** Contracts to buy, already whole numbers. */
  contracts: number;
  costUsdc: number;
  /** Share of the bankroll this puts at risk. */
  bankrollShare: number;
  /** The unconstrained figure, before the cap below was applied. */
  uncappedShare: number;
  wasCapped: boolean;
  reasoning: string;
}

/**
 * Never stake more than this on one window, whatever the maths says.
 *
 * The Kelly criterion assumes your probability estimate is correct. A
 * calibration curve built from a few hundred windows is an estimate with real
 * error in it, so betting full Kelly on it risks ruin from a mismeasurement
 * rather than from bad luck. A quarter is the conventional discount.
 */
const KELLY_FRACTION = 0.25;
const HARD_CAP_SHARE = 0.05;

/**
 * How much to stake, given an edge.
 *
 * For a contract that pays 1 or 0, the Kelly stake is simply the edge divided
 * by the odds — which for a binary market reduces to `q − p` over `1 − p`,
 * where q is the true chance and p the price. That is then quartered, because
 * the true chance here is measured rather than known.
 *
 * Returns zero contracts when there is no edge, rather than a small position:
 * a negative-expectancy trade does not become acceptable by being small.
 */
export function computePositionSize(
  pricePaid: number,
  trueProbability: number,
  bankrollUsdc: number
): SizeRecommendation {
  const edge = trueProbability - pricePaid;

  if (edge <= 0 || pricePaid <= 0 || pricePaid >= 1) {
    return {
      contracts: 0,
      costUsdc: 0,
      bankrollShare: 0,
      uncappedShare: 0,
      wasCapped: false,
      reasoning:
        "No edge at this price — the market is charging at least what the side is worth.",
    };
  }

  const fullKellyShare = edge / (1 - pricePaid);
  const discountedShare = fullKellyShare * KELLY_FRACTION;
  const wasCapped = discountedShare > HARD_CAP_SHARE;
  const finalShare = Math.min(discountedShare, HARD_CAP_SHARE);

  const stakeUsdc = bankrollUsdc * finalShare;
  const contracts = Math.floor(stakeUsdc / pricePaid);
  const costUsdc = Number((contracts * pricePaid).toFixed(2));

  return {
    contracts,
    costUsdc,
    bankrollShare: bankrollUsdc > 0 ? costUsdc / bankrollUsdc : 0,
    uncappedShare: discountedShare,
    wasCapped,
    reasoning: wasCapped
      ? `Quarter-Kelly would stake ${(discountedShare * 100).toFixed(1)}% here, capped to ${HARD_CAP_SHARE * 100}% of the bankroll on any one window.`
      : `Quarter-Kelly on an edge of ${(edge * 100).toFixed(1)} points.`,
  };
}
