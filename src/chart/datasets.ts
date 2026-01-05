import {
  scenarioKeys,
  scenarios,
  simulateScenario,
  complexityProfiles,
  complexityProfileKeys,
  type ComplexityProfileKey,
} from "../simulation";
import { scenarioColors, hexToRgba } from "./colors";

export type Dataset = {
  label: string;
  data: { x: number; y: number }[];
  borderColor: string;
  backgroundColor: string;
  fill: string | boolean;
  tension: number;
  pointRadius: number;
  hidden: boolean;
};

/** Build chart datasets for a given system complexity level */
export const buildDatasetsForComplexity = (
  systemComplexity: number
): Dataset[] =>
  scenarioKeys.flatMap((key) => {
    const stats = simulateScenario(key, {
      nSimulations: 800,
      systemComplexity,
    });
    const color = scenarioColors[key];

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
        hidden: true,
      },
      {
        label: `${scenarios[key].label} (p10)`,
        data: p10Points,
        borderColor: "transparent",
        backgroundColor: "transparent",
        fill: false,
        tension: 0.25,
        pointRadius: 0,
        hidden: true,
      },
      {
        label: scenarios[key].label,
        data: avgPoints,
        borderColor: color,
        backgroundColor: color,
        fill: false,
        tension: 0.25,
        pointRadius: 0,
        hidden: true,
      },
    ];
  });

/** Pre-compute datasets for all complexity levels */
export const precomputeAllDatasets = (): Record<
  ComplexityProfileKey,
  Dataset[]
> => {
  const result = {} as Record<ComplexityProfileKey, Dataset[]>;

  for (const key of complexityProfileKeys) {
    const profile = complexityProfiles[key];
    result[key] = buildDatasetsForComplexity(profile.systemComplexity);
  }

  return result;
};

