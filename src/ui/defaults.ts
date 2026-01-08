import type {
  AgentConfig,
  HandoffConfig,
  Simulation,
  GlobalConfig,
  AppData,
} from "./storage/types";

import { AGENT_PALETTE } from "./chart/colors";

const createDefaultDevelopers = (): AgentConfig[] => [
  {
    id: "vibe",
    name: "AI Vibe Coder",
    engineeringRigor: 0.3,
    color: AGENT_PALETTE[0],
  },
  {
    id: "guardrails",
    name: "AI with Guardrails",
    engineeringRigor: 0.4,
    color: AGENT_PALETTE[1],
  },
  {
    id: "junior",
    name: "Junior Developer",
    engineeringRigor: 0.5,
    color: AGENT_PALETTE[2],
  },
  {
    id: "senior",
    name: "Senior Developer",
    engineeringRigor: 0.8,
    color: AGENT_PALETTE[3],
  },
];

const createDefaultHandoffs = (): HandoffConfig[] => [
  {
    id: "ai-senior-handoff",
    name: "AI → Senior Handoff",
    fromAgentId: "vibe",
    toAgentId: "senior",
    atChange: 200,
  },
  {
    id: "ai-junior-handoff",
    name: "AI → Junior Handoff",
    fromAgentId: "vibe",
    toAgentId: "junior",
    atChange: 200,
  },
];

export const createDefaultSimulations = (): Simulation[] => [
  {
    id: "simple",
    name: "Simple System",
    agents: createDefaultDevelopers(),
    handoffs: createDefaultHandoffs(),
    systemComplexity: 0.25,
    complexityDescription: "Blog, landing page, basic CMS",
    nChanges: 1000,
  },
  {
    id: "medium",
    name: "Medium System",
    agents: createDefaultDevelopers(),
    handoffs: createDefaultHandoffs(),
    systemComplexity: 0.5,
    complexityDescription: "CRUD backend with auth, moderate business logic",
    nChanges: 1000,
  },
  {
    id: "enterprise",
    name: "Enterprise System",
    agents: createDefaultDevelopers(),
    handoffs: createDefaultHandoffs(),
    systemComplexity: 1.0,
    complexityDescription: "Complex architecture, many integrations",
    nChanges: 1000,
  },
];

export const createDefaultGlobalConfig = (): GlobalConfig => ({
  defaultVisibility: "all",
  activeSimulationId: "enterprise",
});

export const createDefaultAppData = (): AppData => ({
  simulations: createDefaultSimulations(),
  globalConfig: createDefaultGlobalConfig(),
  version: 6,
});

export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export { getNextColor } from "./chart/colors";

export const getDefaultComplexityDescription = (sc: number): string => {
  if (sc <= 0.3) return "Simple system (blog, landing page)";
  if (sc <= 0.6) return "Moderate system (CRUD backend, auth)";
  return "Complex system (enterprise, many integrations)";
};
