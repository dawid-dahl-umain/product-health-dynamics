import {
  simulatePhasedTrajectory,
  simulateTrajectory,
} from "./runner/Trajectory";
import { summarizeRuns } from "./runner/Statistics";
import {
  Scenarios,
  ScenarioKeys,
  type ScenarioConfig,
  type ScenarioKey,
} from "./scenarios/ScenarioDefinitions";
import {
  ComplexityProfiles,
  ComplexityProfileKeys,
  type ComplexityProfileKey,
} from "./scenarios/ComplexityProfiles";
import type {
  PhaseConfig,
  SimulationRun,
  SimulationStats,
  TrajectoryConfig,
} from "./types";

export {
  simulateTrajectory,
  simulatePhasedTrajectory,
  summarizeRuns,
  Scenarios as scenarios,
  ScenarioKeys as scenarioKeys,
  ComplexityProfiles as complexityProfiles,
  ComplexityProfileKeys as complexityProfileKeys,
};

export type {
  PhaseConfig,
  ScenarioConfig,
  ScenarioKey,
  ComplexityProfileKey,
  SimulationRun,
  SimulationStats,
  TrajectoryConfig,
};

export const simulateScenario = (
  scenario: ScenarioKey,
  options?: { nSimulations?: number; systemComplexity?: number }
): SimulationStats => {
  const config = Scenarios[scenario];
  const nSimulations = options?.nSimulations ?? 1000;
  const systemComplexity = options?.systemComplexity ?? 1.0;

  const runs = Array.from({ length: nSimulations }, () =>
    config.phases?.length
      ? simulatePhasedTrajectory(
          config.phases,
          config.startValue ?? 8,
          systemComplexity
        )
      : simulateTrajectory({ ...config, systemComplexity })
  );

  return summarizeRuns(runs, config.failureThreshold ?? 3);
};

export const runSimulation = () => {
  ScenarioKeys.forEach((key) => {
    const config = Scenarios[key];
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
