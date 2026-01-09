import Chart from "chart.js/auto";
import { Filler } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";
import "hammerjs";

import { chartOptions, buildDatasetsForSimulation } from "./chart";
import { LocalStorageAdapter } from "./storage";
import {
  createDefaultAppData,
  generateId,
  getNextColor,
  getDefaultComplexityDescription,
} from "./defaults";
import { adjustColor } from "./chart/colors";
import {
  buildHeader,
  buildSimulationTabs,
  buildConfigPanel,
  buildDeveloperCard,
  buildHandoffCard,
  buildChartControls,
  buildChartContainer,
  buildComplexityDescription,
  buildGlobalSettingsModal,
} from "./templates";
import type {
  StorageService,
  Simulation,
  DeveloperConfig,
  HandoffConfig,
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
        nChanges: this.activeSimulation.nChanges,
      })}
    `;
  }

  private bindEvents(): void {
    this.bindHeaderEvents();
    this.bindSimulationTabEvents();
    this.bindConfigEvents();
    this.bindDeveloperEvents();
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
    document
      .getElementById("sim-tabs-mobile")
      ?.addEventListener("change", (e) => {
        const simId = (e.target as HTMLSelectElement).value;
        if (simId && simId !== this.globalConfig.activeSimulationId) {
          this.globalConfig.activeSimulationId = simId;
          this.storage.saveGlobalConfig(this.globalConfig);
          this.render();
          this.recomputeChart();
        }
      });

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
        developers: [],
        handoffs: [],
        systemComplexity: 0.5,
        nChanges: 1000,
        startingHealth: 8,
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

    document
      .getElementById("starting-health-slider")
      ?.addEventListener("input", (e) => {
        const value = parseInt((e.target as HTMLInputElement).value, 10);
        const valueDisplay = document.getElementById("starting-health-value");
        if (valueDisplay) valueDisplay.textContent = String(value);
        this.scheduleStartingHealthUpdate(value);
      });

    document.getElementById("duplicate-sim")?.addEventListener("click", () => {
      const sim = this.activeSimulation;
      const idMap = new Map<string, string>();
      const newDevelopers = sim.developers.map((a) => {
        const newId = generateId();
        idMap.set(a.id, newId);
        return { ...a, id: newId };
      });
      const newHandoffs = sim.handoffs.map((h) => ({
        ...h,
        id: generateId(),
        fromDeveloperId: idMap.get(h.fromDeveloperId) ?? h.fromDeveloperId,
        toDeveloperId: idMap.get(h.toDeveloperId) ?? h.toDeveloperId,
      }));

      const newSim: Simulation = {
        ...structuredClone(sim),
        id: generateId(),
        name: `${sim.name} (copy)`,
        developers: newDevelopers,
        handoffs: newHandoffs,
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

  private scheduleStartingHealthUpdate(value: number): void {
    if (this.updateDebounceTimer) clearTimeout(this.updateDebounceTimer);
    this.updateDebounceTimer = setTimeout(() => {
      const sim = this.activeSimulation;
      sim.startingHealth = value;
      this.storage.saveSimulation(sim);
      this.recomputeChart();
    }, 300);
  }

  private bindDeveloperEvents(): void {
    const developerList = document.getElementById("developer-list");
    developerList?.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      const card = target.closest(".developer-card");
      const developerId = card?.getAttribute("data-developer-id");
      const field = target.getAttribute("data-field");
      if (!developerId || !field) return;

      const sim = this.activeSimulation;
      const developer = sim.developers.find((a) => a.id === developerId);
      if (!developer) return;

      if (field === "name") {
        developer.name = (target as HTMLInputElement).value;
        this.scheduleChartUpdate();
      } else if (field === "rigor") {
        developer.engineeringRigor = parseFloat(
          (target as HTMLInputElement).value
        );
        const label = card?.querySelector(".developer-rigor-label");
        if (label)
          label.textContent = `Eng. Rigor: ${developer.engineeringRigor.toFixed(
            2
          )}`;
        this.scheduleChartUpdate();
      } else if (field === "color") {
        developer.color = (target as HTMLInputElement).value;
        this.updateHandoffIcons();
        this.scheduleChartUpdate();
      }
    });

    developerList?.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      const field = target.getAttribute("data-field");
      if (field === "name" || field === "rigor" || field === "color") {
        this.storage.saveSimulation(this.activeSimulation);
      }
    });

    developerList?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const removeBtn = target.closest("[data-action='remove-developer']");
      if (!removeBtn) return;

      const card = removeBtn.closest(".developer-card");
      const developerId = card?.getAttribute("data-developer-id");
      const sim = this.activeSimulation;
      if (!developerId) return;

      sim.developers = sim.developers.filter((a) => a.id !== developerId);
      sim.handoffs = sim.handoffs.filter(
        (h) =>
          h.fromDeveloperId !== developerId && h.toDeveloperId !== developerId
      );
      this.storage.saveSimulation(sim);
      card?.remove();
      this.recomputeChart();
    });

    document.getElementById("add-developer")?.addEventListener("click", () => {
      const sim = this.activeSimulation;
      const usedColors = [...sim.developers.map((a) => a.color)];
      const newDeveloper: DeveloperConfig = {
        id: generateId(),
        name: "New Developer",
        engineeringRigor: 0.5,
        color: getNextColor(usedColors),
      };
      sim.developers.push(newDeveloper);
      this.storage.saveSimulation(sim);
      document
        .getElementById("developer-list")
        ?.insertAdjacentHTML("beforeend", buildDeveloperCard(newDeveloper));
      this.recomputeChart();
    });

    // Handoff Events
    const handoffList = document.getElementById("handoff-list");
    handoffList?.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      const card = target.closest(".handoff-card");
      const handoffId = card?.getAttribute("data-handoff-id");
      const field = target.getAttribute("data-field");
      if (!handoffId || !field) return;

      const sim = this.activeSimulation;
      const handoff = sim.handoffs.find((h) => h.id === handoffId);
      if (!handoff) return;

      if (field === "name") {
        handoff.name = (target as HTMLInputElement).value;
        this.scheduleChartUpdate();
      } else if (field === "fromDeveloperId") {
        handoff.fromDeveloperId = (target as HTMLSelectElement).value;
        const icon = card?.querySelector(".handoff-color-icon") as HTMLElement;
        if (icon)
          icon.setAttribute("data-from-developer-id", handoff.fromDeveloperId);
        this.updateHandoffIcons();
        this.scheduleChartUpdate();
      } else if (field === "toDeveloperId") {
        handoff.toDeveloperId = (target as HTMLSelectElement).value;
        const icon = card?.querySelector(".handoff-color-icon") as HTMLElement;
        if (icon)
          icon.setAttribute("data-to-developer-id", handoff.toDeveloperId);
        this.updateHandoffIcons();
        this.scheduleChartUpdate();
      } else if (field === "atChange") {
        handoff.atChange = parseInt((target as HTMLInputElement).value, 10);
        const label = card?.querySelector(".developer-rigor-label");
        if (label) label.textContent = `Handoff at: ${handoff.atChange}`;
        this.scheduleChartUpdate();
      }
    });

    handoffList?.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      const field = target.getAttribute("data-field");
      if (field) {
        this.storage.saveSimulation(this.activeSimulation);
      }
    });

    handoffList?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const removeBtn = target.closest("[data-action='remove-handoff']");
      if (!removeBtn) return;

      const card = removeBtn.closest(".handoff-card");
      const handoffId = card?.getAttribute("data-handoff-id");
      const sim = this.activeSimulation;
      if (!handoffId) return;

      sim.handoffs = sim.handoffs.filter((h) => h.id !== handoffId);
      this.storage.saveSimulation(sim);
      card?.remove();
      this.recomputeChart();
    });

    document.getElementById("add-handoff")?.addEventListener("click", () => {
      const sim = this.activeSimulation;
      if (sim.developers.length < 2) {
        alert("You need at least two developers to create a handoff.");
        return;
      }
      const newHandoff: HandoffConfig = {
        id: generateId(),
        name: "New Handoff",
        fromDeveloperId: sim.developers[0].id,
        toDeveloperId: sim.developers[1].id,
        atChange: Math.round(sim.nChanges * 0.2),
      };
      sim.handoffs.push(newHandoff);
      this.storage.saveSimulation(sim);
      document
        .getElementById("handoff-list")
        ?.insertAdjacentHTML(
          "beforeend",
          buildHandoffCard(newHandoff, sim.developers, sim.nChanges)
        );
      this.recomputeChart();
    });

    document.getElementById("reset-defaults")?.addEventListener("click", () => {
      const defaultData = createDefaultAppData();
      const defaultSim = defaultData.simulations.find(
        (s) => s.systemComplexity === this.activeSimulation.systemComplexity
      );
      if (defaultSim) {
        const idMap = new Map<string, string>();
        const newDevelopers = defaultSim.developers.map((a) => {
          const newId = generateId();
          idMap.set(a.id, newId);
          return { ...a, id: newId };
        });
        const newHandoffs = defaultSim.handoffs.map((h) => ({
          ...h,
          id: generateId(),
          fromDeveloperId: idMap.get(h.fromDeveloperId) ?? h.fromDeveloperId,
          toDeveloperId: idMap.get(h.toDeveloperId) ?? h.toDeveloperId,
        }));

        this.activeSimulation.developers = newDevelopers;
        this.activeSimulation.handoffs = newHandoffs;
        this.activeSimulation.startingHealth = defaultSim.startingHealth;
        this.storage.saveSimulation(this.activeSimulation);
        this.render();
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

    document
      .getElementById("toggle-developers")
      ?.addEventListener("click", () => {
        if (!this.chart) return;
        const sim = this.activeSimulation;
        const developerCount = sim.developers.length * 3;
        this.chart.data.datasets.forEach((_, i) => {
          const isDeveloper = i < developerCount;
          this.chart!.getDatasetMeta(i).hidden = !isDeveloper;
        });
        this.chart.update();
      });

    document
      .getElementById("toggle-handoffs")
      ?.addEventListener("click", () => {
        if (!this.chart) return;
        const sim = this.activeSimulation;
        const developerCount = sim.developers.length * 3;
        this.chart.data.datasets.forEach((_, i) => {
          const isDeveloper = i < developerCount;
          this.chart!.getDatasetMeta(i).hidden = isDeveloper;
        });
        this.chart.update();
      });
  }

  private bindGlobalSettingsEvents(): void {
    document
      .getElementById("close-global-modal")
      ?.addEventListener("click", () => this.closeGlobalSettings());
    document
      .getElementById("global-modal-overlay")
      ?.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).id === "global-modal-overlay")
          this.closeGlobalSettings();
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

    document
      .getElementById("shape-scale-slider")
      ?.addEventListener("input", (e) => {
        const value = parseInt((e.target as HTMLInputElement).value, 10);
        const valueDisplay = document.getElementById("shape-scale-value");
        if (valueDisplay) valueDisplay.textContent = String(value);
        this.scheduleAnnotationPositionUpdate(value);
      });

    document
      .getElementById("annotation-label-input")
      ?.addEventListener("input", (e) => {
        const label = (e.target as HTMLInputElement).value;
        this.scheduleAnnotationLabelUpdate(label);
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
        this.closeGlobalSettings();
        this.render();
        this.recomputeChart();
      }
    });
  }

  private scheduleAnnotationPositionUpdate(value: number): void {
    if (this.updateDebounceTimer) clearTimeout(this.updateDebounceTimer);
    this.updateDebounceTimer = setTimeout(() => {
      this.globalConfig.shapeScaleAnnotationPosition = value;
      this.storage.saveGlobalConfig(this.globalConfig);
      this.updateChartAnnotation();
    }, 100);
  }

  private scheduleAnnotationLabelUpdate(label: string): void {
    if (this.updateDebounceTimer) clearTimeout(this.updateDebounceTimer);
    this.updateDebounceTimer = setTimeout(() => {
      this.globalConfig.shapeScaleAnnotationLabel = label;
      this.storage.saveGlobalConfig(this.globalConfig);
      this.updateChartAnnotation();
    }, 100);
  }

  private updateChartAnnotation(): void {
    if (!this.chart) return;
    const annotation = (this.chart.options.plugins?.annotation as any)
      ?.annotations?.shapeScale;
    if (annotation) {
      const position = this.globalConfig.shapeScaleAnnotationPosition ?? 0;
      const label =
        this.globalConfig.shapeScaleAnnotationLabel ?? "Shape → Scale";
      annotation.xMin = position;
      annotation.xMax = position;
      annotation.label.content = label;
      this.chart.update();
    }
  }

  private closeGlobalSettings(): void {
    this.uiState.globalSettingsOpen = false;
    document
      .getElementById("global-modal-overlay")
      ?.classList.remove("visible");
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

  private updateHandoffIcons(): void {
    const sim = this.activeSimulation;
    const handoffIcons = document.querySelectorAll<HTMLElement>(
      ".handoff-color-icon"
    );
    handoffIcons.forEach((icon) => {
      const fromId = icon.getAttribute("data-from-developer-id");
      const toId = icon.getAttribute("data-to-developer-id");
      const fromDeveloper = sim.developers.find((a) => a.id === fromId);
      const toDeveloper = sim.developers.find((a) => a.id === toId);
      if (fromDeveloper && toDeveloper) {
        const fromColor = adjustColor(fromDeveloper.color, -20);
        const toColor = adjustColor(toDeveloper.color, -20);
        icon.style.background = `linear-gradient(90deg, ${fromColor} 50%, ${toColor} 50%)`;
      }
    });
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
      const datasets = buildDatasetsForSimulation(
        sim.developers,
        sim.handoffs,
        {
          systemComplexity: sim.systemComplexity,
          nChanges: sim.nChanges,
          startingHealth: sim.startingHealth ?? 8,
        },
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

      this.updateChartAnnotation();
    }, 10);
  }
}
