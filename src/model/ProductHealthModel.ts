import { clamp, gaussianRandom, sigmoid } from "../utils/Math";
import { ModelParameters } from "./Parameters";

/**
 * The core simulation model for Product Health dynamics.
 *
 * Each instance represents an "agent" (human or AI) with a fixed Engineering Rigor.
 * The model predicts how Product Health changes over time based on that rigor.
 *
 * Key behaviors:
 * - Low ER agents (vibe coders) have negative expected impact: things get worse over time.
 * - High ER agents (seniors) have positive expected impact: things improve over time.
 * - Damage compounds in unhealthy systems (the "entropy" effect).
 * - Recovery is slow at first, then accelerates, then plateaus near the agent's ceiling.
 */
export class ProductHealthModel {
  /**
   * The agent's Engineering Rigor (0-1 scale).
   * This is the "master dial" that determines all other behaviors.
   * 0 = no discipline (pure vibe coding), 1 = perfect rigor (theoretical ideal).
   */
  public readonly engineeringRigor: number;

  constructor(engineeringRigor: number) {
    this.engineeringRigor = engineeringRigor;
  }

  /**
   * The highest Product Health this agent can sustainably maintain.
   * Higher ER = higher ceiling. Seniors (~0.8) cap around 9; vibe coders (~0.1) cap around 5.5.
   */
  public get maxHealth(): number {
    const { base, slope } = ModelParameters.ceiling;
    return base + slope * this.engineeringRigor;
  }

  /**
   * The agent's expected impact per change, before system state modifiers.
   * Negative = tends to make things worse. Positive = tends to improve things.
   * Breakeven is at ER = 0.5 (juniors). Below that, you're degrading the system.
   */
  public get baseImpact(): number {
    const { slope, intercept } = ModelParameters.impact;
    return this.engineeringRigor * slope - intercept;
  }

  /**
   * Base Sigma (σ): How unpredictable this agent's outcomes are.
   * "Sigma" is statistics-speak for standard deviation (spread of outcomes).
   * Low ER = high sigma (wild swings, sometimes brilliant, sometimes catastrophic).
   * High ER = low sigma (consistent, predictable outcomes).
   */
  public get baseSigma(): number {
    const { min, max } = ModelParameters.sigma;
    return min + (max - min) * (1 - this.engineeringRigor);
  }

  /**
   * Computes how "tractable" the system is at the current health level.
   * Returns 0-1: 0 = tightly coupled mess, 1 = well-structured and maintainable.
   * This drives the compounding effect: damage multiplies in unhealthy systems.
   */
  private computeSystemState(currentHealth: number): number {
    const { threshold, steepness } = ModelParameters.systemState;
    return sigmoid(currentHealth - threshold, steepness);
  }

  /**
   * Computes the expected (average) impact of the next change.
   *
   * For negative base impact (low ER): damage is amplified in coupled systems.
   * For positive base impact (high ER): improvement requires traction and has diminishing returns.
   */
  public computeExpectedImpact(currentHealth: number): number {
    const systemState = this.computeSystemState(currentHealth);

    if (this.baseImpact <= 0) {
      const fragility = 1 - systemState;
      return this.baseImpact * fragility;
    }

    const traction = systemState;
    const { exponent } = ModelParameters.ceilingFactor;
    const ceilingFactor =
      1 - Math.pow(currentHealth / this.maxHealth, exponent);
    return this.baseImpact * traction * ceilingFactor;
  }

  /**
   * Computes effective sigma (σ_eff): the actual unpredictability for the next change.
   * Base sigma is scaled by system state: frozen in unhealthy systems (less randomness,
   * outcomes become predictably bad), normal in healthy systems.
   */
  public computeEffectiveSigma(currentHealth: number): number {
    const { floor, range } = ModelParameters.sigmaScale;
    const systemState = this.computeSystemState(currentHealth);
    const scale = floor + range * systemState;
    return this.baseSigma * scale;
  }

  /**
   * Samples the next Product Health value after one change event.
   * This is the core Monte Carlo step: draws from a normal distribution,
   * applies soft ceiling logic, and clamps to valid bounds.
   *
   * @param currentHealth - The current Product Health (1-10)
   * @param rng - Random number generator (default: Math.random). Inject for testing.
   * @returns The new Product Health after this change
   */
  public sampleNextHealth(
    currentHealth: number,
    rng: () => number = Math.random
  ): number {
    const mean = this.computeExpectedImpact(currentHealth);
    const sigma = this.computeEffectiveSigma(currentHealth);
    let delta = mean + sigma * gaussianRandom(rng);

    const isAboveCeiling = currentHealth > this.maxHealth;
    const isGaining = delta > 0;

    if (isGaining && isAboveCeiling) {
      const overshoot = (currentHealth - this.maxHealth) / this.maxHealth;
      const { decay } = ModelParameters.softCeiling;
      delta = delta * Math.exp(-decay * overshoot);
    }

    const { min, max } = ModelParameters.health;
    return clamp(currentHealth + delta, min, max);
  }
}
