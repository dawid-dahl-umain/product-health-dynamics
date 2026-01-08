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
   */
  public get baseImpact(): number {
    const { slope } = ModelParameters.impact;
    return slope * (this.engineeringRigor - this.breakevenRigor);
  }

  private get breakevenRigor(): number {
    return 0.25 * (1 + this.systemComplexity);
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
   */
  private computeSystemState(currentHealth: number): number {
    const { threshold, steepness } = ModelParameters.systemState;
    const rawSystemState = sigmoid(currentHealth - threshold, steepness);
    return this.applyComplexityFloor(rawSystemState);
  }

  private applyComplexityFloor(rawSystemState: number): number {
    const simplicityFloor = 1 - this.systemComplexity;
    return simplicityFloor + this.systemComplexity * rawSystemState;
  }

  /**
   * Computes the time cost for a change at the current health level.
   *
   * In degraded systems, changes take longer due to debugging, coordination,
   * and regression testing. This models velocity loss alongside quality loss.
   *
   * Returns a multiplier: 1.0 = baseline (healthy), up to maxTime (frozen).
   */
  public computeTimeCost(currentHealth: number): number {
    const systemState = this.computeSystemState(currentHealth);
    const { baseTime, maxTime } = ModelParameters.timeCost;
    return baseTime + (maxTime - baseTime) * (1 - systemState);
  }

  /**
   * Computes the expected (average) impact of the next change.
   *
   * For negative base impact (low ER): damage is amplified in coupled systems.
   * For positive base impact (high ER): improvement requires traction and has diminishing returns.
   *
   * The ceiling factor is clamped to [0, 1] to ensure agents above their ceiling
   * simply cannot improve (factor = 0), rather than having their improvement
   * mechanism work in reverse (which would occur if the factor went negative).
   */
  public computeExpectedImpact(currentHealth: number): number {
    const systemState = this.computeSystemState(currentHealth);

    if (this.baseImpact <= 0) {
      const fragility = 1 - systemState;
      return this.baseImpact * fragility;
    }

    const traction = systemState;
    const { exponent } = ModelParameters.ceilingFactor;
    const rawCeilingFactor =
      1 - Math.pow(currentHealth / this.maxHealth, exponent);
    const ceilingFactor = Math.max(0, rawCeilingFactor);
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
   * Computes variance attenuation at both extremes of Product Health.
   *
   * The intuition: outcomes are predictable at both extremes, chaotic in the middle.
   * - High PH (healthy): well-structured system catches mistakes → predictable outcomes
   * - Mid PH (transition): some structure but unreliable → chaotic outcomes
   * - Low PH (frozen): everything coupled, changes predictably cascade → deterministic decay
   *
   * Uses bellFactor to create symmetric reduction at both extremes, matching the
   * physical reality that both healthy and degraded systems have predictable dynamics.
   */
  private computeVarianceAttenuation(systemState: number): number {
    const { floor, range } = ModelParameters.varianceAttenuation;
    const bellFactor = this.computeBellCurveFactor(systemState);
    return floor + range * bellFactor;
  }

  /**
   * Computes ceiling resistance factor when Product Health exceeds the agent's maxHealth.
   *
   * Unlike the old "soft ceiling" which only attenuated positive deltas (creating
   * asymmetric variance), this applies SYMMETRIC attenuation to all variance when
   * above ceiling. This preserves the plateau behavior by reducing volatility rather
   * than biasing direction.
   *
   * Returns 1.0 when at or below ceiling, decays toward 0 as overshoot increases.
   */
  private computeCeilingResistance(currentHealth: number): number {
    if (currentHealth <= this.maxHealth) {
      return 1.0;
    }

    const overshoot = (currentHealth - this.maxHealth) / this.maxHealth;
    const { decay } = ModelParameters.softCeiling;
    return Math.exp(-decay * overshoot);
  }

  /**
   * Computes the accumulated complexity drift.
   *
   * Software naturally tends toward disorder; complexity accumulates with each change.
   * The complexity cost grows over time: base + growth × changeCount.
   *
   * Scaled by:
   * - systemState: only tractable systems pay this "maintenance cost"; frozen systems
   *   are already at maximum disorder and can't accumulate more
   * - systemComplexity: simpler systems have less inherent complexity to accumulate
   *
   * This models reality: a healthy codebase requires ongoing maintenance effort to
   * stay healthy. A frozen codebase is already chaotic; it can't get worse from
   * complexity alone (though it still decays from negative impact).
   */
  private computeComplexityDrift(
    systemState: number,
    changeCount: number
  ): number {
    const { base, growth } = ModelParameters.accumulatedComplexity;
    const currentRate = base + growth * changeCount;
    return -currentRate * systemState * this.systemComplexity;
  }

  /**
   * Samples the next Product Health value after one change event.
   * This is the core Monte Carlo step: draws from a normal distribution,
   * applies attenuation, and clamps to valid bounds.
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
    const randomComponent = this.computeAttenuatedRandom(
      currentHealth,
      systemState,
      rng
    );

    const delta = mean + complexityDrift + randomComponent;
    const { min, max } = ModelParameters.health;
    return clamp(currentHealth + delta, min, max);
  }

  private computeAttenuatedRandom(
    currentHealth: number,
    systemState: number,
    rng: () => number
  ): number {
    const sigma = this.computeEffectiveSigma(currentHealth);
    const rawRandom = sigma * gaussianRandom(rng);
    const varianceAttenuation = this.computeVarianceAttenuation(systemState);
    const ceilingResistance = this.computeCeilingResistance(currentHealth);
    return rawRandom * varianceAttenuation * ceilingResistance;
  }
}
