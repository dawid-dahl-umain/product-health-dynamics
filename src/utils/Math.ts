/** Constrains a value to be within [min, max]. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Returns the arithmetic mean of an array of numbers. */
export const average = (values: number[]): number =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

/** Returns the smallest value in an array. */
export const minimum = (values: number[]): number =>
  values.reduce((min, v) => Math.min(min, v));

/**
 * Returns the p-th percentile of an array (with linear interpolation).
 * p=50 is the median, p=10 is the 10th percentile, etc.
 */
export const percentile = (values: number[], p: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

/**
 * The logistic sigmoid function. Maps any real number to (0, 1).
 * Used to create smooth "tipping point" transitions in the model.
 * At x=0, returns 0.5. Positive x → 1, negative x → 0.
 */
export const sigmoid = (x: number, steepness: number): number =>
  1 / (1 + Math.exp(-steepness * x));

/**
 * Generates a random number from a standard normal distribution (mean=0, std=1).
 * Uses the Box-Muller transform. This is what makes outcomes "probabilistic".
 */
export const gaussianRandom = (rng: () => number): number => {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

/** Rounds a number to a fixed number of decimal places (default 3). */
export const round = (n: number, decimals: number = 3): number =>
  Number(n.toFixed(decimals));
