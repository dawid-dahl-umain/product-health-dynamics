import { ICON_DUPLICATE, ICON_EXPORT } from "./icons";
import { buildAgentCard } from "./agentCard";
import { CHANGES_OPTIONS, COMPLEXITY_OPTIONS } from "../types";
import type { Simulation } from "../storage/types";

type ConfigPanelProps = {
  simulation: Simulation;
  settingsOpen: boolean;
};

export const buildConfigPanel = ({
  simulation,
  settingsOpen,
}: ConfigPanelProps): string => {
  const agentCards = simulation.agents
    .map((agent) => buildAgentCard(agent, simulation.agents))
    .join("");

  return `
    <div class="config-panel ${settingsOpen ? "open" : ""}" id="config-panel">
      <div class="config-grid">
        <div class="config-section">
          <div class="config-section-header">
            <span class="config-section-title">Simulation</span>
          </div>
          <div class="config-row">
            <span class="config-label">Changes</span>
            <select id="changes-select">
              ${CHANGES_OPTIONS.map(
                (n) =>
                  `<option value="${n}" ${
                    n === simulation.nChanges ? "selected" : ""
                  }>${n.toLocaleString()}</option>`
              ).join("")}
            </select>
          </div>
          <div class="config-row" style="margin-top: 12px;">
            <span class="config-label">Complexity</span>
            <select id="complexity-select">
              ${COMPLEXITY_OPTIONS.map(
                (opt) =>
                  `<option value="${opt.value}" ${
                    opt.value === simulation.complexity ? "selected" : ""
                  }>${opt.label} (SC=${opt.sc})</option>`
              ).join("")}
            </select>
          </div>
          <div class="sim-actions" style="margin-top: 16px;">
            <button class="btn-icon" id="duplicate-sim" title="Duplicate Simulation">${ICON_DUPLICATE}</button>
            <button class="btn-icon" id="export-sim" title="Export Simulation">${ICON_EXPORT}</button>
          </div>
        </div>
        <div class="config-section">
          <div class="config-section-header">
            <span class="config-section-title">Agents</span>
          </div>
          <div class="agent-list" id="agent-list">
            ${agentCards}
          </div>
          <div class="agent-actions">
            <button class="btn-secondary" id="add-agent">+ Add Agent</button>
            <button class="btn-secondary" id="reset-agents">Reset Defaults</button>
          </div>
        </div>
      </div>
    </div>
  `;
};

