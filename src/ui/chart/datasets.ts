import { TrajectorySimulator, summarizeRuns } from "../../simulation";
import { hexToRgba } from "./colors";
import type { AgentConfig } from "../storage/types";

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

type AgentLookup = Map<string, AgentConfig>;

const runAgentSimulation = (
  agent: AgentConfig,
  agentLookup: AgentLookup,
  options: SimulationOptions
) => {
  const { systemComplexity, nChanges, nSimulations = 200 } = options;
  const simulator = new TrajectorySimulator();

  const handoffTarget = agent.handoffToId
    ? agentLookup.get(agent.handoffToId)
    : undefined;

  if (handoffTarget) {
    const handoffPoint = Math.round(nChanges * 0.2);
    const recoveryChanges = nChanges - handoffPoint;
    const runs = Array.from({ length: nSimulations }, () =>
      simulator.simulatePhased(
        [
          { engineeringRigor: agent.engineeringRigor, nChanges: handoffPoint },
          {
            engineeringRigor: handoffTarget.engineeringRigor,
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
    simulator.simulate({
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
  stats: ReturnType<typeof summarizeRuns>,
  defaultVisibility: "all" | "averages-only"
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

  const hideBands = defaultVisibility === "averages-only";

  return [
    {
      label: `${agent.name} (p90)`,
      data: p90Points,
      borderColor: "transparent",
      backgroundColor: hexToRgba(agent.color, 0.15),
      fill: "+1",
      tension: 0.25,
      pointRadius: 0,
      hidden: hideBands,
    },
    {
      label: `${agent.name} (p10)`,
      data: p10Points,
      borderColor: "transparent",
      backgroundColor: "transparent",
      fill: false,
      tension: 0.25,
      pointRadius: 0,
      hidden: hideBands,
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
  options: SimulationOptions,
  defaultVisibility: "all" | "averages-only" = "all"
): Dataset[] => {
  const agentLookup = new Map(agents.map((a) => [a.id, a]));
  return agents.flatMap((agent) => {
    const stats = runAgentSimulation(agent, agentLookup, options);
    return statsToDatasets(agent, stats, defaultVisibility);
  });
};

