import {
  simulatePhasedTrajectory,
  simulateTrajectory,
} from "./runner/Trajectory";
import { summarizeRuns } from "./runner/Statistics";
import {
  Scenarios,
  ScenarioKeys,
  DEFAULT_CHANGES,
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
  DEFAULT_CHANGES,
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

const scalePhases = (
  phases: PhaseConfig[] | undefined,
  targetChanges: number,
  defaultChanges: number
): PhaseConfig[] | undefined => {
  if (!phases?.length) return undefined;
  const scaleFactor = targetChanges / defaultChanges;
  return phases.map((phase) => ({
    ...phase,
    nChanges: Math.round(phase.nChanges * scaleFactor),
  }));
};

export const simulateScenario = (
  scenario: ScenarioKey,
  options?: {
    nSimulations?: number;
    systemComplexity?: number;
    nChanges?: number;
  }
): SimulationStats => {
  const config = Scenarios[scenario];
  const nSimulations = options?.nSimulations ?? 1000;
  const systemComplexity = options?.systemComplexity ?? 1.0;
  const nChanges = options?.nChanges ?? config.nChanges ?? DEFAULT_CHANGES;
  const scaledPhases = scalePhases(
    config.phases,
    nChanges,
    config.nChanges ?? DEFAULT_CHANGES
  );

  const runs = Array.from({ length: nSimulations }, () =>
    scaledPhases?.length
      ? simulatePhasedTrajectory(
          scaledPhases,
          config.startValue ?? 8,
          systemComplexity
        )
      : simulateTrajectory({ ...config, nChanges, systemComplexity })
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
