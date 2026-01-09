import type { StorageService } from "./StorageService";
import type { Simulation, GlobalConfig, AppData } from "./types";

const STORAGE_KEY = "product-health-dynamics";

export class LocalStorageAdapter implements StorageService {
  private data: AppData;
  private defaultDataFactory: () => AppData;

  constructor(defaultDataFactory: () => AppData) {
    this.defaultDataFactory = defaultDataFactory;
    this.data = this.load();
  }

  private load(): AppData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return this.defaultDataFactory();

    try {
      return JSON.parse(stored) as AppData;
    } catch {
      return this.defaultDataFactory();
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  getSimulations(): Simulation[] {
    return this.data.simulations;
  }

  getSimulation(id: string): Simulation | undefined {
    return this.data.simulations.find((s) => s.id === id);
  }

  saveSimulation(simulation: Simulation): void {
    const index = this.data.simulations.findIndex(
      (s) => s.id === simulation.id
    );
    if (index === -1) {
      this.data.simulations.push(simulation);
    } else {
      this.data.simulations[index] = simulation;
    }
    this.persist();
  }

  deleteSimulation(id: string): void {
    this.data.simulations = this.data.simulations.filter((s) => s.id !== id);
    if (this.data.globalConfig.activeSimulationId === id) {
      this.data.globalConfig.activeSimulationId =
        this.data.simulations[0]?.id ?? "";
    }
    this.persist();
  }

  getGlobalConfig(): GlobalConfig {
    return this.data.globalConfig;
  }

  saveGlobalConfig(config: GlobalConfig): void {
    this.data.globalConfig = config;
    this.persist();
  }

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.defaultDataFactory();
    this.persist();
  }

  exportData(): AppData {
    return structuredClone(this.data);
  }

  importData(data: AppData): void {
    this.data = data;
    this.persist();
  }
}
