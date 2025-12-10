export type RegionProbabilities = {
  optimal: number;
  neutral: number;
  catastrophic: number;
};

export type ScenarioKey = "ai-vibe" | "ai-guardrails" | "senior-engineers";

export type ScenarioConfig = {
  label: string;
  probabilities: RegionProbabilities;
  nChanges: number;
  phStart: number;
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

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const average = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const minValue = (values: number[]): number =>
  values.reduce((current, value) => Math.min(current, value));

const nextHealth = (
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

const defaultDeltas = {
  optimal: 0.5,
  neutral: 0,
  catastrophic: -1,
};

export const simulateTrajectory = (
  config: ScenarioConfig,
  rng: () => number = Math.random
): SimulationRun => {
  const deltas = {
    optimal: config.optimalDelta ?? defaultDeltas.optimal,
    neutral: config.neutralDelta ?? defaultDeltas.neutral,
    catastrophic: config.catastrophicDelta ?? defaultDeltas.catastrophic,
  };
  const history: number[] = [config.phStart];
  for (let i = 0; i < config.nChanges; i += 1) {
    const next = nextHealth(
      history[history.length - 1],
      config.probabilities,
      rng,
      deltas
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

export const scenarios: Record<ScenarioKey, ScenarioConfig> = {
  "ai-vibe": {
    label: "AI Vibe Coding",
    probabilities: { optimal: 0.1, neutral: 0.2, catastrophic: 0.7 },
    nChanges: 50,
    phStart: 8,
  },
  "ai-guardrails": {
    label: "AI with Guardrails",
    probabilities: { optimal: 0.35, neutral: 0.35, catastrophic: 0.3 },
    nChanges: 50,
    phStart: 8,
    catastrophicDelta: -0.7,
  },
  "senior-engineers": {
    label: "Senior Engineers",
    probabilities: { optimal: 0.6, neutral: 0.3, catastrophic: 0.1 },
    nChanges: 50,
    phStart: 8,
  },
};

export const scenarioKeys = Object.keys(scenarios) as ScenarioKey[];

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
    const deltas = {
      optimal: config.optimalDelta ?? defaultDeltas.optimal,
      neutral: config.neutralDelta ?? defaultDeltas.neutral,
      catastrophic: config.catastrophicDelta ?? defaultDeltas.catastrophic,
    };
    const expectedValue = calculateExpectedValue(config.probabilities, deltas);
    const result = simulateScenario(key);
    console.log(`Scenario: ${config.label}`);
    console.log(`Expected Δ per Change Event: ${expectedValue.toFixed(3)}`);
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
