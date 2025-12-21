import type { PhaseConfig, TrajectoryConfig } from "./core";

export type ScenarioKey =
  | "ai-vibe"
  | "ai-guardrails"
  | "junior-engineer"
  | "senior-engineers"
  | "ai-handoff";

export type ScenarioConfig = TrajectoryConfig & {
  label: string;
  phases?: PhaseConfig[];
};

type AgentProfile = {
  engineeringRigor: number;
};

const agentProfiles = {
  "ai-vibe": {
    engineeringRigor: 0.1,
  },
  "ai-guardrails": {
    engineeringRigor: 0.3,
  },
  "junior-engineer": {
    engineeringRigor: 0.4,
  },
  "senior-engineers": {
    engineeringRigor: 0.8,
  },
} satisfies Record<Exclude<ScenarioKey, "ai-handoff">, AgentProfile>;

export const scenarios: Record<ScenarioKey, ScenarioConfig> = {
  "ai-vibe": {
    label: "AI Vibe Coding (Ralph)",
    nChanges: 1000,
    startValue: 8,
    ...agentProfiles["ai-vibe"],
  },
  "ai-guardrails": {
    label: "AI with Guardrails",
    nChanges: 1000,
    startValue: 8,
    ...agentProfiles["ai-guardrails"],
  },
  "junior-engineer": {
    label: "Junior Engineer",
    nChanges: 1000,
    startValue: 8,
    ...agentProfiles["junior-engineer"],
  },
  "senior-engineers": {
    label: "Senior Engineers",
    nChanges: 1000,
    startValue: 8,
    ...agentProfiles["senior-engineers"],
  },
  "ai-handoff": {
    label: "AI to Senior Handoff",
    nChanges: 1000,
    startValue: 8,
    engineeringRigor: 0.1,
    phases: [
      {
        nChanges: 200,
        startValue: 8,
        ...agentProfiles["ai-vibe"],
      },
      {
        nChanges: 800,
        ...agentProfiles["senior-engineers"],
      },
    ],
  },
};

export const scenarioKeys = Object.keys(scenarios) as ScenarioKey[];
