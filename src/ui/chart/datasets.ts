import { TrajectorySimulator, summarizeRuns } from "../../simulation";
import { hexToRgba, chartColors, adjustColor } from "./colors";
import type { DeveloperConfig, HandoffConfig } from "../storage/types";

export type Dataset = {
  label: string;
  data: { x: number; y: number }[];
  borderColor: string;
  borderWidth?: number;
  backgroundColor: any;
  fill: string | boolean;
  tension: number;
  pointRadius: number;
  pointStyle?: any;
  hidden: boolean;
  segment?: {
    borderColor?: (ctx: any) => string | undefined;
    backgroundColor?: (ctx: any) => string | undefined;
  };
};

const getLegendSize = (): number => {
  const root = document.documentElement;
  const size = getComputedStyle(root).getPropertyValue("--chart-legend-size");
  return parseInt(size, 10) || 10;
};

const createLegendIcon = (
  color1: string,
  color2?: string
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  const baseSize = getLegendSize();
  const resolution = 4;
  const size = baseSize * resolution;
  const center = size / 2;
  const padding = resolution * 1.5;

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.beginPath();
  ctx.arc(center, center, center - padding, 0, Math.PI * 2);
  ctx.clip();

  if (color2) {
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, center, size);
    ctx.fillStyle = color2;
    ctx.fillRect(center, 0, center, size);
  } else {
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, size, size);
  }

  return canvas;
};

type SimulationOptions = {
  systemComplexity: number;
  nChanges: number;
  startingHealth: number;
  nSimulations?: number;
};

type DeveloperLookup = Map<string, DeveloperConfig>;

const runDeveloperSimulation = (
  developer: DeveloperConfig,
  options: SimulationOptions
) => {
  const {
    systemComplexity,
    nChanges,
    startingHealth,
    nSimulations = 200,
  } = options;
  const simulator = new TrajectorySimulator();

  const runs = Array.from({ length: nSimulations }, () =>
    simulator.simulate({
      engineeringRigor: developer.engineeringRigor,
      systemComplexity,
      nChanges,
      startValue: startingHealth,
    })
  );
  return summarizeRuns(runs);
};

const runHandoffSimulation = (
  handoff: HandoffConfig,
  developerLookup: DeveloperLookup,
  options: SimulationOptions
) => {
  const {
    systemComplexity,
    nChanges,
    startingHealth,
    nSimulations = 200,
  } = options;
  const simulator = new TrajectorySimulator();

  const fromDeveloper = developerLookup.get(handoff.fromDeveloperId);
  const toDeveloper = developerLookup.get(handoff.toDeveloperId);

  if (!fromDeveloper || !toDeveloper) {
    return runDeveloperSimulation(
      fromDeveloper || ({ engineeringRigor: 0.5 } as any),
      options
    );
  }

  const handoffPoint = Math.min(handoff.atChange, nChanges);
  const recoveryChanges = Math.max(0, nChanges - handoffPoint);

  const runs = Array.from({ length: nSimulations }, () =>
    simulator.simulatePhased(
      [
        {
          engineeringRigor: fromDeveloper.engineeringRigor,
          nChanges: handoffPoint,
        },
        {
          engineeringRigor: toDeveloper.engineeringRigor,
          nChanges: recoveryChanges,
        },
      ],
      startingHealth,
      systemComplexity
    )
  );
  return summarizeRuns(runs);
};

const statsToDatasets = (
  label: string,
  color: string,
  stats: ReturnType<typeof summarizeRuns>,
  defaultVisibility: "all" | "averages-only",
  showTrajectoriesByDefault: boolean = true,
  handoffInfo?: { atChange: number; fromColor: string; toColor: string }
): Dataset[] => {
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

  const hideBands = defaultVisibility === "averages-only" || !showTrajectoriesByDefault;

  const getSegmentOptions = (isBand: boolean) => {
    if (!handoffInfo) return undefined;

    const fromColor = isBand
      ? hexToRgba(handoffInfo.fromColor, chartColors.bandOpacity)
      : handoffInfo.fromColor;
    const toColor = isBand
      ? hexToRgba(handoffInfo.toColor, chartColors.bandOpacity)
      : handoffInfo.toColor;

    return {
      borderColor: isBand
        ? () => "transparent"
        : (ctx: any) =>
            ctx.p0DataIndex < handoffInfo.atChange ? fromColor : toColor,
      backgroundColor: isBand
        ? (ctx: any) =>
            ctx.p0DataIndex < handoffInfo.atChange ? fromColor : toColor
        : undefined,
    };
  };

  const legendIcon = handoffInfo
    ? createLegendIcon(handoffInfo.fromColor, handoffInfo.toColor)
    : createLegendIcon(color);

  return [
    {
      label: `${label} (p90)`,
      data: p90Points,
      borderColor: "transparent",
      backgroundColor: handoffInfo
        ? hexToRgba(handoffInfo.fromColor, chartColors.bandOpacity)
        : hexToRgba(color, chartColors.bandOpacity),
      fill: "+1",
      tension: 0.25,
      pointRadius: 0,
      hidden: hideBands,
      segment: getSegmentOptions(true),
    },
    {
      label: `${label} (p10)`,
      data: p10Points,
      borderColor: "transparent",
      backgroundColor: "transparent",
      fill: false,
      tension: 0.25,
      pointRadius: 0,
      hidden: hideBands,
      segment: getSegmentOptions(true),
    },
    {
      label: `   ${label}`,
      data: avgPoints,
      borderColor: handoffInfo ? handoffInfo.fromColor : color,
      borderWidth: 2.5,
      backgroundColor: legendIcon,
      fill: false,
      tension: 0.25,
      pointRadius: 0,
      pointStyle: legendIcon,
      hidden: !showTrajectoriesByDefault,
      segment: getSegmentOptions(false),
    },
  ];
};

export const buildDatasetsForSimulation = (
  developers: DeveloperConfig[],
  handoffs: HandoffConfig[],
  options: SimulationOptions,
  defaultVisibility: "all" | "averages-only" = "all",
  showTrajectoriesByDefault: boolean = true
): Dataset[] => {
  const developerLookup = new Map(developers.map((a) => [a.id, a]));

  const developerDatasets = developers.flatMap((developer) => {
    const stats = runDeveloperSimulation(developer, options);
    return statsToDatasets(
      developer.name,
      developer.color,
      stats,
      defaultVisibility,
      showTrajectoriesByDefault
    );
  });

  const handoffDatasets = handoffs.flatMap((handoff) => {
    const fromDeveloper = developerLookup.get(handoff.fromDeveloperId);
    const toDeveloper = developerLookup.get(handoff.toDeveloperId);
    const stats = runHandoffSimulation(handoff, developerLookup, options);

    const handoffInfo =
      fromDeveloper && toDeveloper
        ? {
            atChange: handoff.atChange,
            fromColor: adjustColor(fromDeveloper.color, -20),
            toColor: adjustColor(toDeveloper.color, -20),
          }
        : undefined;

    return statsToDatasets(
      handoff.name,
      "#ccc",
      stats,
      defaultVisibility,
      showTrajectoriesByDefault,
      handoffInfo
    );
  });

  return [...developerDatasets, ...handoffDatasets];
};
