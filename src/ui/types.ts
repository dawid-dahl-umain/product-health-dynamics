import { AGENT_PALETTE } from "./chart/colors";

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

export const AGENT_COLORS = AGENT_PALETTE;
