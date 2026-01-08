import { ProductHealthModel } from "../model/ProductHealthModel";
import type { PhaseConfig, SimulationRun, TrajectoryConfig } from "../types";

/**
 * Simulates Product Health trajectories over time using Monte Carlo sampling.
 * Tracks both health and cumulative time (accounting for velocity loss in degraded systems).
 */
export class TrajectorySimulator {
  private readonly rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
  }

  /**
   * Simulates a single trajectory with one agent type.
   */
  simulate(config: TrajectoryConfig): SimulationRun {
    const {
      nChanges,
      startValue = 8,
      engineeringRigor,
      systemComplexity,
    } = config;
    const model = new ProductHealthModel(engineeringRigor, systemComplexity);

    const healthTrajectory: number[] = [startValue];
    const timeTrajectory: number[] = [0];
    let cumulativeTime = 0;

    for (let i = 0; i < nChanges; i++) {
      const currentHealth = healthTrajectory[healthTrajectory.length - 1];
      cumulativeTime += model.computeTimeCost(currentHealth);
      healthTrajectory.push(model.sampleNextHealth(currentHealth, i, this.rng));
      timeTrajectory.push(cumulativeTime);
    }

    return { healthTrajectory, timeTrajectory, totalTime: cumulativeTime };
  }

  /**
   * Simulates a trajectory with multiple phases, each with different Engineering Rigor.
   * Accumulated change count is preserved across phases.
   */
  simulatePhased(
    phases: PhaseConfig[],
    startHealth: number,
    systemComplexity: number = 1.0
  ): SimulationRun {
    const healthTrajectory: number[] = [startHealth];
    const timeTrajectory: number[] = [0];
    let cumulativeTime = 0;
    let totalChanges = 0;

    for (const phase of phases) {
      const model = new ProductHealthModel(
        phase.engineeringRigor,
        systemComplexity
      );
      this.simulatePhase(
        model,
        phase.nChanges,
        totalChanges,
        healthTrajectory,
        timeTrajectory,
        cumulativeTime
      );
      cumulativeTime = timeTrajectory[timeTrajectory.length - 1];
      totalChanges += phase.nChanges;
    }

    return { healthTrajectory, timeTrajectory, totalTime: cumulativeTime };
  }

  private simulatePhase(
    model: ProductHealthModel,
    nChanges: number,
    changeOffset: number,
    healthTrajectory: number[],
    timeTrajectory: number[],
    startTime: number
  ): void {
    let cumulativeTime = startTime;

    for (let i = 0; i < nChanges; i++) {
      const currentHealth = healthTrajectory[healthTrajectory.length - 1];
      cumulativeTime += model.computeTimeCost(currentHealth);
      healthTrajectory.push(
        model.sampleNextHealth(currentHealth, changeOffset + i, this.rng)
      );
      timeTrajectory.push(cumulativeTime);
    }
  }
}
