import type { Simulation, GlobalConfig, AppData } from "./types";

export interface StorageService {
  getSimulations(): Simulation[];
  getSimulation(id: string): Simulation | undefined;
  saveSimulation(simulation: Simulation): void;
  deleteSimulation(id: string): void;

  getGlobalConfig(): GlobalConfig;
  saveGlobalConfig(config: GlobalConfig): void;

  clearAll(): void;
  exportData(): AppData;
  importData(data: AppData): void;
}

