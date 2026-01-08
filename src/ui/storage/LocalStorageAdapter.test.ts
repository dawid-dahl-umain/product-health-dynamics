import { describe, expect, it, beforeEach, vi } from "vitest";
import { LocalStorageAdapter } from "./LocalStorageAdapter";
import type { AppData, Simulation, GlobalConfig } from "./types";

const createTestAppData = (): AppData => ({
  simulations: [
    {
      id: "sim-1",
      name: "Test Simulation",
      agents: [
        {
          id: "agent-1",
          name: "Test Agent",
          engineeringRigor: 0.5,
          color: "#ff0000",
        },
      ],
      complexity: "simple",
      nChanges: 500,
    },
  ],
  globalConfig: {
    defaultVisibility: "all",
    activeSimulationId: "sim-1",
  },
  version: 1,
});

const createMockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
};

describe("LocalStorageAdapter", () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    vi.stubGlobal("localStorage", mockStorage);
  });

  describe("initialization", () => {
    it("returns default data when localStorage is empty", () => {
      // Given
      const defaultData = createTestAppData();
      const adapter = new LocalStorageAdapter(() => defaultData);

      // When
      const simulations = adapter.getSimulations();

      // Then
      expect(simulations).toHaveLength(1);
      expect(simulations[0].name).toBe("Test Simulation");
    });

    it("loads existing data from localStorage", () => {
      // Given
      const storedData: AppData = {
        simulations: [
          {
            id: "stored-sim",
            name: "Stored Simulation",
            agents: [],
            complexity: "enterprise",
            nChanges: 1000,
          },
        ],
        globalConfig: {
          defaultVisibility: "averages-only",
          activeSimulationId: "stored-sim",
        },
        version: 1,
      };
      mockStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      // When
      const adapter = new LocalStorageAdapter(createTestAppData);
      const simulations = adapter.getSimulations();

      // Then
      expect(simulations).toHaveLength(1);
      expect(simulations[0].name).toBe("Stored Simulation");
    });

    it("returns default data when localStorage contains invalid JSON", () => {
      // Given
      mockStorage.getItem.mockReturnValue("not valid json");
      const defaultData = createTestAppData();

      // When
      const adapter = new LocalStorageAdapter(() => defaultData);
      const simulations = adapter.getSimulations();

      // Then
      expect(simulations).toHaveLength(1);
      expect(simulations[0].name).toBe("Test Simulation");
    });
  });

  describe("getSimulation", () => {
    it("returns simulation by id", () => {
      // Given
      const adapter = new LocalStorageAdapter(createTestAppData);

      // When
      const sim = adapter.getSimulation("sim-1");

      // Then
      expect(sim?.name).toBe("Test Simulation");
    });

    it("returns undefined for non-existent id", () => {
      // Given
      const adapter = new LocalStorageAdapter(createTestAppData);

      // When
      const sim = adapter.getSimulation("non-existent");

      // Then
      expect(sim).toBeUndefined();
    });
  });

  describe("saveSimulation", () => {
    it("updates existing simulation", () => {
      // Given
      const adapter = new LocalStorageAdapter(createTestAppData);
      const updated: Simulation = {
        id: "sim-1",
        name: "Updated Simulation",
        agents: [],
        complexity: "enterprise",
        nChanges: 2000,
      };

      // When
      adapter.saveSimulation(updated);

      // Then
      const sim = adapter.getSimulation("sim-1");
      expect(sim?.name).toBe("Updated Simulation");
      expect(sim?.nChanges).toBe(2000);
      expect(mockStorage.setItem).toHaveBeenCalled();
    });

    it("adds new simulation", () => {
      // Given
      const adapter = new LocalStorageAdapter(createTestAppData);
      const newSim: Simulation = {
        id: "sim-2",
        name: "New Simulation",
        agents: [],
        complexity: "medium",
        nChanges: 500,
      };

      // When
      adapter.saveSimulation(newSim);

      // Then
      const simulations = adapter.getSimulations();
      expect(simulations).toHaveLength(2);
      expect(adapter.getSimulation("sim-2")?.name).toBe("New Simulation");
    });
  });

  describe("deleteSimulation", () => {
    it("removes simulation by id", () => {
      // Given
      const adapter = new LocalStorageAdapter(createTestAppData);

      // When
      adapter.deleteSimulation("sim-1");

      // Then
      expect(adapter.getSimulations()).toHaveLength(0);
    });

    it("updates activeSimulationId when deleting active simulation", () => {
      // Given
      const dataWithTwo = (): AppData => ({
        simulations: [
          {
            id: "sim-1",
            name: "First",
            agents: [],
            complexity: "simple",
            nChanges: 500,
          },
          {
            id: "sim-2",
            name: "Second",
            agents: [],
            complexity: "medium",
            nChanges: 500,
          },
        ],
        globalConfig: {
          defaultVisibility: "all",
          activeSimulationId: "sim-1",
        },
        version: 1,
      });
      const adapter = new LocalStorageAdapter(dataWithTwo);

      // When
      adapter.deleteSimulation("sim-1");

      // Then
      expect(adapter.getGlobalConfig().activeSimulationId).toBe("sim-2");
    });
  });

  describe("getGlobalConfig", () => {
    it("returns global configuration", () => {
      // Given
      const adapter = new LocalStorageAdapter(createTestAppData);

      // When
      const config = adapter.getGlobalConfig();

      // Then
      expect(config.defaultVisibility).toBe("all");
      expect(config.activeSimulationId).toBe("sim-1");
    });
  });

  describe("saveGlobalConfig", () => {
    it("updates global configuration", () => {
      // Given
      const adapter = new LocalStorageAdapter(createTestAppData);
      const newConfig: GlobalConfig = {
        defaultVisibility: "averages-only",
        activeSimulationId: "sim-1",
      };

      // When
      adapter.saveGlobalConfig(newConfig);

      // Then
      expect(adapter.getGlobalConfig().defaultVisibility).toBe("averages-only");
    });
  });

  describe("clearAll", () => {
    it("resets to default data", () => {
      // Given
      const adapter = new LocalStorageAdapter(createTestAppData);
      adapter.saveSimulation({
        id: "extra",
        name: "Extra",
        agents: [],
        complexity: "enterprise",
        nChanges: 1000,
      });

      // When
      adapter.clearAll();

      // Then
      expect(adapter.getSimulations()).toHaveLength(1);
      expect(adapter.getSimulations()[0].name).toBe("Test Simulation");
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        "product-health-dynamics"
      );
    });
  });

  describe("exportData", () => {
    it("returns a deep copy of all data", () => {
      // Given
      const adapter = new LocalStorageAdapter(createTestAppData);

      // When
      const exported = adapter.exportData();
      exported.simulations[0].name = "Modified";

      // Then
      expect(adapter.getSimulations()[0].name).toBe("Test Simulation");
    });
  });

  describe("importData", () => {
    it("replaces all data with imported data", () => {
      // Given
      const adapter = new LocalStorageAdapter(createTestAppData);
      const importedData: AppData = {
        simulations: [
          {
            id: "imported-sim",
            name: "Imported Simulation",
            agents: [],
            complexity: "enterprise",
            nChanges: 2000,
          },
        ],
        globalConfig: {
          defaultVisibility: "averages-only",
          activeSimulationId: "imported-sim",
        },
        version: 1,
      };

      // When
      adapter.importData(importedData);

      // Then
      expect(adapter.getSimulations()).toHaveLength(1);
      expect(adapter.getSimulations()[0].name).toBe("Imported Simulation");
      expect(adapter.getGlobalConfig().defaultVisibility).toBe("averages-only");
    });
  });

  describe("version migration", () => {
    it("migrates data with older version", () => {
      // Given
      const oldData = {
        simulations: [
          {
            id: "old-sim",
            name: "Old Simulation",
            agents: [],
            complexity: "simple",
            nChanges: 500,
          },
        ],
        globalConfig: {
          defaultVisibility: "all",
          activeSimulationId: "old-sim",
        },
        version: 0,
      };
      mockStorage.getItem.mockReturnValue(JSON.stringify(oldData));

      // When
      const adapter = new LocalStorageAdapter(createTestAppData);

      // Then
      const exported = adapter.exportData();
      expect(exported.version).toBe(1);
      expect(exported.simulations[0].name).toBe("Old Simulation");
    });
  });
});

