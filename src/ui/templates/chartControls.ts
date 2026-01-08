export const buildChartControls = (): string => `
  <div class="controls">
    <button id="reset-zoom">Reset View</button>
    <button id="show-all">Show All</button>
    <button id="clear-all">Clear All</button>
    <span class="hint">Click legend to toggle / Scroll to zoom / Drag to pan</span>
  </div>
`;

export const buildChartContainer = (): string => `
  <div id="chart-container">
    <div class="loading"><div class="loading-spinner"></div>Computing simulations...</div>
  </div>
`;

type ComplexityDescriptionProps = {
  description: string;
  systemComplexity: number;
};

export const buildComplexityDescription = ({
  description,
  systemComplexity,
}: ComplexityDescriptionProps): string =>
  `<p class="complexity-description">${description} (SC = ${systemComplexity})</p>`;

