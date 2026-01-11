/**
 * System Complexity profiles representing different types of problems.
 *
 * System Complexity (SC) represents how complex the requirements are
 * and how much custom work is needed vs. using off-the-shelf solutions.
 *
 * In the model, SC scales how forgiving the system is:
 * - Higher SC = mistakes cascade more, recovery is harder
 * - Lower SC = more forgiving, easier to recover
 */
export const ComplexityProfiles = {
  /** Simple: off-the-shelf tools suffice, minimal custom logic. */
  simple: {
    systemComplexity: 0.25,
    label: "Simple System",
    description:
      "Off-the-shelf tools suffice (blog, marketing site, basic CMS)",
  },
  /** Medium: standard patterns with some custom business logic. */
  medium: {
    systemComplexity: 0.5,
    label: "Medium System",
    description: "Standard SaaS app, libraries handle most logic",
  },
  /** Enterprise: complex requirements, bespoke domain logic. */
  enterprise: {
    systemComplexity: 0.85,
    label: "Enterprise System",
    description:
      "Complex business rules, bespoke domain logic, many integrations",
  },
} as const;

export type ComplexityProfileKey = keyof typeof ComplexityProfiles;

export const ComplexityProfileKeys = Object.keys(
  ComplexityProfiles
) as ComplexityProfileKey[];
