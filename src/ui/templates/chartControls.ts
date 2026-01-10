export const buildChartControls = (): string => `
  <div class="controls">
    <div class="controls-desktop">
      <div class="control-group">
        <button id="reset-zoom">Reset View</button>
        <button id="resimulate">Resimulate</button>
      </div>
      <div class="control-divider"></div>
      <div class="control-group">
        <button id="show-all">Show All</button>
        <button id="clear-all">Clear All</button>
        <button id="toggle-developers" title="Show only developers">Devs Only</button>
        <button id="toggle-handoffs" title="Show only handoffs">Handoffs Only</button>
      </div>
    </div>
    <div class="controls-mobile">
      <button id="reset-zoom-mobile">Reset View</button>
      <button id="resimulate-mobile">Resimulate</button>
      <button id="controls-more" class="controls-more-btn">Filters ▾</button>
      <div class="controls-dropdown" id="controls-dropdown">
        <div class="dropdown-header">Visibility Filters</div>
        <button id="show-all-mobile">Show All</button>
        <button id="clear-all-mobile">Clear All</button>
        <button id="toggle-developers-mobile">Devs Only</button>
        <button id="toggle-handoffs-mobile">Handoffs Only</button>
      </div>
    </div>
    <span class="hint">Click chart for insights / Click legend to toggle / Scroll to zoom</span>
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
      <div class="complexity-main">
        <span class="complexity-badge" style="--badge-color: ${level.color}">
          <span class="complexity-dot"></span>
          ${level.label}
        </span>
        <span class="complexity-description">${description}</span>
      </div>
      <button class="chart-tip" id="open-insight-guide" title="Open guide">
        <span class="tip-icon">📖</span>
        <span class="tip-text">Guide</span>
      </button>
    </div>
  `;
};
