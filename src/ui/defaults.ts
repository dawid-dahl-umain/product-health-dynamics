import type {
  AgentConfig,
  Simulation,
  GlobalConfig,
  AppData,
} from "./storage/types";

const createDefaultAgents = (): AgentConfig[] => [
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
    name: "Junior Engineer",
    engineeringRigor: 0.5,
    color: "#eab308",
  },
  {
    id: "senior",
    name: "Senior Engineer",
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
    agents: createDefaultAgents(),
    complexity: "simple",
    nChanges: 1000,
  },
  {
    id: "medium",
    name: "Medium System",
    agents: createDefaultAgents(),
    complexity: "medium",
    nChanges: 1000,
  },
  {
    id: "enterprise",
    name: "Enterprise System",
    agents: createDefaultAgents(),
    complexity: "enterprise",
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
  version: 1,
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
