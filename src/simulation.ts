import {
  calculateExpectedValue,
  simulateTrajectory,
  summarizeRuns,
  buildBaseDeltas,
  type RegionProbabilities,
  type SimulationRun,
  type SimulationStats,
  type TrajectoryConfig,
} from "./simulation/core";
import {
  scenarioKeys,
  scenarios,
  type ScenarioConfig,
  type ScenarioKey,
} from "./simulation/scenarios";

export {
  calculateExpectedValue,
  simulateTrajectory,
  summarizeRuns,
  scenarios,
  scenarioKeys,
};
export type {
  RegionProbabilities,
  ScenarioConfig,
  ScenarioKey,
  SimulationRun,
  SimulationStats,
  TrajectoryConfig,
};

export const simulateScenario = (
  scenario: ScenarioKey,
  options?: { nSimulations?: number; rngFactory?: () => () => number }
): SimulationStats => {
  const config = scenarios[scenario];
  const nSimulations = options?.nSimulations ?? 1000;
  const rngFactory = options?.rngFactory ?? (() => Math.random);
  const runs = Array.from({ length: nSimulations }, () =>
    simulateTrajectory(config, rngFactory())
  );
  return summarizeRuns(runs, config.failureThreshold ?? 3);
};

export const runSimulation = () => {
  scenarioKeys.forEach((key) => {
    const config = scenarios[key];
    const deltas = buildBaseDeltas(config);
    const expectedValue = calculateExpectedValue(config.probabilities, deltas);
    const result = simulateScenario(key);
    console.log(`Scenario: ${config.label}`);
    console.log(
      `Base expected Δ per Change Event: ${expectedValue.toFixed(3)}`
    );
    console.log(`Coupling gain: ${config.couplingGain ?? 0.6}`);
    console.log(
      `Probabilities: Optimal=${config.probabilities.optimal}, Neutral=${config.probabilities.neutral}, Catastrophic=${config.probabilities.catastrophic}`
    );
    console.log(`Average Final Health: ${result.averageFinal}`);
    console.log(`Average Lowest Point: ${result.averageMin}`);
    console.log(
      `Failure Rate (PH ≤ 3): ${(result.failureRate * 100).toFixed(1)}%`
    );
    console.log(
      `Trajectory sample: ${result.averageTrajectory
        .filter((_, index) => index % 10 === 0)
        .map((value) => value.toFixed(2))
        .join(" | ")}`
    );
    console.log();
  });
};

const isDirectExecution = () => {
  if (typeof process === "undefined" || !process.argv?.[1]) return false;
  return import.meta.url === new URL(`file://${process.argv[1]}`).href;
};

if (isDirectExecution()) {
  runSimulation();
}
