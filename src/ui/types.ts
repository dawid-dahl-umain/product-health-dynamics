export type AgentConfig = {
  id: string;
  name: string;
  engineeringRigor: number;
  color: string;
  enableHandoff?: boolean;
};

export type UIState = {
  agents: AgentConfig[];
  nChanges: number;
  complexity: "simple" | "medium" | "enterprise";
  settingsOpen: boolean;
};

export const DEFAULT_AGENTS: AgentConfig[] = [
  { id: "vibe", name: "AI Vibe Coder", engineeringRigor: 0.3, color: "#ef4444" },
  { id: "guardrails", name: "AI with Guardrails", engineeringRigor: 0.4, color: "#f97316" },
  { id: "junior", name: "Junior Engineer", engineeringRigor: 0.5, color: "#eab308" },
  { id: "senior", name: "Senior Engineer", engineeringRigor: 0.8, color: "#22c55e" },
  { id: "handoff", name: "AI → Senior Handoff", engineeringRigor: 0.3, color: "#8b5cf6", enableHandoff: true },
];

export const DEFAULT_STATE: UIState = {
  agents: DEFAULT_AGENTS,
  nChanges: 1000,
  complexity: "enterprise",
  settingsOpen: false,
};

export const CHANGES_OPTIONS = [250, 500, 1000, 2000] as const;

export const AGENT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#84cc16",
];

