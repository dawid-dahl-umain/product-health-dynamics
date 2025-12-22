/**
 * All tunable constants for the Product Health simulation model.
 * These control how fast things decay, how much variance there is, etc.
 * See README.md for detailed rationale behind each value.
 */
export const ModelParameters = {
  /**
   * Controls how Engineering Rigor translates to expected impact per change.
   * slope: How much ER matters. Higher = bigger gap between good and bad agents.
   * intercept: Where the breakeven point is. At ER = intercept/slope, impact is zero.
   */
  impact: {
    slope: 2.4,
    intercept: 1.2,
  },

  /**
   * Sigma (σ) = standard deviation = how much outcomes spread around the average.
   * In plain terms: "unpredictability" or "variance" in results.
   * min: σ for perfect rigor (ER=1). Even experts have some randomness.
   * max: σ for zero rigor (ER=0). How wild swings get with vibe coding.
   */
  sigma: {
    min: 0.1,
    max: 0.5,
  },

  /**
   * Controls the maximum Product Health each agent can sustainably achieve.
   * base: The floor (even zero-rigor agents have some theoretical ceiling).
   * slope: How much ER raises your ceiling. Perfect rigor = base + slope = 10.
   */
  ceiling: {
    base: 5,
    slope: 5,
  },

  /**
   * Controls the "tipping point" behavior of the system.
   * threshold: The PH midpoint where behavior shifts from "mess" to "tractable".
   *            Set to 5 because PH scale is 1-10, so 5 is roughly the middle.
   * steepness: How sharp that transition is. Higher = more dramatic tipping point.
   */
  systemState: {
    threshold: 5,
    steepness: 1.5,
  },

  /**
   * Controls how system state scales sigma (unpredictability).
   * In unhealthy systems, sigma is "frozen" (reduced), making outcomes predictably bad.
   * floor: Minimum sigma multiplier even in a frozen system (some luck is always possible).
   * range: How much of sigma is affected by system state (the rest is "frozen").
   */
  sigmaScale: {
    floor: 0.15,
    range: 0.85,
  },

  /**
   * Controls diminishing returns as you approach your ceiling.
   * exponent: Higher = sharper drop-off. At 2, improvements slow quadratically near max.
   */
  ceilingFactor: {
    exponent: 2,
  },

  /**
   * Controls how strongly the system pulls back when PH exceeds maxHealth.
   * decay: How fast positive gains shrink when you're "overperforming". Higher = stronger pull-back.
   */
  softCeiling: {
    decay: 5,
  },

  /**
   * Hard bounds on Product Health. The scale of the simulation.
   * min: Rock bottom (impossible to change anything).
   * max: Perfect (trivially easy to change).
   */
  health: {
    min: 1,
    max: 10,
  },
} as const;
