export type TrajectoryConfig = {
  nChanges: number;
  startValue?: number;
  failureThreshold?: number;
  engineeringRigor: number;
};

export type SimulationRun = number[];

export type SimulationStats = {
  averageFinal: number;
  averageMin: number;
  failureRate: number;
  averageTrajectory: number[];
};

export type PhaseConfig = Omit<TrajectoryConfig, "failureThreshold">;

export type ModelConstants = {
  sigmaMax: number;
};

const DEFAULT_CONSTANTS: ModelConstants = {
  sigmaMax: 0.5,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const average = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const minValue = (values: number[]): number =>
  values.reduce((current, value) => Math.min(current, value));

const gaussianRandom = (rng: () => number = Math.random): number => {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

const sigmoid = (x: number, steepness: number, midpoint: number): number =>
  1 / (1 + Math.exp(-steepness * (x - midpoint)));

const deriveMaxHealth = (engineeringRigor: number): number =>
  5 + 5 * engineeringRigor;

const deriveExpectedImpact = (
  engineeringRigor: number,
  currentHealth: number,
  maxHealth: number
): number => {
  const baseImpact = engineeringRigor * 0.4 - 0.2;
  const systemState = sigmoid(currentHealth - 5, 1.5, 0);

  if (baseImpact <= 0) {
    const fragility = 1 - systemState;
    return baseImpact * fragility;
  }

  const traction = systemState;
  const ceilingFactor = 1 - Math.pow(currentHealth / maxHealth, 2);
  return baseImpact * traction * ceilingFactor;
};

const deriveOutcomeVariance = (
  engineeringRigor: number,
  currentHealth: number,
  sigmaMax: number
): number => {
  const baseVariance = sigmaMax * (1 - engineeringRigor);
  const stability = sigmoid(currentHealth - 5, 1.5, 0);
  return baseVariance * (0.3 + 0.7 * (1 - stability));
};

const sampleChangeEvent = (
  currentHealth: number,
  engineeringRigor: number,
  constants: ModelConstants,
  rng: () => number = Math.random
): number => {
  const maxHealth = deriveMaxHealth(engineeringRigor);
  const mean = deriveExpectedImpact(engineeringRigor, currentHealth, maxHealth);
  const variance = deriveOutcomeVariance(
    engineeringRigor,
    currentHealth,
    constants.sigmaMax
  );
  const delta = mean + variance * gaussianRandom(rng);
  const newHealth = currentHealth + delta;
  const ceiling = Math.max(currentHealth, maxHealth);
  return clamp(newHealth, 1, ceiling);
};

export const simulateTrajectory = (
  config: TrajectoryConfig,
  rng: () => number = Math.random
): SimulationRun => {
  const constants: ModelConstants = {
    sigmaMax: DEFAULT_CONSTANTS.sigmaMax,
  };
  const history: number[] = [config.startValue ?? 8];

  for (let i = 0; i < config.nChanges; i += 1) {
    const currentHealth = history[history.length - 1];
    const nextHealth = sampleChangeEvent(
      currentHealth,
      config.engineeringRigor,
      constants,
      rng
    );
    history.push(nextHealth);
  }

  return history;
};

export const simulatePhasedTrajectory = (
  phases: PhaseConfig[],
  phStart: number,
  rng: () => number = Math.random
): SimulationRun => {
  const history: number[] = [phStart];

  phases.forEach((phase) => {
    const constants: ModelConstants = {
      sigmaMax: DEFAULT_CONSTANTS.sigmaMax,
    };

    for (let i = 0; i < phase.nChanges; i += 1) {
      const currentHealth = history[history.length - 1];
      const nextHealth = sampleChangeEvent(
        currentHealth,
        phase.engineeringRigor,
        constants,
        rng
      );
      history.push(nextHealth);
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
  deriveMaxHealth,
  deriveExpectedImpact,
  deriveOutcomeVariance,
};
