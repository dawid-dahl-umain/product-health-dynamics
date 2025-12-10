import {
  simulateTrajectory,
  simulatePhasedTrajectory,
  summarizeRuns,
  type PhaseConfig,
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
  simulateTrajectory,
  simulatePhasedTrajectory,
  summarizeRuns,
  scenarios,
  scenarioKeys,
};
export type {
  PhaseConfig,
  ScenarioConfig,
  ScenarioKey,
  SimulationRun,
  SimulationStats,
  TrajectoryConfig,
};

export const simulateScenario = (
  scenario: ScenarioKey,
  options?: { nSimulations?: number }
): SimulationStats => {
  const config = scenarios[scenario];
  const nSimulations = options?.nSimulations ?? 1000;
  const runs = Array.from({ length: nSimulations }, () =>
    config.phases?.length
      ? simulatePhasedTrajectory(config.phases, config.startValue ?? 0)
      : simulateTrajectory(config)
  );
  return summarizeRuns(runs, config.failureThreshold ?? 3);
};

export const runSimulation = () => {
  scenarioKeys.forEach((key) => {
    const config = scenarios[key];
    const result = simulateScenario(key);
    console.log(`Scenario: ${config.label}`);
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
