import type { StorageService } from "./StorageService";
import type { Simulation, GlobalConfig, AppData } from "./types";

const STORAGE_KEY = "product-health-dynamics";
const CURRENT_VERSION = 4;

const LEGACY_COMPLEXITY_VALUES: Record<string, number> = {
  simple: 0.25,
  medium: 0.5,
  enterprise: 1.0,
};

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
      const parsed = JSON.parse(stored) as AppData;
      if (parsed.version !== CURRENT_VERSION) {
        const migrated = this.migrate(parsed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
      return parsed;
    } catch {
      return this.defaultDataFactory();
    }
  }

  private migrate(data: AppData): AppData {
    // Migrate simulations from complexityId to systemComplexity
    const legacyData = data as unknown as {
      simulations: Array<{
        id: string;
        name: string;
        agents: unknown[];
        nChanges: number;
        complexity?: string;
        complexityId?: string;
        systemComplexity?: number;
      }>;
      complexityProfiles?: Array<{ id: string; systemComplexity: number }>;
    };

    const migratedSimulations: Simulation[] = legacyData.simulations.map(
      (sim) => {
        if (sim.systemComplexity !== undefined) {
          return sim as unknown as Simulation;
        }

        const complexityKey = sim.complexityId ?? sim.complexity ?? "medium";
        const scFromProfiles = legacyData.complexityProfiles?.find(
          (p) => p.id === complexityKey
        )?.systemComplexity;
        const scValue =
          scFromProfiles ?? LEGACY_COMPLEXITY_VALUES[complexityKey] ?? 0.5;

        return {
          id: sim.id,
          name: sim.name,
          agents: sim.agents,
          nChanges: sim.nChanges,
          systemComplexity: scValue,
        } as Simulation;
      }
    );

    return {
      simulations: migratedSimulations,
      globalConfig: data.globalConfig,
      version: CURRENT_VERSION,
    };
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
    this.data = { ...data, version: CURRENT_VERSION };
    this.persist();
  }
}
