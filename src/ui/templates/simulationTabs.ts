import { ICON_CLOSE, ICON_PLUS } from "./icons";
import type { Simulation } from "../storage/types";

type SimulationTabsProps = {
  simulations: Simulation[];
  activeSimulationId: string;
  editingTabId: string | null;
};

export const buildSimulationTabs = ({
  simulations,
  activeSimulationId,
  editingTabId,
}: SimulationTabsProps): string => {
  const tabs = simulations
    .map((sim) => {
      const isActive = sim.id === activeSimulationId;
      const isEditing = editingTabId === sim.id;
      const nameHtml = isEditing
        ? `<input type="text" class="sim-tab-input" value="${sim.name}" data-sim-id="${sim.id}" />`
        : `<span class="sim-tab-name" data-sim-id="${sim.id}">${sim.name}</span>`;
      return `
        <div class="sim-tab ${isActive ? "active" : ""}" data-sim-id="${sim.id}" title="Click to view, double-click name to rename">
          ${nameHtml}
          <button class="sim-tab-close" data-action="close-sim" data-sim-id="${sim.id}" title="Delete simulation">${ICON_CLOSE}</button>
        </div>
      `;
    })
    .join("");

  const mobileOptions = simulations
    .map(
      (sim) =>
        `<option value="${sim.id}" ${sim.id === activeSimulationId ? "selected" : ""}>${sim.name}</option>`
    )
    .join("");

  return `
    <div class="sim-tabs-wrapper">
      <span class="sim-tabs-label">Scenarios</span>
      <div class="sim-tabs-container">
        <select class="sim-tabs-mobile" id="sim-tabs-mobile">
          ${mobileOptions}
        </select>
        <div class="sim-tabs" id="sim-tabs">${tabs}</div>
        <button class="sim-tab-add" id="add-simulation" title="Add new scenario">${ICON_PLUS}</button>
      </div>
    </div>
  `;
};

