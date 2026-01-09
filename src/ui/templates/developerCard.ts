import { ICON_CLOSE } from "./icons";
import type { DeveloperConfig } from "../storage/types";

export const buildDeveloperCard = (developer: DeveloperConfig): string => {
  const rigorValue = developer.engineeringRigor.toFixed(2);
  return `
    <div class="developer-card" data-developer-id="${developer.id}">
      <input type="color" class="developer-color-picker" value="${developer.color}" data-field="color" title="Change color" />
      <div class="developer-main">
        <input type="text" class="developer-name-input" value="${developer.name}" data-field="name" />
        <div class="developer-rigor">
          <span class="developer-rigor-label">Eng. Rigor: ${rigorValue}</span>
          <input type="range" min="0.1" max="1" step="0.05" value="${developer.engineeringRigor}" data-field="rigor" />
        </div>
      </div>
      <button class="developer-remove" data-action="remove-developer">${ICON_CLOSE}</button>
    </div>
  `;
};
