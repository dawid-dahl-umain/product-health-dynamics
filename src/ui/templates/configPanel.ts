import { ICON_DUPLICATE, ICON_EXPORT, ICON_RESET, ICON_TRASH } from "./icons";
import { buildDeveloperCard } from "./developerCard";
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
  const developerCards = simulation.developers
    .map((developer) => buildDeveloperCard(developer))
    .join("");

  const handoffCards = simulation.handoffs
    .map((handoff) =>
      buildHandoffCard(handoff, simulation.developers, simulation.nChanges)
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
          <div class="config-field">
            <div class="config-row-inline">
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
            <span class="config-hint">How complex and novel are the system requirements?</span>
          </div>
          <input 
            type="text" 
            id="complexity-description" 
            class="complexity-description-input"
            value="${description}"
            placeholder="Describe this system..."
          />
        </div>
        <div class="config-second-row">
          <div class="config-field">
            <div class="config-row-inline">
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
            <span class="config-hint">Code changes to simulate</span>
          </div>
          <div class="config-field">
            <div class="config-row-inline">
              <span class="config-label">Start Health</span>
              <input 
                type="range" 
                id="starting-health-slider" 
                min="1" 
                max="10" 
                step="1" 
                value="${simulation.startingHealth ?? 8}"
              />
              <span class="starting-health-value" id="starting-health-value">${
                simulation.startingHealth ?? 8
              }</span>
            </div>
            <span class="config-hint">Initial product health (1-10)</span>
          </div>
          <div class="sim-actions">
            <button class="btn-icon" id="duplicate-sim" title="Duplicate Simulation">
              ${ICON_DUPLICATE}
              <span class="btn-label">Duplicate</span>
            </button>
            <button class="btn-icon" id="export-sim" title="Export Simulation">
              ${ICON_EXPORT}
              <span class="btn-label">Export</span>
            </button>
            <button class="btn-icon" id="reset-defaults" title="Reset to Defaults">
              ${ICON_RESET}
              <span class="btn-label">Reset</span>
            </button>
            <button class="btn-icon btn-danger-icon" id="delete-current-sim" title="Delete Simulation">
              ${ICON_TRASH}
              <span class="btn-label">Delete</span>
            </button>
          </div>
        </div>

        <div class="config-divider"></div>
        
        <div class="config-columns">
          <div class="config-section">
            <div class="config-section-header">
              <span class="config-section-title">Developers</span>
            </div>
            <div class="developer-list" id="developer-list">
              ${developerCards}
            </div>
            <div class="developer-actions">
              <button class="btn-secondary" id="add-developer">+ Add Developer</button>
            </div>
          </div>

          <div class="config-section">
            <div class="config-section-header">
              <span class="config-section-title">Handoff Scenarios</span>
            </div>
            <div class="developer-list" id="handoff-list">
              ${handoffCards}
            </div>
            <div class="developer-actions">
              <button class="btn-secondary" id="add-handoff">+ Add Handoff</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
