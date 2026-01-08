export type AgentConfig = {
  id: string;
  name: string;
  engineeringRigor: number;
  color: string;
  handoffToId?: string;
};

export type Simulation = {
  id: string;
  name: string;
  agents: AgentConfig[];
  systemComplexity: number;
  complexityDescription?: string;
  nChanges: number;
};

export type GlobalConfig = {
  defaultVisibility: "all" | "averages-only";
  activeSimulationId: string;
};

export type AppData = {
  simulations: Simulation[];
  globalConfig: GlobalConfig;
  version: number;
};
