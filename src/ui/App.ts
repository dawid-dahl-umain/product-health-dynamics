import Chart from "chart.js/auto";
import { Filler } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";
import "hammerjs";
import mermaid from "mermaid";

import {
  chartOptions,
  buildDatasetsForSimulation,
  setChartClickHandler,
  updateChartVisibilityState,
  setVisibilityChangeHandler,
} from "./chart";
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
  buildPHInsightModal,
  buildHelpGuideModal,
  getComplexityLevel,
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
  helpGuideOpen: boolean;
  editingTabId: string | null;
  phInsight: {
    visible: boolean;
    developerName: string;
    changeNumber: number;
    healthValue: number;
  } | null;
};

export class ProductHealthApp {
  private storage: StorageService;
  private globalConfig: GlobalConfig;
  private simulations: Simulation[];
  private uiState: UIState = {
    settingsOpen: false,
    globalSettingsOpen: false,
    helpGuideOpen: false,
    editingTabId: null,
    phInsight: null,
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

    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        darkMode: true,
        background: "#0f172a",
        primaryColor: "#1e40af",
        primaryTextColor: "#fff",
        primaryBorderColor: "#60a5fa",
        lineColor: "#94a3b8",
        secondaryColor: "#9a3412",
        tertiaryColor: "#166534",
      },
    });

    setChartClickHandler((developerName, changeNumber, healthValue) => {
      this.openPHInsightModal(developerName, changeNumber, healthValue);
    });

    setVisibilityChangeHandler(() => {
      this.saveVisibilityState();
    });
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
      ${buildPHInsightModal({
        isVisible: this.uiState.phInsight?.visible ?? false,
        developerName: this.uiState.phInsight?.developerName ?? "",
        changeNumber: this.uiState.phInsight?.changeNumber ?? 0,
        healthValue: this.uiState.phInsight?.healthValue ?? 8,
      })}
      ${buildHelpGuideModal({
        isVisible: this.uiState.helpGuideOpen,
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
    this.bindHelpGuideEvents();
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
          this.recomputeChart();
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
        this.recomputeChart();
      };
      input.addEventListener("blur", handleRename);
      input.addEventListener("keydown", (e) => {
        if ((e as KeyboardEvent).key === "Enter") handleRename();
        if ((e as KeyboardEvent).key === "Escape") {
          this.uiState.editingTabId = null;
          this.render();
          this.recomputeChart();
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
        hiddenDatasetIndices: undefined,
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

    document
      .getElementById("delete-current-sim")
      ?.addEventListener("click", () => {
        if (this.simulations.length <= 1) {
          alert("You cannot delete the only simulation.");
          return;
        }
        if (
          confirm(
            `Are you sure you want to delete simulation "${this.activeSimulation.name}"?`
          )
        ) {
          this.deleteSimulation(this.activeSimulation.id);
        }
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
      this.clearVisibilityState();
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
      this.clearVisibilityState();
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
      this.clearVisibilityState();
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
      this.clearVisibilityState();
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
        this.activeSimulation.hiddenDatasetIndices = undefined;
        this.storage.saveSimulation(this.activeSimulation);
        this.render();
        this.recomputeChart();
      }
    });
  }

  private bindChartControls(): void {
    const resetZoom = () => this.chart?.resetZoom();
    const resimulate = () => this.recomputeChart();

    const showAll = () => {
      if (!this.chart) return;
      const showBands = this.globalConfig.defaultVisibility === "all";

      this.chart.data.datasets.forEach((_, i) => {
        const isBand = i % 3 !== 2;
        if (isBand) {
          this.chart!.getDatasetMeta(i).hidden = !showBands;
        } else {
        this.chart!.getDatasetMeta(i).hidden = false;
        }
      });
      this.chart.update();
      this.saveVisibilityState();
    };

    const clearAll = () => {
      if (!this.chart) return;
      this.chart.data.datasets.forEach((_, i) => {
        this.chart!.getDatasetMeta(i).hidden = true;
      });
      this.chart.update();
      this.saveVisibilityState();
    };

    const toggleDevelopers = () => {
      if (!this.chart) return;
      const sim = this.activeSimulation;
      const developerCount = sim.developers.length * 3;
      const showBands = this.globalConfig.defaultVisibility === "all";

      this.chart.data.datasets.forEach((_, i) => {
        const isDeveloper = i < developerCount;
        const isBand = i % 3 !== 2;

        if (isDeveloper) {
          if (isBand) {
            this.chart!.getDatasetMeta(i).hidden = !showBands;
          } else {
            this.chart!.getDatasetMeta(i).hidden = false;
          }
        } else {
          this.chart!.getDatasetMeta(i).hidden = true;
        }
      });
      this.chart.update();
      this.saveVisibilityState();
    };

    const toggleHandoffs = () => {
      if (!this.chart) return;
      const sim = this.activeSimulation;
      const developerCount = sim.developers.length * 3;
      const showBands = this.globalConfig.defaultVisibility === "all";

      this.chart.data.datasets.forEach((_, i) => {
        const isDeveloper = i < developerCount;
        const isBand = i % 3 !== 2;

        if (!isDeveloper) {
          if (isBand) {
            this.chart!.getDatasetMeta(i).hidden = !showBands;
          } else {
            this.chart!.getDatasetMeta(i).hidden = false;
          }
        } else {
          this.chart!.getDatasetMeta(i).hidden = true;
        }
      });
      this.chart.update();
      this.saveVisibilityState();
    };

    document.getElementById("reset-zoom")?.addEventListener("click", resetZoom);
    document
      .getElementById("resimulate")
      ?.addEventListener("click", resimulate);
    document.getElementById("show-all")?.addEventListener("click", showAll);
    document.getElementById("clear-all")?.addEventListener("click", clearAll);
    document
      .getElementById("toggle-developers")
      ?.addEventListener("click", toggleDevelopers);
    document
      .getElementById("toggle-handoffs")
      ?.addEventListener("click", toggleHandoffs);

    document
      .getElementById("reset-zoom-mobile")
      ?.addEventListener("click", resetZoom);
    document
      .getElementById("resimulate-mobile")
      ?.addEventListener("click", resimulate);
    document
      .getElementById("show-all-mobile")
      ?.addEventListener("click", () => {
        showAll();
        this.closeMobileControlsDropdown();
      });
    document
      .getElementById("clear-all-mobile")
      ?.addEventListener("click", () => {
        clearAll();
        this.closeMobileControlsDropdown();
      });
    document
      .getElementById("toggle-developers-mobile")
      ?.addEventListener("click", () => {
        toggleDevelopers();
        this.closeMobileControlsDropdown();
      });
    document
      .getElementById("toggle-handoffs-mobile")
      ?.addEventListener("click", () => {
        toggleHandoffs();
        this.closeMobileControlsDropdown();
      });

    document.getElementById("controls-more")?.addEventListener("click", () => {
      const dropdown = document.getElementById("controls-dropdown");
      dropdown?.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const dropdown = document.getElementById("controls-dropdown");
      const moreBtn = document.getElementById("controls-more");
      if (
        dropdown?.classList.contains("open") &&
        !dropdown.contains(target) &&
        target !== moreBtn
      ) {
        dropdown.classList.remove("open");
      }
    });
  }

  private closeMobileControlsDropdown(): void {
    document.getElementById("controls-dropdown")?.classList.remove("open");
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
        
        this.resetAllSimulationsVisibilityOverrides();
        this.storage.saveGlobalConfig(this.globalConfig);
        this.recomputeChart();
      });

    document
      .getElementById("trajectories-visibility-toggle")
      ?.addEventListener("change", (e) => {
        this.globalConfig.showTrajectoriesByDefault = (
          e.target as HTMLInputElement
        ).checked;
        
        this.resetAllSimulationsVisibilityOverrides();

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

    const runsInput = document.getElementById(
      "simulation-runs-input"
    ) as HTMLInputElement;
    runsInput?.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const val = parseInt(target.value, 10);
      const hint =
        target.parentElement?.previousElementSibling?.querySelector(
          ".modal-hint"
        );

      if (val > 800) {
        target.style.borderColor = "var(--color-danger)";
        if (hint) {
          hint.textContent = "Maximum allowed is 800 runs";
          (hint as HTMLElement).style.color = "var(--color-danger)";
        }
        if (this.updateDebounceTimer) clearTimeout(this.updateDebounceTimer);
      } else if (val < 50) {
        target.style.borderColor = "var(--color-danger)";
        if (hint) {
          hint.textContent = "Minimum required is 50 runs";
          (hint as HTMLElement).style.color = "var(--color-danger)";
        }
        if (this.updateDebounceTimer) clearTimeout(this.updateDebounceTimer);
      } else {
        target.style.borderColor = "";
        if (hint) {
          hint.textContent =
            "Number of simulations to average (max 800). Higher values are smoother but slower.";
          (hint as HTMLElement).style.color = "";
        }
        this.scheduleSimulationRunsUpdate(val);
      }
    });

    runsInput?.addEventListener("blur", (e) => {
      const target = e.target as HTMLInputElement;
      let val = parseInt(target.value, 10);
      const hint =
        target.parentElement?.previousElementSibling?.querySelector(
          ".modal-hint"
        );

      let corrected = false;
      if (val > 800) {
        val = 800;
        corrected = true;
      } else if (val < 50 || isNaN(val)) {
        val = 50;
        corrected = true;
      }

      if (corrected) {
        target.value = String(val);
        target.style.borderColor = "";
        if (hint) {
          hint.textContent =
            "Number of simulations to average (max 800). Higher values are smoother but slower.";
          (hint as HTMLElement).style.color = "";
        }
        this.scheduleSimulationRunsUpdate(val);
      }
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

  private bindHelpGuideEvents(): void {
    document
      .getElementById("open-insight-guide")
      ?.addEventListener("click", () => {
        this.uiState.helpGuideOpen = true;
        document
          .getElementById("help-guide-modal-overlay")
          ?.classList.add("visible");
      });

    document.querySelectorAll(".help-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLElement;
        const tabId = target.dataset.tab;
        if (!tabId) return;

        document
          .querySelectorAll(".help-tab")
          .forEach((t) => t.classList.remove("active"));
        document
          .querySelectorAll(".help-tab-panel")
          .forEach((p) => p.classList.remove("active"));

        target.classList.add("active");
        document.getElementById(`tab-${tabId}`)?.classList.add("active");

        if (tabId === "model") {
          this.renderMermaidDiagram();
        }
      });
    });

    document
      .getElementById("close-help-guide-modal")
      ?.addEventListener("click", () => this.closeHelpGuide());

    document
      .getElementById("help-guide-modal-overlay")
      ?.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).id === "help-guide-modal-overlay")
          this.closeHelpGuide();
      });
  }

  private closeHelpGuide(): void {
    this.uiState.helpGuideOpen = false;
    document
      .getElementById("help-guide-modal-overlay")
      ?.classList.remove("visible");
  }

  private mermaidRendered = false;
  private mermaidZoom = 100;

  private async renderMermaidDiagram(): Promise<void> {
    if (this.mermaidRendered) return;

    const container = document.querySelector(".mermaid-container .mermaid");
    if (!container) return;

    await mermaid.run({ nodes: [container as HTMLElement] });
    this.mermaidRendered = true;
    this.bindMermaidZoomControls();
  }

  private bindMermaidZoomControls(): void {
    const zoomIn = document.getElementById("mermaid-zoom-in");
    const zoomOut = document.getElementById("mermaid-zoom-out");
    const zoomReset = document.getElementById("mermaid-zoom-reset");
    const panLeft = document.getElementById("mermaid-pan-left");
    const panRight = document.getElementById("mermaid-pan-right");
    const panUp = document.getElementById("mermaid-pan-up");
    const panDown = document.getElementById("mermaid-pan-down");

    zoomIn?.addEventListener("click", () =>
      this.setMermaidZoom(this.mermaidZoom + 100)
    );
    zoomOut?.addEventListener("click", () =>
      this.setMermaidZoom(this.mermaidZoom - 100)
    );
    zoomReset?.addEventListener("click", () => {
      this.setMermaidZoom(100);
      this.resetMermaidPan();
    });

    const panStep = 80;
    panLeft?.addEventListener("click", () => this.panMermaid(-panStep, 0));
    panRight?.addEventListener("click", () => this.panMermaid(panStep, 0));
    panUp?.addEventListener("click", () => this.panMermaid(0, -panStep));
    panDown?.addEventListener("click", () => this.panMermaid(0, panStep));
  }

  private panMermaid(dx: number, dy: number): void {
    const container = document.getElementById("mermaid-container");
    if (!container) return;
    container.scrollBy({ left: dx, top: dy, behavior: "smooth" });
  }

  private resetMermaidPan(): void {
    const container = document.getElementById("mermaid-container");
    if (!container) return;
    container.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  }

  private setMermaidZoom(level: number): void {
    this.mermaidZoom = Math.max(100, Math.min(600, level));

    const inner = document.getElementById("mermaid-inner");
    const levelDisplay = document.getElementById("mermaid-zoom-level");

    if (inner) {
      inner.style.transform = `scale(${this.mermaidZoom / 100})`;
    }
    if (levelDisplay) {
      levelDisplay.textContent = `${this.mermaidZoom}%`;
    }
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

  private scheduleSimulationRunsUpdate(value: number): void {
    if (this.updateDebounceTimer) clearTimeout(this.updateDebounceTimer);
    this.updateDebounceTimer = setTimeout(() => {
      this.globalConfig.simulationRuns = Math.max(50, Math.min(800, value));
      this.storage.saveGlobalConfig(this.globalConfig);
      this.recomputeChart();
    }, 500);
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

  private openPHInsightModal(
    developerName: string,
    changeNumber: number,
    healthValue: number
  ): void {
    this.uiState.phInsight = {
      visible: true,
      developerName,
      changeNumber,
      healthValue,
    };

    const existingModal = document.getElementById("ph-insight-modal-overlay");
    if (existingModal) {
      existingModal.remove();
    }

    const modalHtml = buildPHInsightModal({
      isVisible: true,
      developerName,
      changeNumber,
      healthValue,
    });
    this.root.insertAdjacentHTML("beforeend", modalHtml);
    this.bindPHInsightModalEvents();

    if (healthValue >= 8) {
      this.triggerConfetti(healthValue >= 9 ? "high" : "low");
    }
  }

  private triggerConfetti(intensity: "high" | "low"): void {
    const container = document.createElement("div");
    container.className = "confetti-container";
    document.body.appendChild(container);

    const count = intensity === "high" ? 50 : 20;
    const colors =
      intensity === "high"
        ? ["#10b981", "#22c55e", "#84cc16", "#fbbf24", "#60a5fa"]
        : ["#84cc16", "#a3e635", "#d9f99d"];

    for (let i = 0; i < count; i++) {
      const confetti = document.createElement("div");
      confetti.className = `confetti ${intensity === "low" ? "subtle" : ""}`;
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), 3500);
  }

  private closePHInsightModal(): void {
    this.uiState.phInsight = null;
    document
      .getElementById("ph-insight-modal-overlay")
      ?.classList.remove("visible");
  }

  private bindPHInsightModalEvents(): void {
    document
      .getElementById("close-ph-insight-modal")
      ?.addEventListener("click", () => this.closePHInsightModal());
    document
      .getElementById("ph-insight-modal-overlay")
      ?.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).id === "ph-insight-modal-overlay")
          this.closePHInsightModal();
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
    const level = getComplexityLevel(sim.systemComplexity);

    const badgeEl = document.querySelector(".complexity-badge") as HTMLElement;
    if (badgeEl) {
      badgeEl.style.setProperty("--badge-color", level.color);
      badgeEl.innerHTML = `<span class="complexity-dot"></span>${level.label}`;
    }

    const descEl = document.querySelector(".complexity-description");
    if (descEl) {
      descEl.textContent = this.getDescription(sim);
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

    updateChartVisibilityState({
      showConfidenceBands: this.globalConfig.defaultVisibility === "all",
      showTrajectoriesByDefault: this.globalConfig.showTrajectoriesByDefault,
    });

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
          nSimulations: this.globalConfig.simulationRuns ?? 100,
        },
        this.globalConfig.defaultVisibility,
        this.globalConfig.showTrajectoriesByDefault
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

      this.restoreVisibilityState();
      this.updateChartAnnotation();
    }, 10);
  }

  private saveVisibilityState(): void {
    if (!this.chart) return;
    const hiddenIndices: number[] = [];
    this.chart.data.datasets.forEach((_, i) => {
      if (this.chart!.getDatasetMeta(i).hidden) {
        hiddenIndices.push(i);
      }
    });
    const sim = this.activeSimulation;
    sim.hiddenDatasetIndices = hiddenIndices;
    this.storage.saveSimulation(sim);
  }

  private clearVisibilityState(): void {
    const sim = this.activeSimulation;
    if (sim.hiddenDatasetIndices) {
      sim.hiddenDatasetIndices = undefined;
      this.storage.saveSimulation(sim);
    }
  }

  private restoreVisibilityState(): void {
    if (!this.chart) return;
    const sim = this.activeSimulation;
    const showBands = this.globalConfig.defaultVisibility === "all";
    const showTrajectories = this.globalConfig.showTrajectoriesByDefault;

    const hasOverrides = sim.hiddenDatasetIndices !== undefined;
    const hiddenIndices = sim.hiddenDatasetIndices ?? [];

    this.chart.data.datasets.forEach((_, i) => {
      const isBand = i % 3 !== 2;
      const manuallyHidden = hiddenIndices.includes(i);

      if (isBand) {
        const groupStart = Math.floor(i / 3) * 3;
        const trajectoryIndex = groupStart + 2;
        const trajectoryManuallyHidden = hiddenIndices.includes(trajectoryIndex);
        const isTrajectoryActuallyHidden =
          trajectoryManuallyHidden || (!hasOverrides && !showTrajectories);
        const shouldHideBand =
          manuallyHidden || !showBands || isTrajectoryActuallyHidden;

        this.chart!.getDatasetMeta(i).hidden = shouldHideBand;
      } else {
        const fallbackHiddenState = !hasOverrides && !showTrajectories;
        const shouldHideTrajectory = manuallyHidden || fallbackHiddenState;

        this.chart!.getDatasetMeta(i).hidden = shouldHideTrajectory;
      }
    });
    this.chart.update("none");
  }

  private resetAllSimulationsVisibilityOverrides(): void {
    this.simulations.forEach((sim) => {
      sim.hiddenDatasetIndices = undefined;
      this.storage.saveSimulation(sim);
    });
  }
}
