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
        <div class="sim-tab ${isActive ? "active" : ""}" data-sim-id="${sim.id}">
          ${nameHtml}
          <button class="sim-tab-close" data-action="close-sim" data-sim-id="${sim.id}">${ICON_CLOSE}</button>
        </div>
      `;
    })
    .join("");

  return `
    <div class="sim-tabs-container">
      <div class="sim-tabs" id="sim-tabs">${tabs}</div>
      <button class="sim-tab-add" id="add-simulation" title="New Simulation">${ICON_PLUS}</button>
    </div>
  `;
};

