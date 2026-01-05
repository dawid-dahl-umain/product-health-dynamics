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

  /**
   * The inherent complexity of the system being worked on (0-1 scale).
   * Determines how much the "entropy dynamics" (systemState feedback) affect the system.
   *
   * In a simple system (low SC), there's less coupling possible, so:
   * - The system never becomes as "frozen" even at low PH
   * - Damage doesn't cascade as severely
   * - Recovery is faster (easier to untangle)
   *
   * Mathematically: effectiveSystemState = (1 - SC) + SC × rawSystemState
   * This provides a floor on tractability proportional to simplicity.
   */
  public readonly systemComplexity: number;

  constructor(engineeringRigor: number, systemComplexity: number = 1.0) {
    this.engineeringRigor = engineeringRigor;
    this.systemComplexity = systemComplexity;
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
   *
   * The breakeven point (where baseImpact = 0) scales with system complexity:
   *   breakeven_ER = 0.25 × (1 + SC)
   *
   * - At SC = 0 (trivial): breakeven at ER = 0.25 (minimum rigor needed)
   * - At SC = 1 (enterprise): breakeven at ER = 0.5 (original behavior)
   *
   * The 0.25 minimum means: even the simplest system requires some rigor.
   * The scaling means: complex systems demand proportionally more discipline.
   */
  public get baseImpact(): number {
    const { slope } = ModelParameters.impact;
    // Breakeven ER scales linearly from 0.25 (at SC=0) to 0.5 (at SC=1)
    const breakevenER = 0.25 * (1 + this.systemComplexity);
    return slope * (this.engineeringRigor - breakevenER);
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
   *
   * System Complexity provides a floor on tractability:
   *   effectiveSystemState = (1 - SC) + SC × rawSystemState
   *
   * In a simple system (SC=0.25), even at PH=1, effectiveSystemState ≈ 0.75.
   * This models the reality that simple systems can never become as "frozen"
   * as complex systems - there's less coupling to entangle.
   */
  private computeSystemState(currentHealth: number): number {
    const { threshold, steepness } = ModelParameters.systemState;
    const rawSystemState = sigmoid(currentHealth - threshold, steepness);

    // Linear interpolation: floor at (1 - SC), scaling the remainder by SC
    // SC = 1 (enterprise): effectiveSystemState = rawSystemState
    // SC = 0.25 (simple): effectiveSystemState = 0.75 + 0.25 × rawSystemState
    const floor = 1 - this.systemComplexity;
    return floor + this.systemComplexity * rawSystemState;
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
   *
   * Uses a bell-curve scaling: sigma is LOW at both extremes (healthy and frozen),
   * and HIGH in the chaotic transition zone around PH=5.
   *
   * Intuition:
   * - High PH (healthy): Tests catch problems, modules contain issues, predictable outcomes
   * - Mid PH (transition): Some structure remains but unreliable, chaotic outcomes
   * - Low PH (frozen): Everything coupled, every change breaks things, predictably bad
   */
  public computeEffectiveSigma(currentHealth: number): number {
    const { floor, range } = ModelParameters.sigmaScale;
    const systemState = this.computeSystemState(currentHealth);
    const bellFactor = this.computeBellCurveFactor(systemState);
    const scale = floor + range * bellFactor;
    return this.baseSigma * scale;
  }

  /**
   * Computes a bell-curve factor that peaks at systemState=0.5 and falls to 0 at extremes.
   * The formula 4x(1-x) produces a parabola: 0 at x=0, 1 at x=0.5, 0 at x=1.
   */
  private computeBellCurveFactor(systemState: number): number {
    return 4 * systemState * (1 - systemState);
  }

  /**
   * Computes variance attenuation at low Product Health.
   *
   * In a tightly coupled system, outcomes become "frozen": luck cannot save you.
   * This prevents instant recovery via lucky variance while allowing mean-driven improvement.
   */
  private computeVarianceAttenuation(systemState: number): number {
    const { floor, range } = ModelParameters.varianceAttenuation;
    return floor + range * systemState;
  }

  /**
   * Applies soft ceiling resistance when Product Health exceeds the agent's maxHealth.
   * Gains are exponentially dampened based on how far above ceiling you are.
   */
  private applySoftCeiling(delta: number, currentHealth: number): number {
    const isAboveCeiling = currentHealth > this.maxHealth;
    const isGaining = delta > 0;

    if (!isGaining || !isAboveCeiling) {
      return delta;
    }

    const overshoot = (currentHealth - this.maxHealth) / this.maxHealth;
    const { decay } = ModelParameters.softCeiling;
    return delta * Math.exp(-decay * overshoot);
  }

  /**
   * Computes the accumulated complexity drift.
   *
   * Software naturally tends toward disorder; complexity accumulates with each change.
   * The complexity cost grows over time: base + growth × changeCount.
   *
   * Scaled by:
   * - systemState: healthy systems pay this "maintenance cost"
   * - systemComplexity: simpler systems have less inherent complexity to accumulate
   */
  private computeComplexityDrift(
    systemState: number,
    changeCount: number
  ): number {
    const { base, growth } = ModelParameters.accumulatedComplexity;
    const currentRate = base + growth * changeCount;
    // Simple systems accumulate less complexity (fewer moving parts)
    return -currentRate * systemState * this.systemComplexity;
  }

  /**
   * Samples the next Product Health value after one change event.
   * This is the core Monte Carlo step: draws from a normal distribution,
   * applies soft ceiling logic, and clamps to valid bounds.
   *
   * @param currentHealth - The current Product Health (1-10)
   * @param changeCount - How many changes have occurred (for accumulated complexity)
   * @param rng - Random number generator (default: Math.random). Inject for testing.
   * @returns The new Product Health after this change
   */
  public sampleNextHealth(
    currentHealth: number,
    changeCount: number = 0,
    rng: () => number = Math.random
  ): number {
    const systemState = this.computeSystemState(currentHealth);
    const mean = this.computeExpectedImpact(currentHealth);
    const complexityDrift = this.computeComplexityDrift(
      systemState,
      changeCount
    );
    const sigma = this.computeEffectiveSigma(currentHealth);

    const rawRandom = sigma * gaussianRandom(rng);
    const attenuatedRandom =
      rawRandom * this.computeVarianceAttenuation(systemState);

    const rawDelta = mean + complexityDrift + attenuatedRandom;
    const delta = this.applySoftCeiling(rawDelta, currentHealth);

    const { min, max } = ModelParameters.health;
    return clamp(currentHealth + delta, min, max);
  }
}
