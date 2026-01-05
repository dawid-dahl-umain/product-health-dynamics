/**
 * System Complexity profiles representing different types of software systems.
 *
 * System Complexity (SC) scales all change effects in the model.
 * Higher complexity = larger impacts (both positive damage and improvement).
 * Lower complexity = smaller, slower changes.
 *
 * The value is a multiplier on the change delta:
 *   ΔPH_effective = SC × ΔPH_base
 */
export const ComplexityProfiles = {
  /** Simple system: blog, landing page, basic CMS. Slow dynamics, forgiving. */
  simple: {
    systemComplexity: 0.25,
    label: "Simple System",
    description: "Blog, landing page, basic CMS",
  },
  /** Medium system: CRUD backend with auth, moderate business logic. */
  medium: {
    systemComplexity: 0.5,
    label: "Medium System",
    description: "CRUD backend with auth, moderate business logic",
  },
  /** Enterprise system: complex architecture and domain, many integrations. Current default. */
  enterprise: {
    systemComplexity: 1.0,
    label: "Enterprise System",
    description: "Complex architecture and domain, many integrations",
  },
} as const;

export type ComplexityProfileKey = keyof typeof ComplexityProfiles;

export const ComplexityProfileKeys = Object.keys(
  ComplexityProfiles
) as ComplexityProfileKey[];
