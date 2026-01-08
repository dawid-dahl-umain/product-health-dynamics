import type { SimulationRun, SimulationStats } from "../types";
import { average, minimum, percentile, round } from "../utils/Math";

/**
 * Aggregates multiple simulation runs into summary statistics.
 *
 * Monte Carlo simulations run many times to see the range of possible outcomes.
 * This function computes averages and percentiles across all those runs,
 * including time metrics that capture velocity loss in degraded systems.
 *
 * @param runs - Array of simulation runs (each with health and time trajectories)
 * @param failureThreshold - PH value below which a run is considered a "failure"
 * @returns Summary statistics including averages, percentiles, failure rate, and time metrics
 */
export const summarizeRuns = (
  runs: SimulationRun[],
  failureThreshold: number = 3
): SimulationStats => {
  const healthTrajectories = runs.map((run) => run.healthTrajectory);
  const totalTimes = runs.map((run) => run.totalTime);

  const finals = healthTrajectories.map((h) => h[h.length - 1]);
  const mins = healthTrajectories.map(minimum);
  const failures = mins.filter((m) => m <= failureThreshold).length;
  const trajectoryLength = healthTrajectories[0]?.length ?? 0;

  const valuesByStep = Array.from({ length: trajectoryLength }, (_, step) =>
    healthTrajectories.map((h) => h[step] ?? h[h.length - 1])
  );

  const avgTotalTime = average(totalTimes);
  const nChanges = trajectoryLength - 1; // trajectory includes start value
  const baselineTime = nChanges; // baseline assumes 1.0 time per change

  return {
    averageFinal: round(average(finals)),
    averageMin: round(average(mins)),
    failureRate: round(failures / runs.length),
    averageTrajectory: valuesByStep.map((v) => round(average(v))),
    p10Trajectory: valuesByStep.map((v) => round(percentile(v, 10))),
    p90Trajectory: valuesByStep.map((v) => round(percentile(v, 90))),
    averageTotalTime: round(avgTotalTime),
    averageTimePerChange: round(avgTotalTime / nChanges),
    baselineTime,
    timeOverheadPercent: round(((avgTotalTime - baselineTime) / baselineTime) * 100),
  };
};
