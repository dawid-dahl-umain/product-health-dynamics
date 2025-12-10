import type { PhaseConfig, TrajectoryConfig } from "./core";

export type ScenarioKey =
  | "ai-vibe"
  | "ai-guardrails"
  | "senior-engineers"
  | "ai-handoff";

export type ScenarioConfig = TrajectoryConfig & {
  label: string;
  phases?: PhaseConfig[];
};

export const scenarios: Record<ScenarioKey, ScenarioConfig> = {
  "ai-vibe": {
    label: "AI Vibe Coding (Ralph)",
    nChanges: 200,
    startValue: 8,
  },
  "ai-guardrails": {
    label: "AI with Guardrails",
    nChanges: 200,
    startValue: 8,
  },
  "senior-engineers": {
    label: "Senior Engineers",
    nChanges: 200,
    startValue: 8,
  },
  "ai-handoff": {
    label: "AI to Senior Handoff",
    nChanges: 150,
    startValue: 8,
    phases: [
      {
        nChanges: 30,
        startValue: 8,
      },
      {
        nChanges: 120,
      },
    ],
  },
};

export const scenarioKeys = Object.keys(scenarios) as ScenarioKey[];
