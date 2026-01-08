import { ICON_DUPLICATE, ICON_EXPORT } from "./icons";
import { buildAgentCard } from "./agentCard";
import { buildHandoffCard } from "./handoffCard";
import { CHANGES_OPTIONS } from "../types";
import { getDefaultComplexityDescription } from "../defaults";
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
    .map((agent) => buildAgentCard(agent))
    .join("");

  const handoffCards = simulation.handoffs
    .map((handoff) =>
      buildHandoffCard(handoff, simulation.agents, simulation.nChanges)
    )
    .join("");

  const scValue = simulation.systemComplexity.toFixed(2);
  const description =
    simulation.complexityDescription ??
    getDefaultComplexityDescription(simulation.systemComplexity);

  return `
    <div class="config-panel ${settingsOpen ? "open" : ""}" id="config-panel">
      <div class="config-grid">
        <div class="config-top-row">
          <div class="config-row config-row-complexity">
            <span class="config-label">System Complexity</span>
            <input 
              type="range" 
              id="complexity-slider" 
              min="0.1" 
              max="1" 
              step="0.05" 
              value="${simulation.systemComplexity}"
            />
            <span class="complexity-value" id="complexity-value">${scValue}</span>
          </div>
          <div class="config-row config-row-description">
            <input 
              type="text" 
              id="complexity-description" 
              class="complexity-description-input"
              value="${description}"
              placeholder="Describe this system complexity..."
            />
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
          <div class="sim-actions">
            <button class="btn-icon" id="duplicate-sim" title="Duplicate Simulation">${ICON_DUPLICATE}</button>
            <button class="btn-icon" id="export-sim" title="Export Simulation">${ICON_EXPORT}</button>
          </div>
        </div>
        
        <div class="config-columns">
          <div class="config-section">
            <div class="config-section-header">
              <span class="config-section-title">Personas</span>
            </div>
            <div class="agent-list" id="agent-list">
              ${agentCards}
            </div>
            <div class="agent-actions">
              <button class="btn-secondary" id="add-agent">+ Add Persona</button>
            </div>
          </div>

          <div class="config-section">
            <div class="config-section-header">
              <span class="config-section-title">Handoff Scenarios</span>
            </div>
            <div class="agent-list" id="handoff-list">
              ${handoffCards}
            </div>
            <div class="agent-actions">
              <button class="btn-secondary" id="add-handoff">+ Add Handoff</button>
              <button class="btn-secondary" id="reset-defaults">Reset Defaults</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
