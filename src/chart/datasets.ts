import {
  simulateTrajectory,
  simulatePhasedTrajectory,
  summarizeRuns,
} from "../simulation";
import { hexToRgba } from "./colors";
import type { AgentConfig } from "../ui/types";
import { AgentProfiles } from "../scenarios/AgentProfiles";

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

type SimulationOptions = {
  systemComplexity: number;
  nChanges: number;
  nSimulations?: number;
};

const runAgentSimulation = (agent: AgentConfig, options: SimulationOptions) => {
  const { systemComplexity, nChanges, nSimulations = 200 } = options;

  if (agent.enableHandoff) {
    const handoffPoint = Math.round(nChanges * 0.2);
    const recoveryChanges = nChanges - handoffPoint;
    const runs = Array.from({ length: nSimulations }, () =>
      simulatePhasedTrajectory(
        [
          { engineeringRigor: agent.engineeringRigor, nChanges: handoffPoint },
          {
            engineeringRigor: AgentProfiles.senior.engineeringRigor,
            nChanges: recoveryChanges,
          },
        ],
        8,
        systemComplexity
      )
    );
    return summarizeRuns(runs);
  }

  const runs = Array.from({ length: nSimulations }, () =>
    simulateTrajectory({
      engineeringRigor: agent.engineeringRigor,
      systemComplexity,
      nChanges,
      startValue: 8,
    })
  );
  return summarizeRuns(runs);
};

const statsToDatasets = (
  agent: AgentConfig,
  stats: ReturnType<typeof summarizeRuns>
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

  return [
    {
      label: `${agent.name} (p90)`,
      data: p90Points,
      borderColor: "transparent",
      backgroundColor: hexToRgba(agent.color, 0.15),
      fill: "+1",
      tension: 0.25,
      pointRadius: 0,
      hidden: false,
    },
    {
      label: `${agent.name} (p10)`,
      data: p10Points,
      borderColor: "transparent",
      backgroundColor: "transparent",
      fill: false,
      tension: 0.25,
      pointRadius: 0,
      hidden: false,
    },
    {
      label: agent.name,
      data: avgPoints,
      borderColor: agent.color,
      backgroundColor: agent.color,
      fill: false,
      tension: 0.25,
      pointRadius: 0,
      hidden: false,
    },
  ];
};

export const buildDatasetsForAgents = (
  agents: AgentConfig[],
  options: SimulationOptions
): Dataset[] =>
  agents.flatMap((agent) => {
    const stats = runAgentSimulation(agent, options);
    return statsToDatasets(agent, stats);
  });
