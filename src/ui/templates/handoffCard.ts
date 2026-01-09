import { ICON_CLOSE } from "./icons";
import type { DeveloperConfig, HandoffConfig } from "../storage/types";
import { adjustColor } from "../chart/colors";

export const buildHandoffCard = (
  handoff: HandoffConfig,
  availableDevelopers: DeveloperConfig[],
  maxChanges: number
): string => {
  const fromOptions = availableDevelopers
    .map(
      (a) =>
        `<option value="${a.id}" ${
          handoff.fromDeveloperId === a.id ? "selected" : ""
        }>${a.name}</option>`
    )
    .join("");

  const toOptions = availableDevelopers
    .map(
      (a) =>
        `<option value="${a.id}" ${
          handoff.toDeveloperId === a.id ? "selected" : ""
        }>${a.name}</option>`
    )
    .join("");

  const fromDeveloper = availableDevelopers.find((a) => a.id === handoff.fromDeveloperId);
  const toDeveloper = availableDevelopers.find((a) => a.id === handoff.toDeveloperId);
  const fromColor = fromDeveloper ? adjustColor(fromDeveloper.color, -20) : "#ccc";
  const toColor = toDeveloper ? adjustColor(toDeveloper.color, -20) : "#ccc";

  return `
    <div class="developer-card handoff-card" data-handoff-id="${handoff.id}">
      <div class="handoff-color-icon" 
           style="background: linear-gradient(90deg, ${fromColor} 50%, ${toColor} 50%)"
           data-from-developer-id="${handoff.fromDeveloperId}"
           data-to-developer-id="${handoff.toDeveloperId}">
      </div>
      <div class="developer-main">
        <input type="text" class="developer-name-input" value="${handoff.name}" data-field="name" />
        
        <div class="handoff-row">
          <select class="handoff-select" data-field="fromDeveloperId">
            ${fromOptions}
          </select>
          <span class="handoff-arrow">→</span>
          <select class="handoff-select" data-field="toDeveloperId">
            ${toOptions}
          </select>
        </div>

        <div class="developer-rigor">
          <span class="developer-rigor-label">Handoff at: ${handoff.atChange}</span>
          <input type="range" min="1" max="${maxChanges}" step="1" value="${handoff.atChange}" data-field="atChange" />
        </div>
      </div>
      <button class="developer-remove" data-action="remove-handoff">${ICON_CLOSE}</button>
    </div>
  `;
};

