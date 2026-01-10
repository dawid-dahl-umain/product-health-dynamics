import type {
  ChartOptions,
  Chart,
  LegendItem,
  ActiveElement,
  ChartEvent,
} from "chart.js";
import { chartColors } from "./colors";

export type ChartClickHandler = (
  datasetLabel: string,
  xValue: number,
  yValue: number
) => void;

let onChartClickHandler: ChartClickHandler | null = null;
let onVisibilityChangeHandler: (() => void) | null = null;

export const setChartClickHandler = (handler: ChartClickHandler | null) => {
  onChartClickHandler = handler;
};

export const setVisibilityChangeHandler = (handler: (() => void) | null) => {
  onVisibilityChangeHandler = handler;
};

const handleChartClick = (
  _event: ChartEvent,
  elements: ActiveElement[],
  chart: Chart
) => {
  if (elements.length === 0 || !onChartClickHandler) return;

  const element = elements[0];
  const datasetIndex = element.datasetIndex;
  const index = element.index;
  const dataset = chart.data.datasets[datasetIndex];
  const data = dataset.data[index] as { x: number; y: number };

  if (dataset.label && data) {
    const label = dataset.label.replace(" (p10)", "").replace(" (p90)", "");
    onChartClickHandler(label, data.x, data.y);
  }
};

const onLegendClick = (
  _event: unknown,
  legendItem: LegendItem,
  legend: { chart: Chart }
) => {
  const chart = legend.chart;
  const clickedIndex = legendItem.datasetIndex;
  if (clickedIndex === undefined) return;

  const groupStart = clickedIndex - 2;
  const firstMeta = chart.getDatasetMeta(groupStart);
  const firstDataset = chart.data.datasets[groupStart];
  const isCurrentlyHidden =
    firstMeta.hidden ?? (firstDataset as { hidden?: boolean }).hidden ?? false;

  for (let i = 0; i < 3; i++) {
    chart.getDatasetMeta(groupStart + i).hidden = !isCurrentlyHidden;
  }

  chart.update();
  onVisibilityChangeHandler?.();
};

export const chartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  onClick: handleChartClick as any,
  interaction: {
    intersect: false,
    mode: "nearest",
  },
  elements: {
    point: {
      radius: 0,
      hoverRadius: 6,
      hitRadius: 10,
    },
  },
  scales: {
    x: {
      type: "linear",
      title: {
        display: true,
        text: "Code changes →",
        color: chartColors.text,
        font: { size: 11, weight: 600 },
      },
      grid: { color: chartColors.grid },
      ticks: {
        color: chartColors.text,
        font: { size: 10 },
      },
    },
    y: {
      min: 1,
      max: 10,
      title: {
        display: true,
        text: "Product Health (1–10)",
        color: chartColors.text,
        font: { size: 11, weight: 600 },
      },
      grid: { color: chartColors.gridLight },
      ticks: {
        color: chartColors.text,
        font: { size: 10 },
      },
    },
  },
  plugins: {
    legend: {
      onClick: onLegendClick,
      labels: {
        color: chartColors.textLight,
        usePointStyle: true,
        pointStyleWidth: 8,
        boxWidth: 20,
        boxHeight: 12,
        font: {
          size: 11,
          weight: 500,
        },
        padding: 24,
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
          borderColor: chartColors.annotationLine,
          borderDash: [6, 6],
          borderWidth: 1,
          label: {
            display: true,
            content: "Shape → Scale start",
            color: chartColors.textLight,
            backgroundColor: chartColors.annotationBg,
            position: "start",
            xAdjust: 20,
            yAdjust: -12,
            font: {
              size: 9,
              weight: 600,
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
        wheel: { enabled: true },
        pinch: { enabled: true },
        mode: "xy",
      },
    },
  },
};
