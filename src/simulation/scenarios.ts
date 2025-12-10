import type { TrajectoryConfig } from "./core";

export type ScenarioKey = "ai-vibe" | "ai-guardrails" | "senior-engineers";

export type ScenarioConfig = TrajectoryConfig & {
  label: string;
};

export const scenarios: Record<ScenarioKey, ScenarioConfig> = {
  "ai-vibe": {
    label: "AI Vibe Coding (Ralph)",
    probabilities: { optimal: 0.1, neutral: 0.2, catastrophic: 0.7 },
    nChanges: 50,
    phStart: 8,
    couplingGain: 1,
  },
  "ai-guardrails": {
    label: "AI with Guardrails",
    probabilities: { optimal: 0.28, neutral: 0.38, catastrophic: 0.34 },
    nChanges: 50,
    phStart: 8,
    catastrophicDelta: -0.7,
    couplingGain: 0.9,
  },
  "senior-engineers": {
    label: "Senior Engineers",
    probabilities: { optimal: 0.45, neutral: 0.4, catastrophic: 0.15 },
    nChanges: 50,
    phStart: 8,
    couplingGain: 0.6,
  },
};

export const scenarioKeys = Object.keys(scenarios) as ScenarioKey[];
