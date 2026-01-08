import { ICON_CLOSE } from "./icons";
import type { AgentConfig } from "../storage/types";

export const buildAgentCard = (agent: AgentConfig): string => {
  const rigorValue = agent.engineeringRigor.toFixed(2);
  return `
    <div class="agent-card" data-agent-id="${agent.id}">
      <input type="color" class="agent-color-picker" value="${agent.color}" data-field="color" title="Change color" />
      <div class="agent-main">
        <input type="text" class="agent-name-input" value="${agent.name}" data-field="name" />
        <div class="agent-rigor">
          <span class="agent-rigor-label">Eng. Rigor: ${rigorValue}</span>
          <input type="range" min="0.1" max="1" step="0.05" value="${agent.engineeringRigor}" data-field="rigor" />
        </div>
      </div>
      <button class="agent-remove" data-action="remove-agent">${ICON_CLOSE}</button>
    </div>
  `;
};
