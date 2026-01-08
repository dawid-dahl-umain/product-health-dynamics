import Chart from "chart.js/auto";
import { Filler } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";
import "hammerjs";

import { chartOptions, buildDatasetsForAgents } from "./chart";
import { LocalStorageAdapter } from "./storage";
import {
  createDefaultAppData,
  generateId,
  getNextColor,
  getDefaultComplexityDescription,
} from "./defaults";
import {
  buildHeader,
  buildSimulationTabs,
  buildConfigPanel,
  buildAgentCard,
  buildChartControls,
  buildChartContainer,
  buildComplexityDescription,
  buildGlobalSettingsModal,
} from "./templates";
import type {
  StorageService,
  Simulation,
  AgentConfig,
  GlobalConfig,
} from "./storage";

Chart.register(annotationPlugin, zoomPlugin, Filler);

type UIState = {
  settingsOpen: boolean;
  globalSettingsOpen: boolean;
  editingTabId: string | null;
};

export class ProductHealthApp {
  private storage: StorageService;
  private globalConfig: GlobalConfig;
  private simulations: Simulation[];
  private uiState: UIState = {
    settingsOpen: false,
    globalSettingsOpen: false,
    editingTabId: null,
  };
  private chart: Chart | null = null;
  private root: HTMLElement;
  private updateDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(rootSelector: string) {
    const el = document.querySelector<HTMLElement>(rootSelector);
    if (!el) throw new Error(`Root element ${rootSelector} not found`);
    this.root = el;
    this.storage = new LocalStorageAdapter(createDefaultAppData);
    this.simulations = this.storage.getSimulations();
    this.globalConfig = this.storage.getGlobalConfig();
  }

  mount(): void {
    this.render();
    this.recomputeChart();
  }

  private get activeSimulation(): Simulation {
    return (
      this.simulations.find(
        (s) => s.id === this.globalConfig.activeSimulationId
      ) ?? this.simulations[0]
    );
  }

  private getDescription(sim: Simulation): string {
    return (
      sim.complexityDescription ??
      getDefaultComplexityDescription(sim.systemComplexity)
    );
  }

  private render(): void {
    this.root.innerHTML = this.buildHtml();
    this.bindEvents();
  }

  private buildHtml(): string {
    const sim = this.activeSimulation;
    return `
      <main>
        ${buildHeader({ settingsOpen: this.uiState.settingsOpen })}
        ${buildSimulationTabs({
          simulations: this.simulations,
          activeSimulationId: this.globalConfig.activeSimulationId,
          editingTabId: this.uiState.editingTabId,
        })}
        ${buildConfigPanel({
          simulation: sim,
          settingsOpen: this.uiState.settingsOpen,
        })}
        ${buildComplexityDescription({
          description: this.getDescription(sim),
          systemComplexity: sim.systemComplexity,
        })}
        ${buildChartContainer()}
        ${buildChartControls()}
      </main>
      ${buildGlobalSettingsModal({
        isVisible: this.uiState.globalSettingsOpen,
        globalConfig: this.globalConfig,
      })}
    `;
  }

  private bindEvents(): void {
    this.bindHeaderEvents();
    this.bindSimulationTabEvents();
    this.bindConfigEvents();
    this.bindAgentEvents();
    this.bindChartControls();
    this.bindGlobalSettingsEvents();
  }

  private bindHeaderEvents(): void {
    document
      .getElementById("settings-toggle")
      ?.addEventListener("click", () => {
        this.uiState.settingsOpen = !this.uiState.settingsOpen;
        document
          .getElementById("config-panel")
          ?.classList.toggle("open", this.uiState.settingsOpen);
        document
          .getElementById("settings-toggle")
          ?.classList.toggle("active", this.uiState.settingsOpen);
      });

    document
      .getElementById("global-settings-btn")
      ?.addEventListener("click", () => {
        this.uiState.globalSettingsOpen = true;
        document
          .getElementById("global-modal-overlay")
          ?.classList.add("visible");
      });
  }

  private bindSimulationTabEvents(): void {
    document.getElementById("sim-tabs")?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const closeBtn = target.closest("[data-action='close-sim']");
      if (closeBtn) {
        const simId = closeBtn.getAttribute("data-sim-id");
        if (simId && this.simulations.length > 1) {
          this.deleteSimulation(simId);
        }
        return;
      }

      const tab = target.closest(".sim-tab");
      const simId = tab?.getAttribute("data-sim-id");
      if (simId && simId !== this.globalConfig.activeSimulationId) {
        this.globalConfig.activeSimulationId = simId;
        this.storage.saveGlobalConfig(this.globalConfig);
        this.render();
        this.recomputeChart();
      }
    });

    document.getElementById("sim-tabs")?.addEventListener("dblclick", (e) => {
      const target = e.target as HTMLElement;
      const nameSpan = target.closest(".sim-tab-name");
      if (nameSpan) {
        const simId = nameSpan.getAttribute("data-sim-id");
        if (simId) {
          this.uiState.editingTabId = simId;
          this.render();
          const input = document.querySelector(
            `.sim-tab-input[data-sim-id="${simId}"]`
          ) as HTMLInputElement;
          input?.focus();
          input?.select();
        }
      }
    });

    document.querySelectorAll(".sim-tab-input").forEach((input) => {
      const handleRename = () => {
        const simId = (input as HTMLInputElement).getAttribute("data-sim-id");
        const newName = (input as HTMLInputElement).value.trim();
        if (simId && newName) {
          const sim = this.simulations.find((s) => s.id === simId);
          if (sim) {
            sim.name = newName;
            this.storage.saveSimulation(sim);
          }
        }
        this.uiState.editingTabId = null;
        this.render();
      };
      input.addEventListener("blur", handleRename);
      input.addEventListener("keydown", (e) => {
        if ((e as KeyboardEvent).key === "Enter") handleRename();
        if ((e as KeyboardEvent).key === "Escape") {
          this.uiState.editingTabId = null;
          this.render();
        }
      });
    });

    document.getElementById("add-simulation")?.addEventListener("click", () => {
      const newSim: Simulation = {
        id: generateId(),
        name: `Simulation ${this.simulations.length + 1}`,
        agents: [],
        systemComplexity: 0.5,
        nChanges: 1000,
      };
      this.simulations.push(newSim);
      this.storage.saveSimulation(newSim);
      this.globalConfig.activeSimulationId = newSim.id;
      this.storage.saveGlobalConfig(this.globalConfig);
      this.uiState.settingsOpen = true;
      this.render();
      this.recomputeChart();
    });
  }

  private bindConfigEvents(): void {
    document
      .getElementById("complexity-slider")
      ?.addEventListener("input", (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        const valueDisplay = document.getElementById("complexity-value");
        if (valueDisplay) valueDisplay.textContent = value.toFixed(2);
        this.scheduleComplexityUpdate(value);
      });

    document
      .getElementById("complexity-description")
      ?.addEventListener("input", (e) => {
        const value = (e.target as HTMLInputElement).value;
        this.scheduleDescriptionUpdate(value);
      });

    document
      .getElementById("changes-select")
      ?.addEventListener("change", (e) => {
        const value = parseInt((e.target as HTMLSelectElement).value, 10);
        const sim = this.activeSimulation;
        if (value !== sim.nChanges) {
          sim.nChanges = value;
          this.storage.saveSimulation(sim);
          this.recomputeChart();
        }
      });

    document.getElementById("duplicate-sim")?.addEventListener("click", () => {
      const sim = this.activeSimulation;
      const newSim: Simulation = {
        ...structuredClone(sim),
        id: generateId(),
        name: `${sim.name} (copy)`,
        agents: sim.agents.map((a) => ({ ...a, id: generateId() })),
      };
      this.simulations.push(newSim);
      this.storage.saveSimulation(newSim);
      this.globalConfig.activeSimulationId = newSim.id;
      this.storage.saveGlobalConfig(this.globalConfig);
      this.render();
      this.recomputeChart();
    });

    document.getElementById("export-sim")?.addEventListener("click", () => {
      const sim = this.activeSimulation;
      const blob = new Blob([JSON.stringify(sim, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sim.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  private scheduleComplexityUpdate(value: number): void {
    if (this.updateDebounceTimer) clearTimeout(this.updateDebounceTimer);
    this.updateDebounceTimer = setTimeout(() => {
      const sim = this.activeSimulation;
      sim.systemComplexity = value;
      if (!sim.complexityDescription) {
        const descInput = document.getElementById(
          "complexity-description"
        ) as HTMLInputElement;
        if (descInput) {
          descInput.value = getDefaultComplexityDescription(value);
        }
      }
      this.storage.saveSimulation(sim);
      this.updateComplexityDisplay();
      this.recomputeChart();
    }, 300);
  }

  private scheduleDescriptionUpdate(value: string): void {
    if (this.updateDebounceTimer) clearTimeout(this.updateDebounceTimer);
    this.updateDebounceTimer = setTimeout(() => {
      const sim = this.activeSimulation;
      sim.complexityDescription = value || undefined;
      this.storage.saveSimulation(sim);
      this.updateComplexityDisplay();
    }, 300);
  }

  private bindAgentEvents(): void {
    const agentList = document.getElementById("agent-list");
    agentList?.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      const card = target.closest(".agent-card");
      const agentId = card?.getAttribute("data-agent-id");
      const field = target.getAttribute("data-field");
      if (!agentId || !field) return;

      const sim = this.activeSimulation;
      const agent = sim.agents.find((a) => a.id === agentId);
      if (!agent) return;

      if (field === "name") {
        agent.name = (target as HTMLInputElement).value;
        this.scheduleChartUpdate();
      } else if (field === "rigor") {
        agent.engineeringRigor = parseFloat((target as HTMLInputElement).value);
        const label = card?.querySelector(".agent-rigor-label");
        if (label)
          label.textContent = `Eng. Rigor: ${agent.engineeringRigor.toFixed(
            2
          )}`;
        this.scheduleChartUpdate();
      } else if (field === "color") {
        agent.color = (target as HTMLInputElement).value;
        this.scheduleChartUpdate();
      } else if (field === "handoff") {
        agent.handoffToId = (target as HTMLSelectElement).value || undefined;
        this.storage.saveSimulation(sim);
        this.recomputeChart();
      }
    });

    agentList?.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      const field = target.getAttribute("data-field");
      if (field === "name" || field === "rigor" || field === "color") {
        this.storage.saveSimulation(this.activeSimulation);
      }
    });

    agentList?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const removeBtn = target.closest("[data-action='remove']");
      if (!removeBtn) return;

      const card = removeBtn.closest(".agent-card");
      const agentId = card?.getAttribute("data-agent-id");
      const sim = this.activeSimulation;
      if (!agentId || sim.agents.length <= 1) return;

      sim.agents = sim.agents.filter((a) => a.id !== agentId);
      sim.agents.forEach((a) => {
        if (a.handoffToId === agentId) a.handoffToId = undefined;
      });
      this.storage.saveSimulation(sim);
      card?.remove();
      this.recomputeChart();
    });

    document.getElementById("add-agent")?.addEventListener("click", () => {
      const sim = this.activeSimulation;
      const usedColors = sim.agents.map((a) => a.color);
      const newAgent: AgentConfig = {
        id: generateId(),
        name: "New Developer",
        engineeringRigor: 0.5,
        color: getNextColor(usedColors),
      };
      sim.agents.push(newAgent);
      this.storage.saveSimulation(sim);
      document
        .getElementById("agent-list")
        ?.insertAdjacentHTML("beforeend", buildAgentCard(newAgent, sim.agents));
      this.recomputeChart();
    });

    document.getElementById("reset-agents")?.addEventListener("click", () => {
      const defaultData = createDefaultAppData();
      const defaultSim = defaultData.simulations[0];
      if (defaultSim) {
        const idMap = new Map<string, string>();
        const newAgents = defaultSim.agents.map((a) => {
          const newId = generateId();
          idMap.set(a.id, newId);
          return { ...a, id: newId };
        });
        newAgents.forEach((a) => {
          if (a.handoffToId) {
            a.handoffToId = idMap.get(a.handoffToId) ?? a.handoffToId;
          }
        });
        this.activeSimulation.agents = newAgents;
        this.storage.saveSimulation(this.activeSimulation);
        const agentList = document.getElementById("agent-list");
        if (agentList) {
          agentList.innerHTML = this.activeSimulation.agents
            .map((a) => buildAgentCard(a, this.activeSimulation.agents))
            .join("");
        }
        this.recomputeChart();
      }
    });
  }

  private bindChartControls(): void {
    document.getElementById("reset-zoom")?.addEventListener("click", () => {
      this.chart?.resetZoom();
    });

    document.getElementById("show-all")?.addEventListener("click", () => {
      if (!this.chart) return;
      this.chart.data.datasets.forEach((_, i) => {
        this.chart!.getDatasetMeta(i).hidden = false;
      });
      this.chart.update();
    });

    document.getElementById("clear-all")?.addEventListener("click", () => {
      if (!this.chart) return;
      this.chart.data.datasets.forEach((_, i) => {
        this.chart!.getDatasetMeta(i).hidden = true;
      });
      this.chart.update();
    });
  }

  private bindGlobalSettingsEvents(): void {
    const closeModal = () => {
      this.uiState.globalSettingsOpen = false;
      document
        .getElementById("global-modal-overlay")
        ?.classList.remove("visible");
    };

    document
      .getElementById("close-global-modal")
      ?.addEventListener("click", closeModal);
    document
      .getElementById("global-modal-overlay")
      ?.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).id === "global-modal-overlay")
          closeModal();
      });

    document
      .getElementById("visibility-toggle")
      ?.addEventListener("change", (e) => {
        this.globalConfig.defaultVisibility = (e.target as HTMLInputElement)
          .checked
          ? "all"
          : "averages-only";
        this.storage.saveGlobalConfig(this.globalConfig);
        this.recomputeChart();
      });

    document.getElementById("reset-all-data")?.addEventListener("click", () => {
      if (
        confirm(
          "This will reset ALL simulations and settings to defaults. Are you sure?"
        )
      ) {
        this.storage.clearAll();
        this.simulations = this.storage.getSimulations();
        this.globalConfig = this.storage.getGlobalConfig();
        this.render();
        this.recomputeChart();
      }
    });
  }

  private deleteSimulation(simId: string): void {
    if (this.simulations.length <= 1) return;
    this.storage.deleteSimulation(simId);
    this.simulations = this.simulations.filter((s) => s.id !== simId);
    if (this.globalConfig.activeSimulationId === simId) {
      this.globalConfig.activeSimulationId = this.simulations[0].id;
      this.storage.saveGlobalConfig(this.globalConfig);
    }
    this.render();
    this.recomputeChart();
  }

  private updateComplexityDisplay(): void {
    const sim = this.activeSimulation;
    const descEl = document.querySelector(".complexity-description");
    if (descEl) {
      descEl.textContent = `${this.getDescription(
        sim
      )} (SC = ${sim.systemComplexity.toFixed(2)})`;
    }
  }

  private scheduleChartUpdate(): void {
    if (this.updateDebounceTimer) clearTimeout(this.updateDebounceTimer);
    this.updateDebounceTimer = setTimeout(() => {
      this.storage.saveSimulation(this.activeSimulation);
      this.recomputeChart();
    }, 300);
  }

  private recomputeChart(): void {
    const container = document.getElementById("chart-container");
    if (!container) return;

    container.innerHTML = `<div class="loading"><div class="loading-spinner"></div>Computing simulations...</div>`;

    setTimeout(() => {
      const sim = this.activeSimulation;
      const datasets = buildDatasetsForAgents(
        sim.agents,
        { systemComplexity: sim.systemComplexity, nChanges: sim.nChanges },
        this.globalConfig.defaultVisibility
      );

      container.innerHTML = `<canvas id="trend" aria-label="Product Health trajectories" role="img"></canvas>`;
      const canvas = document.getElementById("trend") as HTMLCanvasElement;
      if (!canvas) return;

      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(canvas, {
        type: "line",
        data: { datasets },
        options: chartOptions,
      });
    }, 10);
  }
}
