export const buildChartControls = (): string => `
  <div class="controls">
    <div class="controls-desktop">
      <button id="reset-zoom">Reset View</button>
      <button id="show-all">Show All</button>
      <button id="clear-all">Clear All</button>
      <button id="toggle-developers" title="Show only developers">Devs Only</button>
      <button id="toggle-handoffs" title="Show only handoffs">Handoffs Only</button>
    </div>
    <div class="controls-mobile">
      <button id="reset-zoom-mobile">Reset</button>
      <button id="show-all-mobile">Show All</button>
      <button id="controls-more" class="controls-more-btn">More ▾</button>
      <div class="controls-dropdown" id="controls-dropdown">
        <button id="clear-all-mobile">Clear All</button>
        <button id="toggle-developers-mobile">Devs Only</button>
        <button id="toggle-handoffs-mobile">Handoffs Only</button>
      </div>
    </div>
    <span class="hint">Click legend to toggle / Scroll to zoom / Drag to pan</span>
  </div>
`;

export const buildChartContainer = (): string => `
  <div id="chart-container">
    <div class="loading"><div class="loading-spinner"></div>Computing simulations...</div>
  </div>
`;

import { palette } from "../chart/colors";

type ComplexityDescriptionProps = {
  description: string;
  systemComplexity: number;
};

export const getComplexityLevel = (
  complexity: number
): { label: string; color: string } => {
  if (complexity <= 0.15)
    return { label: "Trivial complexity", color: palette.emerald };
  if (complexity <= 0.3)
    return { label: "Low complexity", color: palette.teal };
  if (complexity <= 0.5)
    return { label: "Moderate complexity", color: palette.azure };
  if (complexity <= 0.7)
    return { label: "High complexity", color: palette.saffron };
  if (complexity <= 0.85)
    return { label: "Very high complexity", color: palette.rose };
  return { label: "Extreme complexity", color: "#dc2626" };
};

export const buildComplexityDescription = ({
  description,
  systemComplexity,
}: ComplexityDescriptionProps): string => {
  const level = getComplexityLevel(systemComplexity);
  return `
    <div class="complexity-info">
      <span class="complexity-badge" style="--badge-color: ${level.color}">
        <span class="complexity-dot"></span>
        ${level.label}
      </span>
      <span class="complexity-description">${description}</span>
    </div>
  `;
};
