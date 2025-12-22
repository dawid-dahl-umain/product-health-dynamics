import { ProductHealthModel } from "../model/ProductHealthModel";
import type { PhaseConfig, SimulationRun, TrajectoryConfig } from "../types";

/**
 * Simulates a single trajectory of Product Health over time.
 *
 * Starting from an initial health value, applies `nChanges` change events
 * using the given Engineering Rigor. Each change is a probabilistic draw
 * from the model.
 *
 * @returns Array of PH values: [start, after change 1, after change 2, ...]
 */
export const simulateTrajectory = (
  config: TrajectoryConfig,
  rng: () => number = Math.random
): SimulationRun => {
  const { nChanges, startValue = 8, engineeringRigor } = config;
  const model = new ProductHealthModel(engineeringRigor);
  const history: number[] = [startValue];

  for (let i = 0; i < nChanges; i++) {
    const currentHealth = history[history.length - 1];
    history.push(model.sampleNextHealth(currentHealth, rng));
  }

  return history;
};

/**
 * Simulates a trajectory with multiple phases, each with different Engineering Rigor.
 *
 * Use this for scenarios like "AI vibe coding for 200 changes, then senior engineers
 * take over for 800 changes". Each phase picks up where the previous one left off.
 *
 * @returns Array of PH values spanning all phases continuously
 */
export const simulatePhasedTrajectory = (
  phases: PhaseConfig[],
  startHealth: number,
  rng: () => number = Math.random
): SimulationRun => {
  const history: number[] = [startHealth];

  for (const phase of phases) {
    const model = new ProductHealthModel(phase.engineeringRigor);

    for (let i = 0; i < phase.nChanges; i++) {
      const currentHealth = history[history.length - 1];
      history.push(model.sampleNextHealth(currentHealth, rng));
    }
  }

  return history;
};

