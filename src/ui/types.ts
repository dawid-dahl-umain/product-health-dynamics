export type {
  AgentConfig,
  Simulation,
  GlobalConfig,
  AppData,
} from "./storage/types";

export type UIState = {
  activeSimulationId: string;
  settingsOpen: boolean;
  globalSettingsOpen: boolean;
  editingTabId: string | null;
};

export const CHANGES_OPTIONS = [250, 500, 1000, 2000] as const;

export const AGENT_COLORS = [
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
