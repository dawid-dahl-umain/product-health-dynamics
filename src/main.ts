import Chart from "chart.js/auto";
import { Filler } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";
import "hammerjs";
import {
  scenarioKeys,
  scenarios,
  simulateScenario,
  type ScenarioKey,
} from "./simulation";

const injectBaseStyles = () => {
  const style = document.createElement("style");
  style.textContent = `
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: #0b1224;
      color: #e2e8f0;
      display: flex;
      justify-content: center;
    }
    main {
      max-width: 960px;
      width: 100%;
      padding: 48px 20px 72px;
      box-sizing: border-box;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 2.1rem;
    }
    p {
      margin: 4px 0 0;
      color: #cbd5e1;
    }
    #chart-container {
      margin-top: 28px;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    }
    canvas {
      width: 100%;
      height: 420px;
      cursor: crosshair;
    }
    .controls {
      margin-top: 16px;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    button {
      background: #1e293b;
      border: 1px solid #334155;
      color: #e2e8f0;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
    }
    button:hover {
      background: #334155;
    }
  `;
  document.head.appendChild(style);
};

const colorByScenario: Record<ScenarioKey, string> = {
  "ai-vibe": "#f87171",
  "ai-guardrails": "#fbbf24",
  "junior-engineer": "#fb923c",
  "senior-engineers": "#34d399",
  "ai-handoff": "#60a5fa",
  "ai-junior-handoff": "#818cf8",
};

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const buildDatasets = () =>
  scenarioKeys.flatMap((key) => {
    const stats = simulateScenario(key, { nSimulations: 800 });
    const color = colorByScenario[key];

    const avgPoints = stats.averageTrajectory.map((value, index) => ({
      x: index,
      y: value,
    }));
    const p90Points = stats.p90Trajectory.map((value, index) => ({
      x: index,
      y: value,
    }));
    const p10Points = stats.p10Trajectory.map((value, index) => ({
      x: index,
      y: value,
    }));

    return [
      {
        label: `${scenarios[key].label} (p90)`,
        data: p90Points,
        borderColor: "transparent",
        backgroundColor: hexToRgba(color, 0.15),
        fill: "+1",
        tension: 0.25,
        pointRadius: 0,
      },
      {
        label: `${scenarios[key].label} (p10)`,
        data: p10Points,
        borderColor: "transparent",
        backgroundColor: "transparent",
        fill: false,
        tension: 0.25,
        pointRadius: 0,
      },
      {
      label: scenarios[key].label,
        data: avgPoints,
        borderColor: color,
        backgroundColor: color,
        fill: false,
      tension: 0.25,
      pointRadius: 0,
      },
    ];
  });

let chartInstance: Chart | null = null;

const renderChart = () => {
  const ctx = document.getElementById("trend") as HTMLCanvasElement | null;
  if (!ctx) return;
  Chart.register(annotationPlugin, zoomPlugin, Filler);

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      datasets: buildDatasets(),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Change events" },
          grid: { color: "rgba(148, 163, 184, 0.2)" },
          ticks: { color: "#cbd5e1" },
        },
        y: {
          min: 1,
          max: 10,
          title: { display: true, text: "Product Health (1–10)" },
          grid: { color: "rgba(148, 163, 184, 0.15)" },
          ticks: { color: "#cbd5e1" },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#e2e8f0",
            filter: (item) =>
              !item.text.includes("(p10)") && !item.text.includes("(p90)"),
          },
        },
        tooltip: {
          callbacks: {
            title: (items) => `Change ${items[0]?.parsed?.x ?? 0}`,
            label: (item) =>
              `${item.dataset.label}: ${item.parsed.y?.toFixed(2) ?? "N/A"}`,
          },
        },
        annotation: {
          annotations: {
            shapeScale: {
              type: "line",
              xMin: 0,
              xMax: 0,
              borderColor: "rgba(148, 163, 184, 0.8)",
              borderDash: [6, 6],
              borderWidth: 1,
              label: {
                display: true,
                content: "Shape → Scale start",
                color: "#cbd5e1",
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                position: "start",
                xAdjust: 20,
                yAdjust: -12,
                font: {
                  size: 10,
                  weight: "bold",
                },
                padding: 4,
              },
            },
          },
        },
        zoom: {
          pan: {
            enabled: true,
            mode: "xy",
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: "xy",
          },
        },
      },
    },
  });

  return chartInstance;
};

const mount = () => {
  injectBaseStyles();
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) return;
  root.innerHTML = `
    <main>
      <h1>Product Health Trajectories</h1>
      <p>Results from 800 randomized Monte Carlo simulations per scenario. The solid line represents the average path; shaded bands show the range where 80% of outcomes land (the "realistic" best and worst cases).</p>
      <div id="chart-container">
        <canvas id="trend" aria-label="Product Health trajectories" role="img"></canvas>
      </div>
      <div class="controls">
        <button id="reset-zoom">Reset View</button>
        <span style="font-size: 0.8rem; color: #94a3b8;">Scroll to zoom, drag to pan</span>
      </div>
    </main>
  `;
  renderChart();

  document.getElementById("reset-zoom")?.addEventListener("click", () => {
    chartInstance?.resetZoom();
  });
};

mount();
