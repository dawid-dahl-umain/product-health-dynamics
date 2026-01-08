import Chart from "chart.js/auto";
import { Filler } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";
import "hammerjs";
import "./styles.css";

import { complexityProfiles, type ComplexityProfileKey } from "./simulation";
import { chartOptions } from "./chart/config";
import { buildDatasetsForAgents } from "./chart/datasets";
import {
  type AgentConfig,
  type UIState,
  DEFAULT_STATE,
  DEFAULT_AGENTS,
  CHANGES_OPTIONS,
  AGENT_COLORS,
} from "./ui/types";

Chart.register(annotationPlugin, zoomPlugin, Filler);

const ICON_SETTINGS = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
</svg>`;

const ICON_CLOSE = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
</svg>`;

class ProductHealthApp {
  private state: UIState = { ...DEFAULT_STATE, agents: [...DEFAULT_AGENTS] };
  private chart: Chart | null = null;
  private root: HTMLElement;
  private updateDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(rootSelector: string) {
    const el = document.querySelector<HTMLElement>(rootSelector);
    if (!el) throw new Error(`Root element ${rootSelector} not found`);
    this.root = el;
  }

  mount(): void {
    this.render();
    this.recomputeChart();
  }

  private render(): void {
    this.root.innerHTML = this.buildHtml();
    this.bindEvents();
  }

  private buildHtml(): string {
    const profile = complexityProfiles[this.state.complexity];
    return `
      <main>
        ${this.buildHeader()}
        ${this.buildConfigPanel()}
        <p class="complexity-description">${profile.description} (SC = ${
      profile.systemComplexity
    })</p>
        ${this.buildTabs()}
        <div id="chart-container">
          <div class="loading"><div class="loading-spinner"></div>Computing simulations...</div>
        </div>
        ${this.buildControls()}
      </main>
    `;
  }

  private buildHeader(): string {
    const activeClass = this.state.settingsOpen ? "active" : "";
    return `
      <div class="header">
        <h1>Product Health Trajectories</h1>
        <button class="settings-toggle ${activeClass}" id="settings-toggle">
          ${ICON_SETTINGS}
          Settings
        </button>
      </div>
    `;
  }

  private buildConfigPanel(): string {
    return `
      <div class="config-panel ${
        this.state.settingsOpen ? "open" : ""
      }" id="config-panel">
        <div class="config-section">
          <div class="config-row">
            <span class="config-label">Changes</span>
            <select id="changes-select">
              ${CHANGES_OPTIONS.map(
                (n) =>
                  `<option value="${n}" ${
                    n === this.state.nChanges ? "selected" : ""
                  }>${n.toLocaleString()}</option>`
              ).join("")}
            </select>
          </div>
        </div>
        <div class="config-section">
          <div class="config-section-header">
            <span class="config-section-title">Agents</span>
          </div>
          <div class="agent-list" id="agent-list">
            ${this.state.agents
              .map((agent) => this.buildAgentCard(agent))
              .join("")}
          </div>
          <div class="agent-actions">
            <button class="btn-secondary" id="add-agent">+ Add Agent</button>
            <button class="btn-secondary" id="reset-agents">Reset Defaults</button>
          </div>
        </div>
      </div>
    `;
  }

  private buildAgentCard(agent: AgentConfig): string {
    const handoffBadge = agent.enableHandoff
      ? `<span class="agent-handoff">→ Senior</span>`
      : "";
    const rigorValue = agent.engineeringRigor.toFixed(2);
    return `
      <div class="agent-card" data-agent-id="${agent.id}">
        <div class="agent-color" style="background: ${agent.color}"></div>
        <div class="agent-name">
          <input type="text" value="${agent.name}" data-field="name" />
        </div>
        ${handoffBadge}
        <div class="agent-rigor">
          <span class="agent-rigor-label">${rigorValue}</span>
          <input type="range" min="0.1" max="1" step="0.05" value="${agent.engineeringRigor}" data-field="rigor" />
        </div>
        <button class="agent-remove" data-action="remove">${ICON_CLOSE}</button>
      </div>
    `;
  }

  private buildTabs(): string {
    const tabs = (["simple", "medium", "enterprise"] as const)
      .map((key) => {
        const profile = complexityProfiles[key];
        const isActive = key === this.state.complexity;
        return `
          <button class="tab ${
            isActive ? "active" : ""
          }" data-complexity="${key}">
            ${profile.label}<span class="tab-indicator">SC=${
          profile.systemComplexity
        }</span>
          </button>
        `;
      })
      .join("");
    return `<div class="tabs">${tabs}</div>`;
  }

  private buildControls(): string {
    return `
      <div class="controls">
        <button id="reset-zoom">Reset View</button>
        <button id="show-all">Show All</button>
        <button id="clear-all">Clear All</button>
        <span class="hint">Click legend to toggle · Scroll to zoom · Drag to pan</span>
      </div>
    `;
  }

  private bindEvents(): void {
    this.bindSettingsToggle();
    this.bindChangesSelect();
    this.bindAgentEvents();
    this.bindTabEvents();
    this.bindChartControls();
  }

  private bindSettingsToggle(): void {
    document
      .getElementById("settings-toggle")
      ?.addEventListener("click", () => {
        this.state.settingsOpen = !this.state.settingsOpen;
        document
          .getElementById("config-panel")
          ?.classList.toggle("open", this.state.settingsOpen);
        document
          .getElementById("settings-toggle")
          ?.classList.toggle("active", this.state.settingsOpen);
      });
  }

  private bindChangesSelect(): void {
    document
      .getElementById("changes-select")
      ?.addEventListener("change", (e) => {
        const value = parseInt((e.target as HTMLSelectElement).value, 10);
        if (value !== this.state.nChanges) {
          this.state.nChanges = value;
          this.recomputeChart();
        }
      });
  }

  private bindAgentEvents(): void {
    document.getElementById("agent-list")?.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const card = target.closest(".agent-card");
      const agentId = card?.getAttribute("data-agent-id");
      const field = target.getAttribute("data-field");
      if (!agentId || !field) return;

      const agent = this.state.agents.find((a) => a.id === agentId);
      if (!agent) return;

      if (field === "name") {
        agent.name = target.value;
        this.scheduleChartUpdate();
      } else if (field === "rigor") {
        agent.engineeringRigor = parseFloat(target.value);
        const label = card?.querySelector(".agent-rigor-label");
        if (label) label.textContent = agent.engineeringRigor.toFixed(2);
        this.scheduleChartUpdate();
      }
    });

    document.getElementById("agent-list")?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const removeBtn = target.closest("[data-action='remove']");
      if (!removeBtn) return;

      const card = removeBtn.closest(".agent-card");
      const agentId = card?.getAttribute("data-agent-id");
      if (!agentId || this.state.agents.length <= 1) return;

      this.state.agents = this.state.agents.filter((a) => a.id !== agentId);
      card?.remove();
      this.recomputeChart();
    });

    document.getElementById("add-agent")?.addEventListener("click", () => {
      const usedColors = new Set(this.state.agents.map((a) => a.color));
      const availableColor =
        AGENT_COLORS.find((c) => !usedColors.has(c)) ?? AGENT_COLORS[0];
      const newAgent: AgentConfig = {
        id: `agent-${Date.now()}`,
        name: "New Agent",
        engineeringRigor: 0.5,
        color: availableColor,
      };
      this.state.agents.push(newAgent);
      document
        .getElementById("agent-list")
        ?.insertAdjacentHTML("beforeend", this.buildAgentCard(newAgent));
      this.recomputeChart();
    });

    document.getElementById("reset-agents")?.addEventListener("click", () => {
      this.state.agents = [...DEFAULT_AGENTS];
      const agentList = document.getElementById("agent-list");
      if (agentList) {
        agentList.innerHTML = this.state.agents
          .map((a) => this.buildAgentCard(a))
          .join("");
      }
      this.recomputeChart();
    });
  }

  private bindTabEvents(): void {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const complexity = tab.getAttribute(
          "data-complexity"
        ) as ComplexityProfileKey;
        if (complexity && complexity !== this.state.complexity) {
          this.state.complexity = complexity;
          this.updateComplexityDisplay();
          this.recomputeChart();
        }
      });
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

  private updateComplexityDisplay(): void {
    const profile = complexityProfiles[this.state.complexity];
    const descEl = document.querySelector(".complexity-description");
    if (descEl) {
      descEl.textContent = `${profile.description} (SC = ${profile.systemComplexity})`;
    }
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle(
        "active",
        tab.getAttribute("data-complexity") === this.state.complexity
      );
    });
  }

  private scheduleChartUpdate(): void {
    if (this.updateDebounceTimer) clearTimeout(this.updateDebounceTimer);
    this.updateDebounceTimer = setTimeout(() => this.recomputeChart(), 300);
  }

  private recomputeChart(): void {
    const container = document.getElementById("chart-container");
    if (!container) return;

    container.innerHTML = `<div class="loading"><div class="loading-spinner"></div>Computing simulations...</div>`;

    setTimeout(() => {
      const profile = complexityProfiles[this.state.complexity];
      const datasets = buildDatasetsForAgents(this.state.agents, {
        systemComplexity: profile.systemComplexity,
        nChanges: this.state.nChanges,
      });

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

const app = new ProductHealthApp("#app");
app.mount();
