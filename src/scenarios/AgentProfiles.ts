/**
 * Engineering Rigor values for different agent types.
 *
 * These are the "personas" in our simulation. Each represents a different
 * level of engineering discipline. The ER value determines all their
 * other characteristics (impact, variance, ceiling).
 */
export const AgentProfiles = {
  /** Pure vibe coding: no tests, no structure, just shipping. */
  aiVibe: {
    engineeringRigor: 0.3,
  },
  /** AI with some oversight: code review, basic testing. */
  aiGuardrails: {
    engineeringRigor: 0.4,
  },
  /** Junior engineer: follows patterns but doesn't create them. Breakeven. */
  junior: {
    engineeringRigor: 0.5,
  },
  /** Senior engineer: actively improves architecture and maintainability. */
  senior: {
    engineeringRigor: 0.8,
  },
} as const;

export type AgentProfileKey = keyof typeof AgentProfiles;
