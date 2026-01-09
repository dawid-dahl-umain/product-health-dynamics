import { DEVELOPER_PALETTE } from "./chart/colors";

export type {
  DeveloperConfig,
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

export const DEVELOPER_COLORS = DEVELOPER_PALETTE;
