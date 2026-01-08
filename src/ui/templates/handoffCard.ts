import { ICON_CLOSE } from "./icons";
import type { AgentConfig, HandoffConfig } from "../storage/types";
import { adjustColor } from "../chart/colors";

export const buildHandoffCard = (
  handoff: HandoffConfig,
  availableAgents: AgentConfig[],
  maxChanges: number
): string => {
  const fromOptions = availableAgents
    .map(
      (a) =>
        `<option value="${a.id}" ${
          handoff.fromAgentId === a.id ? "selected" : ""
        }>${a.name}</option>`
    )
    .join("");

  const toOptions = availableAgents
    .map(
      (a) =>
        `<option value="${a.id}" ${
          handoff.toAgentId === a.id ? "selected" : ""
        }>${a.name}</option>`
    )
    .join("");

  const fromAgent = availableAgents.find((a) => a.id === handoff.fromAgentId);
  const toAgent = availableAgents.find((a) => a.id === handoff.toAgentId);
  const fromColor = fromAgent ? adjustColor(fromAgent.color, -20) : "#ccc";
  const toColor = toAgent ? adjustColor(toAgent.color, -20) : "#ccc";

  return `
    <div class="agent-card handoff-card" data-handoff-id="${handoff.id}">
      <div class="handoff-color-icon" 
           style="background: linear-gradient(90deg, ${fromColor} 50%, ${toColor} 50%)"
           data-from-agent-id="${handoff.fromAgentId}"
           data-to-agent-id="${handoff.toAgentId}">
      </div>
      <div class="agent-main">
        <input type="text" class="agent-name-input" value="${handoff.name}" data-field="name" />
        
        <div class="handoff-row">
          <select class="handoff-select" data-field="fromAgentId">
            ${fromOptions}
          </select>
          <span class="handoff-arrow">→</span>
          <select class="handoff-select" data-field="toAgentId">
            ${toOptions}
          </select>
        </div>

        <div class="agent-rigor">
          <span class="agent-rigor-label">Handoff at: ${handoff.atChange}</span>
          <input type="range" min="1" max="${maxChanges}" step="10" value="${handoff.atChange}" data-field="atChange" />
        </div>
      </div>
      <button class="agent-remove" data-action="remove-handoff">${ICON_CLOSE}</button>
    </div>
  `;
};

