import type { PhaseConfig, TrajectoryConfig } from "../types";
import { AgentProfiles } from "./AgentProfiles";

/** Identifiers for predefined simulation scenarios. */
export type ScenarioKey =
  | "ai-vibe"
  | "ai-guardrails"
  | "junior-engineer"
  | "senior-engineers"
  | "ai-handoff"
  | "ai-junior-handoff";

/** Full configuration for a scenario, including display label. */
export type ScenarioConfig = TrajectoryConfig & {
  label: string;
  phases?: PhaseConfig[];
};

const DEFAULT_CHANGES = 1000;
const DEFAULT_START = 8;
const HANDOFF_AI_CHANGES = 200;
const HANDOFF_RECOVERY_CHANGES = 800;

/**
 * Predefined simulation scenarios.
 *
 * Single-agent scenarios show what happens when one type of agent
 * works on a codebase continuously.
 *
 * Handoff scenarios show what happens when AI degrades a codebase,
 * then professionals are brought in to recover it.
 */
export const Scenarios: Record<ScenarioKey, ScenarioConfig> = {
  "ai-vibe": {
    label: "AI Vibe Coding (Ralph)",
    nChanges: DEFAULT_CHANGES,
    startValue: DEFAULT_START,
    ...AgentProfiles.aiVibe,
  },

  "ai-guardrails": {
    label: "AI with Guardrails",
    nChanges: DEFAULT_CHANGES,
    startValue: DEFAULT_START,
    ...AgentProfiles.aiGuardrails,
  },

  "junior-engineer": {
    label: "Junior Engineer",
    nChanges: DEFAULT_CHANGES,
    startValue: DEFAULT_START,
    ...AgentProfiles.junior,
  },

  "senior-engineers": {
    label: "Senior Engineers",
    nChanges: DEFAULT_CHANGES,
    startValue: DEFAULT_START,
    ...AgentProfiles.senior,
  },

  "ai-handoff": {
    label: "AI to Senior Handoff",
    nChanges: DEFAULT_CHANGES,
    startValue: DEFAULT_START,
    engineeringRigor: AgentProfiles.aiVibe.engineeringRigor,
    phases: [
      {
        nChanges: HANDOFF_AI_CHANGES,
        startValue: DEFAULT_START,
        ...AgentProfiles.aiVibe,
      },
      {
        nChanges: HANDOFF_RECOVERY_CHANGES,
        ...AgentProfiles.senior,
      },
    ],
  },

  "ai-junior-handoff": {
    label: "AI to Junior Handoff",
    nChanges: DEFAULT_CHANGES,
    startValue: DEFAULT_START,
    engineeringRigor: AgentProfiles.aiVibe.engineeringRigor,
    phases: [
      {
        nChanges: HANDOFF_AI_CHANGES,
        startValue: DEFAULT_START,
        ...AgentProfiles.aiVibe,
      },
      {
        nChanges: HANDOFF_RECOVERY_CHANGES,
        ...AgentProfiles.junior,
      },
    ],
  },
};

/** Array of all scenario keys, for iteration. */
export const ScenarioKeys = Object.keys(Scenarios) as ScenarioKey[];

