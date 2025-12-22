import type { SimulationRun, SimulationStats } from "../types";
import { average, minimum, percentile, round } from "../utils/Math";

/**
 * Aggregates multiple simulation runs into summary statistics.
 *
 * Monte Carlo simulations run many times to see the range of possible outcomes.
 * This function computes averages and percentiles across all those runs.
 *
 * @param runs - Array of simulation runs (each run is an array of PH values)
 * @param failureThreshold - PH value below which a run is considered a "failure"
 * @returns Summary statistics including averages, percentiles, and failure rate
 */
export const summarizeRuns = (
  runs: SimulationRun[],
  failureThreshold: number = 3
): SimulationStats => {
  const finals = runs.map((run) => run[run.length - 1]);
  const mins = runs.map(minimum);
  const failures = mins.filter((m) => m <= failureThreshold).length;
  const trajectoryLength = runs[0]?.length ?? 0;

  const valuesByStep = Array.from({ length: trajectoryLength }, (_, step) =>
    runs.map((run) => run[step] ?? run[run.length - 1])
  );

  return {
    averageFinal: round(average(finals)),
    averageMin: round(average(mins)),
    failureRate: round(failures / runs.length),
    averageTrajectory: valuesByStep.map((v) => round(average(v))),
    p10Trajectory: valuesByStep.map((v) => round(percentile(v, 10))),
    p90Trajectory: valuesByStep.map((v) => round(percentile(v, 90))),
  };
};

