export type RegionProbabilities = {
  optimal: number;
  neutral: number;
  catastrophic: number;
};

export type TrajectoryConfig = {
  probabilities: RegionProbabilities;
  nChanges: number;
  phStart: number;
  couplingGain?: number;
  optimalDelta?: number;
  neutralDelta?: number;
  catastrophicDelta?: number;
  failureThreshold?: number;
};

export type SimulationRun = number[];

export type SimulationStats = {
  averageFinal: number;
  averageMin: number;
  failureRate: number;
  averageTrajectory: number[];
};

const defaultDeltas = {
  optimal: 0.5,
  neutral: 0,
  catastrophic: -1,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const average = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const minValue = (values: number[]): number =>
  values.reduce((current, value) => Math.min(current, value));

export const buildBaseDeltas = (config: TrajectoryConfig) => ({
  optimal: config.optimalDelta ?? defaultDeltas.optimal,
  neutral: config.neutralDelta ?? defaultDeltas.neutral,
  catastrophic: config.catastrophicDelta ?? defaultDeltas.catastrophic,
});

const resolveCouplingGain = (config: TrajectoryConfig) =>
  config.couplingGain ?? 0.6;

const adjustProbabilities = (
  base: RegionProbabilities,
  currentHealth: number,
  couplingGain: number
): RegionProbabilities => {
  const healthFactor = clamp((10 - currentHealth) / 9, 0, 1);
  const drag = healthFactor * healthFactor;
  const catMultiplier = 1 + couplingGain * drag;
  const optMultiplier = Math.max(0, 1 - 0.6 * couplingGain * drag);
  const neuMultiplier = Math.max(0, 1 - 0.3 * couplingGain * drag);

  const weighted = {
    optimal: base.optimal * optMultiplier,
    neutral: base.neutral * neuMultiplier,
    catastrophic: base.catastrophic * catMultiplier,
  };

  const total = weighted.optimal + weighted.neutral + weighted.catastrophic;
  return {
    optimal: weighted.optimal / total,
    neutral: weighted.neutral / total,
    catastrophic: weighted.catastrophic / total,
  };
};

const scaleCatastrophicDamage = (
  catastrophicDelta: number,
  currentHealth: number
) => {
  const healthFactor = clamp((10 - currentHealth) / 9, 0, 1);
  const severityScale = 0.4 + 0.6 * healthFactor;
  return catastrophicDelta * severityScale;
};

const stepHealth = (
  current: number,
  probabilities: RegionProbabilities,
  rng: () => number,
  deltas: { optimal: number; neutral: number; catastrophic: number }
): number => {
  const roll = rng();
  if (roll < probabilities.optimal) {
    return clamp(current + deltas.optimal, 1, 10);
  }
  if (roll < probabilities.optimal + probabilities.neutral) {
    return clamp(current + deltas.neutral, 1, 10);
  }
  return clamp(current + deltas.catastrophic, 1, 10);
};

export const simulateTrajectory = (
  config: TrajectoryConfig,
  rng: () => number = Math.random
): SimulationRun => {
  const baseDeltas = buildBaseDeltas(config);
  const couplingGain = resolveCouplingGain(config);
  const history: number[] = [config.phStart];
  for (let i = 0; i < config.nChanges; i += 1) {
    const adjustedProbabilities = adjustProbabilities(
      config.probabilities,
      history[history.length - 1],
      couplingGain
    );
    const effectiveDeltas = {
      ...baseDeltas,
      catastrophic: scaleCatastrophicDamage(
        baseDeltas.catastrophic,
        history[history.length - 1]
      ),
    };
    const next = stepHealth(
      history[history.length - 1],
      adjustedProbabilities,
      rng,
      effectiveDeltas
    );
    history.push(next);
  }
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

export const calculateExpectedValue = (
  probabilities: RegionProbabilities,
  deltas: {
    optimal: number;
    neutral: number;
    catastrophic: number;
  } = defaultDeltas
): number =>
  probabilities.optimal * deltas.optimal +
  probabilities.neutral * deltas.neutral +
  probabilities.catastrophic * deltas.catastrophic;

export const core = {
  simulateTrajectory,
  summarizeRuns,
  calculateExpectedValue,
};

