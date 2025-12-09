export type RegionProbabilities = {
  optimal: number
  neutral: number
  catastrophic: number
}

export type ScenarioKey = 'ai-vibe' | 'ai-guardrails' | 'senior-engineers'

export type SimulationConfig = {
  probabilities: RegionProbabilities
  nChanges: number
  phStart: number
  optimalDelta?: number
  neutralDelta?: number
  catastrophicDelta?: number
}

export type SimulationRun = number[]

export type SimulationStats = {
  averageFinal: number
  averageMin: number
  failureRate: number
  averageTrajectory: number[]
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const nextHealth = (
  current: number,
  probabilities: RegionProbabilities,
  rng: () => number,
  deltas: { optimal: number; neutral: number; catastrophic: number }
) => {
  const roll = rng()
  if (roll < probabilities.optimal) {
    return clamp(current + deltas.optimal, 1, 10)
  }
  if (roll < probabilities.optimal + probabilities.neutral) {
    return clamp(current + deltas.neutral, 1, 10)
  }
  return clamp(current + deltas.catastrophic, 1, 10)
}

const defaultDeltas = {
  optimal: 0.5,
  neutral: 0,
  catastrophic: -1,
}

export const simulateTrajectory = (
  config: SimulationConfig,
  rng: () => number = Math.random
): SimulationRun => {
  const deltas = {
    optimal: config.optimalDelta ?? defaultDeltas.optimal,
    neutral: config.neutralDelta ?? defaultDeltas.neutral,
    catastrophic: config.catastrophicDelta ?? defaultDeltas.catastrophic,
  }
  const history: number[] = [config.phStart]
  for (let i = 0; i < config.nChanges; i += 1) {
    const next = nextHealth(history[history.length - 1], config.probabilities, rng, deltas)
    history.push(next)
  }
  return history
}

const average = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length

const minValue = (values: number[]) => values.reduce((current, value) => Math.min(current, value))

export const summarizeRuns = (runs: SimulationRun[]): SimulationStats => {
  const finals = runs.map((run) => run[run.length - 1])
  const mins = runs.map(minValue)
  const failureThreshold = 3
  const failures = mins.filter((value) => value <= failureThreshold).length
  const sampleLength = runs[0]?.length ?? 0
  const averagesByStep = Array.from({ length: sampleLength }, (_, index) =>
    average(runs.map((run) => run[index] ?? run[run.length - 1]))
  )
  return {
    averageFinal: Number(average(finals).toFixed(3)),
    averageMin: Number(average(mins).toFixed(3)),
    failureRate: Number((failures / runs.length).toFixed(3)),
    averageTrajectory: averagesByStep.map((value) => Number(value.toFixed(3))),
  }
}

export const defaultScenarios: Record<ScenarioKey, SimulationConfig> = {
  'ai-vibe': {
    probabilities: { optimal: 0.1, neutral: 0.2, catastrophic: 0.7 },
    nChanges: 50,
    phStart: 8,
  },
  'ai-guardrails': {
    probabilities: { optimal: 0.35, neutral: 0.35, catastrophic: 0.3 },
    nChanges: 50,
    phStart: 8,
    catastrophicDelta: -0.7,
  },
  'senior-engineers': {
    probabilities: { optimal: 0.6, neutral: 0.3, catastrophic: 0.1 },
    nChanges: 50,
    phStart: 8,
  },
}

export const scenarioKeys = Object.keys(defaultScenarios) as ScenarioKey[]

export const simulateScenario = (
  scenario: ScenarioKey,
  options?: { nSimulations?: number; rngFactory?: () => () => number }
) => {
  const config = defaultScenarios[scenario]
  const nSimulations = options?.nSimulations ?? 1000
  const rngFactory = options?.rngFactory ?? (() => Math.random)
  const runs = Array.from({ length: nSimulations }, () =>
    simulateTrajectory(config, rngFactory())
  )
  return summarizeRuns(runs)
}

