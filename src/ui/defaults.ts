import type {
  AgentConfig,
  Simulation,
  GlobalConfig,
  AppData,
} from "./storage/types";

const createDefaultDevelopers = (): AgentConfig[] => [
  {
    id: "vibe",
    name: "AI Vibe Coder",
    engineeringRigor: 0.3,
    color: "#ef4444",
  },
  {
    id: "guardrails",
    name: "AI with Guardrails",
    engineeringRigor: 0.4,
    color: "#f97316",
  },
  {
    id: "junior",
    name: "Junior Developer",
    engineeringRigor: 0.5,
    color: "#eab308",
  },
  {
    id: "senior",
    name: "Senior Developer",
    engineeringRigor: 0.8,
    color: "#22c55e",
  },
  {
    id: "ai-senior-handoff",
    name: "AI → Senior Handoff",
    engineeringRigor: 0.3,
    color: "#8b5cf6",
    handoffToId: "senior",
  },
  {
    id: "ai-junior-handoff",
    name: "AI → Junior Handoff",
    engineeringRigor: 0.3,
    color: "#3b82f6",
    handoffToId: "junior",
  },
];

export const createDefaultSimulations = (): Simulation[] => [
  {
    id: "simple",
    name: "Simple System",
    agents: createDefaultDevelopers(),
    systemComplexity: 0.25,
    complexityDescription: "Blog, landing page, basic CMS",
    nChanges: 1000,
  },
  {
    id: "medium",
    name: "Medium System",
    agents: createDefaultDevelopers(),
    systemComplexity: 0.5,
    complexityDescription: "CRUD backend with auth, moderate business logic",
    nChanges: 1000,
  },
  {
    id: "enterprise",
    name: "Enterprise System",
    agents: createDefaultDevelopers(),
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
  version: 4,
});

export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const getNextColor = (usedColors: string[]): string => {
  const palette = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#14b8a6",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
    "#84cc16",
  ];
  return (
    palette.find((c) => !usedColors.includes(c)) ??
    palette[Math.floor(Math.random() * palette.length)]
  );
};

export const getDefaultComplexityDescription = (sc: number): string => {
  if (sc <= 0.3) return "Simple system (blog, landing page)";
  if (sc <= 0.6) return "Moderate system (CRUD backend, auth)";
  return "Complex system (enterprise, many integrations)";
};
