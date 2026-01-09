import { clamp, gaussianRandom } from "../utils/Math";
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
   * Mathematically: floor = (1-SC)^4; effectiveState = floor + (1-floor) × rawState
   * The quartic decay provides a tractability floor for simple systems.
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

  /**
   * Computes the breakeven Engineering Rigor for this system complexity.
   *
   * Uses exponential scaling: breakeven = baseline + scale × exp(rate × SC)
   * This naturally steepens at high SC, achieving:
   * - SC=0.85 (enterprise): breakeven ≈ 0.5
   * - SC=1.0 (extreme): breakeven ≈ 0.9 (only ER=0.95+ can improve)
   */
  private get breakevenRigor(): number {
    const baseline = 0.25;
    const scale = 0.00109;
    const rate = 6.4;
    return baseline + scale * Math.exp(rate * this.systemComplexity);
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
   * Computes normalized health (0-1 scale).
   */
  private normalizedHealth(currentHealth: number): number {
    return (currentHealth - 1) / 9;
  }

  /**
   * Computes how "tractable" the system is for IMPROVEMENT.
   * Uses power^1.5 curve - resistance at low PH, good traction at high PH.
   * S-curve emerges from compounding: better PH → better traction → faster improvement.
   */
  private computeTraction(currentHealth: number): number {
    const normalized = this.normalizedHealth(currentHealth);
    const rawTraction = Math.pow(normalized, 1.5);
    return this.applyComplexityFloor(rawTraction);
  }

  /**
   * Computes how "fragile" the system is for DEGRADATION.
   * Power² of inverse - very stable at high PH, fragile at low PH.
   * Fragility scales linearly with SC.
   */
  private computeFragility(currentHealth: number): number {
    const normalized = this.normalizedHealth(currentHealth);
    const inverseNorm = 1 - normalized;
    const rawFragility = inverseNorm * inverseNorm;
    return rawFragility * this.systemComplexity;
  }

  /**
   * Computes system state for variance calculations.
   * Uses linear scaling for smooth variance behavior.
   */
  private computeSystemState(currentHealth: number): number {
    const normalized = this.normalizedHealth(currentHealth);
    return this.applyComplexityFloor(normalized);
  }

  /**
   * Applies the "simplicity floor" based on system complexity.
   *
   * Simple systems never become fully frozen; there's always some tractability.
   * Uses quartic decay: floor = (1 - SC)^4 for steep falloff.
   *
   * At SC=0.85: floor ≈ 0.05% (effectively enterprise-level)
   * At SC=1.0: floor = 0% (no forgiveness)
   */
  private applyComplexityFloor(rawSystemState: number): number {
    const simplicityFloor = Math.pow(1 - this.systemComplexity, 4);
    return simplicityFloor + (1 - simplicityFloor) * rawSystemState;
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
   * For degradation (negative impact): damage scales with fragility.
   * - High PH: low fragility (stable system resists degradation)
   * - Low PH: high fragility (failures cascade)
   *
   * For improvement (positive impact): progress scales with traction².
   * - Low PH: very low traction (frozen system resists change)
   * - High PH: good traction (changes land effectively)
   * - S-curve emerges from compounding
   */
  public computeExpectedImpact(currentHealth: number): number {
    if (this.baseImpact <= 0) {
      const fragility = this.computeFragility(currentHealth);
      return this.baseImpact * fragility;
    }

    const traction = this.computeTraction(currentHealth);
    const { exponent } = ModelParameters.ceilingFactor;
    const rawCeilingFactor =
      1 - Math.pow(currentHealth / this.maxHealth, exponent);
    const ceilingFactor = Math.max(0, rawCeilingFactor);
    return this.baseImpact * traction * ceilingFactor;
  }

  /**
   * Computes effective sigma (σ_eff): the actual unpredictability for the next change.
   *
   * For improvement: bell-curve scaling (uncertainty peaks in transition zone)
   * For degradation: variance has baseline + scales with fragility
   *   - High PH: baseline variance for visible bands
   *   - Low PH: higher variance (but system already crashed)
   */
  public computeEffectiveSigma(currentHealth: number): number {
    const { floor, range } = ModelParameters.sigmaScale;
    const systemState = this.computeSystemState(currentHealth);
    const bellFactor = this.computeBellCurveFactor(systemState);

    if (this.baseImpact >= 0) {
      const scale = floor + range * bellFactor;
      return this.baseSigma * scale;
    }

    const fragility = this.computeFragility(currentHealth);
    const baseline = 0.3;
    const scale = floor * (baseline + (1 - baseline) * fragility);
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
   * Computes variance attenuation based on system state.
   *
   * Bell-curve attenuation for all agents:
   * - Floor ensures some attenuation even at extremes
   * - Bell curve peaks in transition zone
   * - Additional variance boost for non-ideal agents improving complex systems
   */
  private computeVarianceAttenuation(systemState: number): number {
    const { floor, range, improvementVariance } =
      ModelParameters.varianceAttenuation;
    const bellFactor = this.computeBellCurveFactor(systemState);
    const baseAttenuation = floor + range * bellFactor;
    const positiveImpact = Math.max(0, this.baseImpact);
    const effectiveChallenge =
      (1 - this.engineeringRigor) * this.systemComplexity;
    const varianceBoost =
      systemState * positiveImpact * effectiveChallenge * improvementVariance;
    return baseAttenuation + varianceBoost;
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
   * - systemState: only tractable systems pay this "maintenance cost"
   * - systemComplexity: simpler systems have less inherent complexity to accumulate
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
