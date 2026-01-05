import Chart from "chart.js/auto";
import { Filler } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";
import "hammerjs";
import "./styles.css";

import {
  complexityProfiles,
  complexityProfileKeys,
  type ComplexityProfileKey,
} from "./simulation";
import { chartOptions } from "./chart/config";
import { precomputeAllDatasets, type Dataset } from "./chart/datasets";

let datasetsByComplexity: Record<ComplexityProfileKey, Dataset[]> | null = null;
let chartInstance: Chart | null = null;
let currentComplexity: ComplexityProfileKey = "enterprise";

Chart.register(annotationPlugin, zoomPlugin, Filler);

const createChart = (canvas: HTMLCanvasElement): Chart =>
  new Chart(canvas, {
    type: "line",
    data: { datasets: datasetsByComplexity![currentComplexity] },
    options: chartOptions,
  });

const updateComplexityDisplay = (complexity: ComplexityProfileKey) => {
  currentComplexity = complexity;

  if (chartInstance && datasetsByComplexity) {
    chartInstance.data.datasets = datasetsByComplexity[complexity];
    chartInstance.update("none");
  }

  const descEl = document.getElementById("complexity-desc");
  if (descEl) {
    const profile = complexityProfiles[complexity];
    descEl.textContent = `${profile.description} (SC = ${profile.systemComplexity})`;
  }

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle(
      "active",
      tab.getAttribute("data-complexity") === complexity
    );
  });
};

const buildTabsHtml = () =>
  complexityProfileKeys
    .map((key) => {
      const profile = complexityProfiles[key];
      const isActive = key === currentComplexity;
      return `<button class="tab${
        isActive ? " active" : ""
      }" data-complexity="${key}">
        ${profile.label}<span class="tab-indicator">SC=${
        profile.systemComplexity
      }</span>
      </button>`;
    })
    .join("");

const buildLoadingHtml = () => `
  <main>
    <h1>Product Health Trajectories</h1>
    <div id="chart-container">
      <div class="loading">Computing simulations...</div>
    </div>
  </main>
`;

const buildAppHtml = (
  profile: (typeof complexityProfiles)[ComplexityProfileKey]
) => `
  <main>
    <h1>Product Health Trajectories</h1>
    <p id="complexity-desc" class="complexity-description">${
      profile.description
    } (SC = ${profile.systemComplexity})</p>
    <div class="tabs">${buildTabsHtml()}</div>
    <div id="chart-container">
      <canvas id="trend" aria-label="Product Health trajectories" role="img"></canvas>
    </div>
    <div class="controls">
      <button id="reset-zoom">Reset View</button>
      <span class="hint">Click legend to show scenarios · Scroll to zoom · Drag to pan</span>
    </div>
  </main>
`;

const bindEvents = () => {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const complexity = tab.getAttribute(
        "data-complexity"
      ) as ComplexityProfileKey;
      if (complexity && complexity !== currentComplexity) {
        updateComplexityDisplay(complexity);
      }
    });
  });

  document.getElementById("reset-zoom")?.addEventListener("click", () => {
    chartInstance?.resetZoom();
  });
};

const mount = () => {
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) return;

  root.innerHTML = buildLoadingHtml();

  setTimeout(() => {
    datasetsByComplexity = precomputeAllDatasets();
    root.innerHTML = buildAppHtml(complexityProfiles[currentComplexity]);

    const canvas = document.getElementById("trend") as HTMLCanvasElement;
    if (canvas) {
      chartInstance = createChart(canvas);
    }

    bindEvents();
  }, 10);
};

mount();
