import Chart from "chart.js/auto";
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
    }
  `;
  document.head.appendChild(style);
};

const colorByScenario: Record<ScenarioKey, string> = {
  "ai-vibe": "#f87171",
  "ai-guardrails": "#fbbf24",
  "senior-engineers": "#34d399",
};

const buildDatasets = () =>
  scenarioKeys.map((key) => {
    const stats = simulateScenario(key, { nSimulations: 800 });
    const points = stats.averageTrajectory.map((value, index) => ({
      x: index,
      y: value,
    }));
    return {
      label: scenarios[key].label,
      data: points,
      borderColor: colorByScenario[key],
      backgroundColor: colorByScenario[key],
      tension: 0.25,
      pointRadius: 0,
    };
  });

const renderChart = () => {
  const ctx = document.getElementById("trend") as HTMLCanvasElement | null;
  if (!ctx) return;

  return new Chart(ctx, {
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
          labels: { color: "#e2e8f0" },
        },
        tooltip: {
          callbacks: {
            title: (items) =>
              `Change ${items[0]?.parsed?.x ?? 0}`,
            label: (item) =>
              `${item.dataset.label}: ${item.parsed.y.toFixed(2)}`,
          },
        },
      },
    },
  });
};

const mount = () => {
  injectBaseStyles();
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) return;
  root.innerHTML = `
    <main>
      <h1>Product Health Trajectories</h1>
      <p>Average Monte Carlo trends across scenarios (n=800 runs each).</p>
      <div id="chart-container">
        <canvas id="trend" aria-label="Product Health trajectories" role="img"></canvas>
      </div>
    </main>
  `;
  renderChart();
};

mount();
