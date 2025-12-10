export type TrajectoryConfig = {
  nChanges: number;
  startValue?: number;
  failureThreshold?: number;
};

export type SimulationRun = number[];

export type SimulationStats = {
  averageFinal: number;
  averageMin: number;
  failureRate: number;
  averageTrajectory: number[];
};

export type PhaseConfig = Omit<TrajectoryConfig, "failureThreshold">;

const average = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const minValue = (values: number[]): number =>
  values.reduce((current, value) => Math.min(current, value));

export const simulateTrajectory = (
  config: TrajectoryConfig,
  rng: () => number = Math.random
): SimulationRun => {
  const history: number[] = [config.startValue ?? 0];
  for (let i = 0; i < config.nChanges; i += 1) {
    history.push(history[history.length - 1]);
  }
  return history;
};

export const simulatePhasedTrajectory = (
  phases: PhaseConfig[],
  phStart: number,
  rng: () => number = Math.random
): SimulationRun => {
  const history: number[] = [phStart ?? 0];
  phases.forEach((phase) => {
    for (let i = 0; i < phase.nChanges; i += 1) {
      history.push(history[history.length - 1]);
    }
  });
  return history;
};

export const summarizeRuns = (
  runs: SimulationRun[],
  failureThreshold: number = 3
): SimulationStats => {
  const finals = runs.map((run) => run[run.length - 1]);
  const mins = runs.map(minValue);
  const failures = mins.filter((value) => value <= failureThreshold).length;
  const sampleLength = runs[0]?.length ?? 0;
  const averagesByStep = Array.from({ length: sampleLength }, (_, index) =>
    average(runs.map((run) => run[index] ?? run[run.length - 1]))
  );
  return {
    averageFinal: Number(average(finals).toFixed(3)),
    averageMin: Number(average(mins).toFixed(3)),
    failureRate: Number((failures / runs.length).toFixed(3)),
    averageTrajectory: averagesByStep.map((value) => Number(value.toFixed(3))),
  };
};
export const core = {
  simulateTrajectory,
  summarizeRuns,
  simulatePhasedTrajectory,
};
